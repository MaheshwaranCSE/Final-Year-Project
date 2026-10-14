package com.blockvault.service.alert;

import com.blockvault.entity.CameraIncidentEntity;
import com.blockvault.repository.CameraIncidentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageResponse;

import java.util.HashMap;
import java.util.Map;

/**
 * Service responsible for dispatching camera security and integrity incidents to AWS SQS.
 * If AWS credentials or queue URL are missing, gracefully logs and marks as AWS_NOT_CONFIGURED.
 */
@Service
public class AlertNotificationService {

    private static final Logger log = LoggerFactory.getLogger(AlertNotificationService.class);

    @Autowired(required = false)
    private SqsClient sqsClient;

    @Value("${aws.sqs.queue-url:}")
    private String sqsQueueUrl;

    @Autowired
    private CameraIncidentRepository incidentRepo;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void dispatchIncidentAlert(CameraIncidentEntity incident) {
        if (incident == null) {
            return;
        }

        if (sqsClient == null || sqsQueueUrl == null || sqsQueueUrl.trim().isEmpty()) {
            incident.setDeliveryStatus("AWS_NOT_CONFIGURED");
            incident.setDeliveryError("AWS SQS queue URL or credentials are not configured in environment. Local incident recorded.");
            incidentRepo.save(incident);
            log.info("Incident {} recorded locally (AWS SQS not configured)", incident.getIncidentId());
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("incidentId", incident.getIncidentId());
            payload.put("cameraId", incident.getCameraId());
            payload.put("type", incident.getType());
            payload.put("severity", incident.getSeverity());
            payload.put("title", incident.getTitle());
            payload.put("details", incident.getDetails());
            payload.put("detectedAt", incident.getDetectedAt().toString());

            String jsonBody = objectMapper.writeValueAsString(payload);

            SendMessageRequest sendMsgRequest = SendMessageRequest.builder()
                    .queueUrl(sqsQueueUrl.trim())
                    .messageBody(jsonBody)
                    .build();

            SendMessageResponse response = sqsClient.sendMessage(sendMsgRequest);
            incident.setSqsMessageId(response.messageId());
            incident.setDeliveryStatus("ENQUEUED_SQS");
            incident.setDeliveryError(null);
            incidentRepo.save(incident);

            log.info("Dispatched incident {} to AWS SQS (MessageId: {})", incident.getIncidentId(), response.messageId());

        } catch (Exception e) {
            log.warn("Failed to dispatch incident {} to AWS SQS: {}", incident.getIncidentId(), e.getMessage());
            incident.setDeliveryStatus("FAILED");
            incident.setDeliveryError("SQS dispatch error: " + e.getMessage());
            incidentRepo.save(incident);
        }
    }
}
