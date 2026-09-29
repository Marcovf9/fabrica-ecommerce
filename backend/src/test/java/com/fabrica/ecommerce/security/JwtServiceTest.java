package com.fabrica.ecommerce.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    // Clave que estaba hardcodeada en el repo: ya no debe aceptarse
    private static final String LEAKED_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final String CONFIGURED_KEY = "q4H3pZ8m0xY1vC7bN2kL5sR9tW6uE3aJ0fG8hD1iO4c=";

    private final UserDetails admin = User.withUsername("admin").password("x").authorities(List.of()).build();

    @Test
    void issuesAndValidatesTokensWithConfiguredSecret() {
        JwtService service = new JwtService(CONFIGURED_KEY);

        String token = service.generateToken(admin);

        assertThat(service.extractUsername(token)).isEqualTo("admin");
        assertThat(service.isTokenValid(token, admin)).isTrue();
        assertThat(new JwtService(CONFIGURED_KEY).isTokenValid(token, admin)).isTrue();
    }

    @Test
    void withoutSecret_usesRandomKeyInsteadOfTheLeakedOne() {
        JwtService service = new JwtService("");
        String forged = Jwts.builder()
                .setSubject("admin")
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(LEAKED_KEY)), SignatureAlgorithm.HS256)
                .compact();

        assertThat(service.isTokenValid(service.generateToken(admin), admin)).isTrue();
        assertThatThrownBy(() -> service.extractUsername(forged)).isInstanceOf(SignatureException.class);
    }
}
