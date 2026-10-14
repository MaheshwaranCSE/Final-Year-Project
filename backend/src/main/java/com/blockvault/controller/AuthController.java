package com.blockvault.controller;

import com.blockvault.dto.Dtos.*;
import com.blockvault.entity.User;
import com.blockvault.repository.UserRepository;
import com.blockvault.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();
        
        String jwt = jwtUtils.generateJwtToken(user.getEmail(), user.getRole(), user.getName());

        UserDto userDto = new UserDto(
                user.getEmail(),
                user.getEmail(),
                user.getName(),
                user.getRole()
        );

        return ResponseEntity.ok(new AuthResponse(jwt, userDto));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        
        if (signUpRequest.getRole() != null && !signUpRequest.getRole().isEmpty()) {
            user.setRole(signUpRequest.getRole());
        } else {
            user.setRole("user");
        }

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new MessageResponse("Not authenticated"));
        }
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("User not found"));
        }
        
        UserDto userDto = new UserDto(
                user.getEmail(),
                user.getEmail(),
                user.getName(),
                user.getRole()
        );
        return ResponseEntity.ok(userDto);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        // JWT is stateless so just return success, frontend clears token
        return ResponseEntity.ok(new MessageResponse("Log out successful!"));
    }
}
