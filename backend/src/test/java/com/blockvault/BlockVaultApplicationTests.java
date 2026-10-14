package com.blockvault;

import com.blockvault.entity.User;
import com.blockvault.repository.UserRepository;
import com.blockvault.security.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BlockVaultApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Test
    void contextLoads() {
        assertNotNull(userRepository);
        assertNotNull(jwtUtils);
    }

    @Test
    void testSeededUsersExist() {
        Optional<User> admin = userRepository.findByEmail("ADM-00001");
        assertTrue(admin.isPresent(), "Admin 01 should be seeded");
        assertEquals("admin", admin.get().getRole());

        Optional<User> police = userRepository.findByEmail("POL-00001");
        assertTrue(police.isPresent(), "Police 01 should be seeded");
        assertEquals("police", police.get().getRole());

        Optional<User> doctor = userRepository.findByEmail("DOC-00001");
        assertTrue(doctor.isPresent(), "Doctor 01 should be seeded");
        assertEquals("doctor", doctor.get().getRole());

        Optional<User> court = userRepository.findByEmail("CRT-00001");
        assertTrue(court.isPresent(), "Court 01 should be seeded");
        assertEquals("court", court.get().getRole());
    }

    @Test
    void testJwtGenerationAndValidation() {
        String token = jwtUtils.generateJwtToken("TEST-USER", "police", "Officer Test");
        assertNotNull(token);
        assertTrue(jwtUtils.validateJwtToken(token));
        assertEquals("TEST-USER", jwtUtils.getUserNameFromJwtToken(token));
    }
}