package com.blockvault.service.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Generates and validates HMAC-SHA256 short-lived, camera-scoped stream tokens.
 * Allows safe streaming to browser <img> elements without exposing permanent credentials or session cookies.
 */
@Service
public class StreamTokenService {

    @Value("${app.camera.stream-token-secret:bv_stream_sec_99382f8a10cbe774102947192837419028347102}")
    private String tokenSecret;

    private static final long DEFAULT_TTL_SECONDS = 120; // 2 minutes

    public String generateStreamToken(String cameraId, String userId) {
        long expiresAt = Instant.now().plusSeconds(DEFAULT_TTL_SECONDS).toEpochMilli();
        String payload = cameraId + ":" + userId + ":" + expiresAt;
        String signature = computeHmac(payload);
        return payload + ":" + signature;
    }

    public boolean validateStreamToken(String token, String expectedCameraId) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        String[] parts = token.split(":");
        if (parts.length != 4) {
            return false;
        }

        String cameraId = parts[0];
        String userId = parts[1];
        long expiresAt;
        try {
            expiresAt = Long.parseLong(parts[2]);
        } catch (NumberFormatException e) {
            return false;
        }
        String providedSignature = parts[3];

        if (!cameraId.equals(expectedCameraId)) {
            return false;
        }

        if (System.currentTimeMillis() > expiresAt) {
            return false; // Token expired
        }

        String payload = cameraId + ":" + userId + ":" + expiresAt;
        String expectedSignature = computeHmac(payload);

        return MessageDigest.isEqual(
                providedSignature.getBytes(StandardCharsets.UTF_8),
                expectedSignature.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String computeHmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }
}
