package com.blockvault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.blockvault.repository.UserRepository;
import com.blockvault.entity.User;

@SpringBootApplication
public class BlockVaultApplication {
    public static void main(String[] args) {
        SpringApplication.run(BlockVaultApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            seedUserIfMissing(userRepository, passwordEncoder, "ADM-00001", "BlockVault@Adm01!", "admin", "Admin 01");
            seedUserIfMissing(userRepository, passwordEncoder, "ADM-00002", "BlockVault@Adm02!", "admin", "Admin 02");
            seedUserIfMissing(userRepository, passwordEncoder, "POL-00001", "BlockVault@Pol01!", "police", "Police 01");
            seedUserIfMissing(userRepository, passwordEncoder, "POL-00002", "BlockVault@Pol02!", "police", "Police 02");
            seedUserIfMissing(userRepository, passwordEncoder, "DOC-00001", "BlockVault@Doc01!", "doctor", "Doctor 01");
            seedUserIfMissing(userRepository, passwordEncoder, "DOC-00002", "BlockVault@Doc02!", "doctor", "Doctor 02");
            seedUserIfMissing(userRepository, passwordEncoder, "CRT-00001", "BlockVault@Crt01!", "court", "Court 01");
            seedUserIfMissing(userRepository, passwordEncoder, "CRT-00002", "BlockVault@Crt02!", "court", "Court 02");
            seedUserIfMissing(userRepository, passwordEncoder, "USR-00001", "BlockVault@Usr01!", "user", "User 01");
            seedUserIfMissing(userRepository, passwordEncoder, "USR-00002", "BlockVault@Usr02!", "user", "User 02");
        };
    }

    private void seedUserIfMissing(UserRepository repo, PasswordEncoder encoder, String email, String rawPassword, String role, String name) {
        if (repo.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setPassword(encoder.encode(rawPassword));
            user.setRole(role);
            user.setName(name);
            repo.save(user);
        }
    }
}
