package com.fabrica.ecommerce.security;

import com.fabrica.ecommerce.model.AdminUser;
import com.fabrica.ecommerce.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final AdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (repository.findByUsername("marco").isEmpty()) {
            AdminUser admin = new AdminUser();
            admin.setUsername("marco");
            admin.setPassword(passwordEncoder.encode("admin123"));
            repository.save(admin);
            System.out.println("=========================================");
            System.out.println("✅ USUARIO ADMIN CREADO EXITOSAMENTE");
            System.out.println("=========================================");
        }
    }
}