package com.blockvault.service.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class SsrfValidatorTest {

    private SsrfValidator ssrfValidator;

    @BeforeEach
    void setUp() {
        ssrfValidator = new SsrfValidator();
        ReflectionTestUtils.setField(ssrfValidator, "allowLanIps", true);
    }

    @Test
    void testLoopbackIsBlocked() {
        assertThrows(SecurityException.class, () -> {
            ssrfValidator.validateAndResolveUrl("http://127.0.0.1:8080/video");
        });
        assertThrows(SecurityException.class, () -> {
            ssrfValidator.validateAndResolveUrl("http://localhost:8080/video");
        });
    }

    @Test
    void testAwsMetadataIsBlocked() {
        assertThrows(SecurityException.class, () -> {
            ssrfValidator.validateAndResolveUrl("http://169.254.169.254/latest/meta-data/");
        });
    }

    @Test
    void testUnauthorizedPortIsBlocked() {
        assertThrows(SecurityException.class, () -> {
            ssrfValidator.validateAndResolveUrl("http://192.168.1.50:22/video");
        });
        assertThrows(SecurityException.class, () -> {
            ssrfValidator.validateAndResolveUrl("http://192.168.1.50:3306/video");
        });
    }

    @Test
    void testInvalidSchemeIsBlocked() {
        assertThrows(SecurityException.class, () -> {
            ssrfValidator.validateAndResolveUrl("ftp://192.168.1.50:8080/video");
        });
        assertThrows(SecurityException.class, () -> {
            ssrfValidator.validateAndResolveUrl("file:///etc/passwd");
        });
    }

    @Test
    void testCredentialRedaction() {
        String raw = "http://admin:secret123@192.168.1.42:8080/video";
        String redacted = ssrfValidator.redactCredentials(raw);
        assertEquals("http://***:***@192.168.1.42:8080/video", redacted);

        String clean = "http://192.168.1.42:8080/video";
        assertEquals(clean, ssrfValidator.redactCredentials(clean));
    }
}
