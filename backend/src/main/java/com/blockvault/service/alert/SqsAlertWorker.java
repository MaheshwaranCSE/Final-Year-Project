package com.blockvault.service.alert;

import com.blockvault.entity.CameraIncidentEntity;
import com.blockvault.repository.CameraIncidentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.List;
import java.util.Optional;

/**
 * Background consumer worker that polls AWS SQS for pending camera incident messages,
 * publishes them to AWS SNS for email/SMS alert broadcast, and deletes processed messages.
 */
@Component
public class SqsAlertWorker {

    private static final Logger log = LoggerFactory.getLogger(SqsAlertWorker.class);

    @Autowired(required = false)
    private SqsClient sqsClient;

    @Autowired(required = false)
    private SnsClient snsClient;

    @Value("${aws.sqs.queue-url:}")
    private String sqsQueueUrl;

    @Value("${aws.sns.topic-arn:}")
    private String snsTopicArn;

    @Autowired
    private CameraIncidentRepository incidentRepo;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(fixedDelay = 6000)
    public void processSqsQueue() {
        if (sqsClient == null || sqsQueueUrl == null || sqsQueueUrl.trim().isEmpty()) {
            return;
        }

        try {
            ReceiveMessageRequest receiveRequest = ReceiveMessageRequest.builder()
                    .queueUrl(sqsQueueUrl.trim())
                    .maxNumberOfMessages(5)
                    .waitTimeSeconds(2)
                    .build();

            ReceiveMessageResponse receiveResponse = sqsClient.receiveMessage(receiveRequest);
            List<Message> messages = receiveResponse.messages();

            if (messages.isEmpty()) {
                return;
            }

            for (Message msg : messages) {
                processMessage(msg);
            }
        } catch (Exception e) {
            log.warn("SQS worker poll encountered exception: {}", e.getMessage());
        }
    }

    private void processMessage(Message msg) {
        String receiptHandle = msg.receiptHandle();
        String body = msg.body();

        try {
            JsonNode node = objectMapper.readTree(body);
            String incidentId = node.has("incidentId") ? node.get("incidentId").asText() : null;

            if (incidentId != null) {
                Optional<CameraIncidentEntity> opt = incidentRepo.findByIncidentId(incidentId);
                if (opt.isPresent()) {
                    CameraIncidentEntity incident = opt.get();

                    if (snsClient != null && snsTopicArn != null && !snsTopicArn.trim().isEmpty()) {
                        String emailSubject = String.format("[BlockVault Alert - %s] %s", incident.getSeverity(), incident.getTitle());
                        String emailBody = String.format("""
                                === BLOCKVAULT CAMERA INCIDENT NOTIFICATION ===
                                
                                Incident ID: %s
                                Camera ID: %s
                                Incident Type: %s
                                Severity Level: %s
                                Detected At: %s
                                
                                Details:
                                %s
                                
                                -----------------------------------------------
                                Digital Chain of Custody System — BlockVault
                                """,
                                incident.getIncidentId(),
                                incident.getCameraId(),
                                incident.getType(),
                                incident.getSeverity(),
                                incident.getDetectedAt(),
                                incident.getDetails()
                        );

                        PublishRequest publishRequest = PublishRequest.builder()
                                .topicArn(snsTopicArn.trim())
                                .subject(emailSubject.length() > 100 ? emailSubject.substring(0, 97) + "..." : emailSubject)
                                .message(emailBody)
                                .build();

                        PublishResponse pubResp = snsClient.publish(publishRequest);
                        incident.setSnsPublished(true);
                        incident.setDeliveryStatus("PUBLISHED_TO_SNS");
                        incident.setDeliveryError(null);
                        incidentRepo.save(incident);
                        log.info("Published incident {} to SNS (MessageId: {})", incidentId, pubResp.messageId());
                    } else {
                        incident.setDeliveryStatus("ENQUEUED_SQS_SNS_NOT_CONFIGURED");
                        incidentRepo.save(incident);
                    }
                }
            }

            // Acknowledge and delete message from queue
            DeleteMessageRequest delReq = DeleteMessageRequest.builder()
                    .queueUrl(sqsQueueUrl.trim())
                    .receiptHandle(receiptHandle)
                    .build();
            sqsClient.deleteMessage(delReq);

        } catch (Exception e) {
            log.error("Failed to process SQS message {}: {}", msg.messageId(), e.getMessage());
        }
    }
}
