package com.fabrica.ecommerce.security;

import com.fabrica.ecommerce.model.AdminUser;
import com.fabrica.ecommerce.repository.AdminUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DatabaseSeederTest {

    private final AdminUserRepository repository = mock(AdminUserRepository.class);
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);

    @Test
    void withoutAdminUsers_doesNothing() {
        new DatabaseSeeder(repository, encoder, "").run();

        verifyNoInteractions(repository);
    }

    @Test
    void createsMissingUsers() {
        when(repository.findByUsername("ana")).thenReturn(Optional.empty());

        new DatabaseSeeder(repository, encoder, "ana:s3cr:et").run();

        verify(repository).save(argThat(u -> u.getUsername().equals("ana") && encoder.matches("s3cr:et", u.getPassword())));
    }

    @Test
    void rotatesPasswordOfExistingUserWhenItChanged() {
        AdminUser existing = admin("ana", "vieja");
        when(repository.findByUsername("ana")).thenReturn(Optional.of(existing));

        new DatabaseSeeder(repository, encoder, "ana:nueva").run();

        assertThat(encoder.matches("nueva", existing.getPassword())).isTrue();
        verify(repository).save(existing);
    }

    @Test
    void leavesExistingUserUntouchedWhenPasswordMatches() {
        when(repository.findByUsername("ana")).thenReturn(Optional.of(admin("ana", "igual")));

        new DatabaseSeeder(repository, encoder, "ana:igual").run();

        verify(repository, never()).save(any());
    }

    @Test
    void parse_rejectsMalformedEntries() {
        assertThat(DatabaseSeeder.parse(" ana:1, beto:2")).containsEntry("ana", "1").containsEntry("beto", "2");
        assertThatThrownBy(() -> DatabaseSeeder.parse("ana")).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> DatabaseSeeder.parse("ana:")).isInstanceOf(IllegalStateException.class);
    }

    private AdminUser admin(String username, String rawPassword) {
        AdminUser user = new AdminUser();
        user.setUsername(username);
        user.setPassword(encoder.encode(rawPassword));
        return user;
    }
}
