package com.blockvault.service.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Enterprise SSRF Defense Validator
 * Enforces destination validation, DNS rebinding mitigation, IP range restrictions,
 * and credential redaction for camera stream endpoints.
 */
@Service
public class SsrfValidator {

    @Value("${app.camera.allow-lan-ips:true}")
    private boolean allowLanIps;

    // Allowed ports for IP Webcam and streaming devices
    private static final Set<Integer> ALLOWED_PORTS = new HashSet<>(Arrays.asList(
            80, 443, 8080, 8081, 8082, 8000, 8008, 8888, 5000, 9000
    ));

    private static final Pattern CREDENTIAL_URL_PATTERN = Pattern.compile("^(https?://)([^:@/]+):([^@/]+)@(.*)$", Pattern.CASE_INSENSITIVE);

    /**
     * Redacts credentials embedded in a URL for safe logging, storage, and UI presentation.
     * e.g., "http://admin:secret@192.168.1.50:8080/video" -> "http://***:***@192.168.1.50:8080/video"
     */
    public String redactCredentials(String url) {
        if (url == null) return null;
        Matcher matcher = CREDENTIAL_URL_PATTERN.matcher(url);
        if (matcher.matches()) {
            return matcher.group(1) + "***:***@" + matcher.group(4);
        }
        return url;
    }

    /**
     * Validates a candidate camera stream URL against SSRF policy.
     * Resolves DNS server-side and checks the target IP addresses.
     *
     * @param rawUrl Stream or snapshot URL
     * @return Resolved verified InetAddress
     * @throws SecurityException If URL violates SSRF policy
     */
    public InetAddress validateAndResolveUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            throw new SecurityException("Stream URL cannot be null or empty.");
        }

        URI uri;
        try {
            uri = URI.create(rawUrl.trim());
        } catch (Exception e) {
            throw new SecurityException("Malformed stream URL: invalid URI syntax.");
        }

        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new SecurityException("Invalid protocol scheme: only HTTP and HTTPS are permitted.");
        }

        int port = uri.getPort();
        if (port == -1) {
            port = scheme.equalsIgnoreCase("https") ? 443 : 80;
        }

        if (!ALLOWED_PORTS.contains(port)) {
            throw new SecurityException("Port " + port + " is not an authorized streaming port.");
        }

        String host = uri.getHost();
        if (host == null || host.trim().isEmpty()) {
            throw new SecurityException("Stream URL host cannot be empty.");
        }

        // Server-side DNS resolution
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw new SecurityException("Host DNS resolution failed: unreachable camera domain.");
        }

        if (addresses == null || addresses.length == 0) {
            throw new SecurityException("Host DNS resolution yielded no network address.");
        }

        // Validate each resolved IP address (defends against DNS multi-homing / rebinding attacks)
        for (InetAddress addr : addresses) {
            validateIpAddress(addr);
        }

        return addresses[0];
    }

    /**
     * Inspects an IP address against forbidden network blocks.
     */
    public void validateIpAddress(InetAddress addr) {
        // Block Loopback (127.0.0.0/8, ::1)
        if (addr.isLoopbackAddress()) {
            throw new SecurityException("Access to loopback address (" + addr.getHostAddress() + ") is prohibited.");
        }

        // Block AnyLocalAddress (0.0.0.0)
        if (addr.isAnyLocalAddress()) {
            throw new SecurityException("Access to wild-card local address is prohibited.");
        }

        // Block Link-Local (169.254.0.0/16 - includes AWS Cloud metadata 169.254.169.254)
        if (addr.isLinkLocalAddress() || addr.getHostAddress().startsWith("169.254.")) {
            throw new SecurityException("Access to link-local / cloud instance metadata (169.254.x.x) is prohibited.");
        }

        // Block Multicast
        if (addr.isMulticastAddress()) {
            throw new SecurityException("Access to multicast IP range is prohibited.");
        }

        // Check Site-Local / Private RFC-1918 (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (addr.isSiteLocalAddress()) {
            if (!allowLanIps) {
                throw new SecurityException("Access to private local network addresses is disallowed by policy.");
            }
        }
    }
}
