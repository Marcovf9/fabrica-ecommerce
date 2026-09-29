package com.fabrica.ecommerce.security;

import com.fabrica.ecommerce.model.AdminUser;
import com.fabrica.ecommerce.repository.AdminUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Crea o actualiza los usuarios del panel de administración a partir de la variable
 * de entorno ADMIN_USERS, con el formato {@code usuario1:clave1,usuario2:clave2}.
 * Si un usuario ya existe y su clave no coincide, se reemplaza: así se rotan claves
 * cambiando la variable y reiniciando. Sin la variable no se toca la base.
 */
@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final AdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsers;

    public DatabaseSeeder(AdminUserRepository repository,
                          PasswordEncoder passwordEncoder,
                          @Value("${admin.users:}") String adminUsers) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsers = adminUsers;
    }

    @Override
    public void run(String... args) {
        Map<String, String> credentials = parse(adminUsers);
        if (credentials.isEmpty()) {
            log.info("ADMIN_USERS no está configurada: no se crean ni actualizan usuarios de administración.");
            return;
        }

        credentials.forEach((username, rawPassword) -> {
            AdminUser admin = repository.findByUsername(username).orElse(null);
            if (admin == null) {
                admin = new AdminUser();
                admin.setUsername(username);
                admin.setPassword(passwordEncoder.encode(rawPassword));
                repository.save(admin);
                log.info("Usuario de administración creado: {}", username);
            } else if (!passwordEncoder.matches(rawPassword, admin.getPassword())) {
                admin.setPassword(passwordEncoder.encode(rawPassword));
                repository.save(admin);
                log.info("Clave actualizada para el usuario de administración: {}", username);
            }
        });
    }

    static Map<String, String> parse(String value) {
        Map<String, String> credentials = new LinkedHashMap<>();
        if (value == null || value.isBlank()) return credentials;

        for (String entry : value.split(",")) {
            int separator = entry.indexOf(':');
            if (separator <= 0 || separator == entry.length() - 1) {
                throw new IllegalStateException("ADMIN_USERS mal formada: cada entrada debe ser usuario:clave");
            }
            credentials.put(entry.substring(0, separator).trim(), entry.substring(separator + 1));
        }
        return credentials;
    }
}
