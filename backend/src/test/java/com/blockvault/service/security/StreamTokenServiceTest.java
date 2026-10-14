package com.blockvault.service.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class StreamTokenServiceTest {

    private StreamTokenService streamTokenService;

    @BeforeEach
    void setUp() {
        streamTokenService = new StreamTokenService();
        ReflectionTestUtils.setField(streamTokenService, "tokenSecret", "test_secret_key_1234567890_abcdef");
    }

    @Test
    void testValidTokenVerification() {
        String cameraId = "CAM-01";
        String userId = "ADM-00001";
        String token = streamTokenService.generateStreamToken(cameraId, userId);

        assertNotNull(token);
        assertTrue(streamTokenService.validateStreamToken(token, cameraId));
    }

    @Test
    void testCameraIdMismatchFails() {
        String token = streamTokenService.generateStreamToken("CAM-01", "ADM-00001");
        assertFalse(streamTokenService.validateStreamToken(token, "CAM-02"));
    }

    @Test
    void testTamperedTokenFails() {
        String token = streamTokenService.generateStreamToken("CAM-01", "ADM-00001");
        String tampered = token.substring(0, token.length() - 2) + "aa";
        assertFalse(streamTokenService.validateStreamToken(tampered, "CAM-01"));
    }

    @Test
    void testMalformedTokenFails() {
        assertFalse(streamTokenService.validateStreamToken(null, "CAM-01"));
        assertFalse(streamTokenService.validateStreamToken("", "CAM-01"));
        assertFalse(streamTokenService.validateStreamToken("invalid:token:format", "CAM-01"));
    }
}
