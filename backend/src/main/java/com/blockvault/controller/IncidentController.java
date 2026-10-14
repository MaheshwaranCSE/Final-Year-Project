package com.blockvault.controller;

import com.blockvault.entity.CameraIncidentEntity;
import com.blockvault.repository.CameraIncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    @Autowired
    private CameraIncidentRepository incidentRepo;

    @Autowired(required = false)
    private SqsClient sqsClient;

    @Autowired(required = false)
    private SnsClient snsClient;

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Value("${aws.sqs.queue-url:}")
    private String sqsQueueUrl;

    @Value("${aws.sns.topic-arn:}")
    private String snsTopicArn;

    @GetMapping
    public ResponseEntity<List<CameraIncidentEntity>> getIncidents(
            @RequestParam(required = false) String cameraId,
            @RequestParam(required = false) String status) {

        List<CameraIncidentEntity> incidents;

        if (cameraId != null && !cameraId.trim().isEmpty()) {
            if (status != null && !status.trim().isEmpty()) {
                incidents = incidentRepo.findByCameraIdAndStatus(cameraId, status.toUpperCase());
            } else {
                incidents = incidentRepo.findByCameraIdOrderByDetectedAtDesc(cameraId);
            }
        } else if (status != null && !status.trim().isEmpty()) {
            incidents = incidentRepo.findByStatusOrderByDetectedAtDesc(status.toUpperCase());
        } else {
            incidents = incidentRepo.findTop50ByOrderByDetectedAtDesc();
        }

        return ResponseEntity.ok(incidents);
    }

    @PostMapping("/{incidentId}/resolve")
    public ResponseEntity<?> resolveIncident(
            @PathVariable String incidentId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        Optional<CameraIncidentEntity> opt = incidentRepo.findByIncidentId(incidentId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String username = authentication != null ? authentication.getName() : "security-admin";
        String notes = (body != null && body.containsKey("notes")) ? body.get("notes") : "Resolved manually by operator.";

        CameraIncidentEntity incident = opt.get();
        incident.setStatus("RESOLVED");
        incident.setResolvedAt(Instant.now());
        incident.setResolvedBy(username);
        incident.setResolutionNotes(notes);

        CameraIncidentEntity saved = incidentRepo.save(incident);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/alerts/status")
    public ResponseEntity<?> getAlertPipelineStatus() {
        boolean sqsOk = sqsClient != null && sqsQueueUrl != null && !sqsQueueUrl.trim().isEmpty();
        boolean snsOk = snsClient != null && snsTopicArn != null && !snsTopicArn.trim().isEmpty();

        String pipelineStatus;
        if (sqsOk && snsOk) {
            pipelineStatus = "ACTIVE_END_TO_END";
        } else if (sqsOk) {
            pipelineStatus = "SQS_ONLY_SNS_UNCONFIGURED";
        } else {
            pipelineStatus = "AWS_NOT_CONFIGURED_LOCAL_FALLBACK";
        }

        long totalIncidents = incidentRepo.count();
        long openIncidents = incidentRepo.findByStatusOrderByDetectedAtDesc("OPEN").size();

        return ResponseEntity.ok(Map.of(
                "pipelineStatus", pipelineStatus,
                "awsRegion", awsRegion,
                "sqsConfigured", sqsOk,
                "sqsQueueMasked", maskResource(sqsQueueUrl),
                "snsConfigured", snsOk,
                "snsTopicMasked", maskResource(snsTopicArn),
                "totalIncidents", totalIncidents,
                "openIncidents", openIncidents
        ));
    }

    private String maskResource(String res) {
        if (res == null || res.trim().isEmpty()) {
            return "NOT_SET";
        }
        int len = res.length();
        if (len <= 10) return "****";
        return res.substring(0, 4) + "..." + res.substring(len - 6);
    }
}
