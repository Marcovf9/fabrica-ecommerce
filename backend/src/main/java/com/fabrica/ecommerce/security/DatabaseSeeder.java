package com.fabrica.ecommerce.security;

import com.fabrica.ecommerce.model.AdminUser;
import com.fabrica.ecommerce.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final AdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Matriz de usuarios autorizados. Cambia las contraseñas por claves reales antes de compilar.
        List<String[]> authorizedStaff = List.of(
            new String[]{"marcovergara.ritual", "marco.19"},
            new String[]{"karinafaraon.ritual", "kari123"},
            new String[]{"mateofaraon.ritual", "mateo123"}
        );

        System.out.println("=========================================");
        for (String[] credentials : authorizedStaff) {
            String username = credentials[0];
            String rawPassword = credentials[1];

            if (repository.findByUsername(username).isEmpty()) {
                AdminUser admin = new AdminUser();
                admin.setUsername(username);
                admin.setPassword(passwordEncoder.encode(rawPassword));
                repository.save(admin);
                System.out.println("✅ ACCESO CREADO: " + username);
            }
        }
        System.out.println("=========================================");
    }
}