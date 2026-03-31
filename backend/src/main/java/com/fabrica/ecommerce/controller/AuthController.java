package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.repository.AdminUserRepository;
import com.fabrica.ecommerce.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AdminUserRepository repository;
    private final JwtService jwtService;

    public record AuthRequest(String username, String password) {}
    public record AuthResponse(String token) {}

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        
        UserDetails user = repository.findByUsername(request.username()).orElseThrow();
        String jwtToken = jwtService.generateToken(user);
        
        return ResponseEntity.ok(new AuthResponse(jwtToken));
    }
}