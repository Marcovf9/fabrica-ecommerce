package com.fabrica.ecommerce.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class MetaConversionsService {

    private static final String PIXEL_ID = "1692923315300704";
    private static final String CAPI_URL =
            "https://graph.facebook.com/v20.0/" + PIXEL_ID + "/events";

    @Value("${meta.capi.access.token:}")
    private String accessToken;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendPurchaseEvent(String orderCode, BigDecimal value, List<Long> productIds) {
        if (accessToken == null || accessToken.isBlank()) {
            log.warn("META CAPI: access token no configurado, evento omitido");
            return;
        }

        Map<String, Object> customData = Map.of(
                "currency", "ARS",
                "value", value,
                "order_id", orderCode,
                "content_ids", productIds.stream().map(String::valueOf).toList(),
                "content_type", "product"
        );

        Map<String, Object> event = Map.of(
                "event_name", "Purchase",
                "event_time", Instant.now().getEpochSecond(),
                "event_id", orderCode,
                "action_source", "website",
                "event_source_url", "https://ritualespacios.com/productos",
                "custom_data", customData
        );

        Map<String, Object> body = Map.of(
                "data", List.of(event),
                "test_event_code", ""
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String url = CAPI_URL + "?access_token=" + accessToken;

        try {
            restTemplate.postForObject(url, new HttpEntity<>(body, headers), String.class);
            log.info("META CAPI: Purchase enviado — orderCode={}, value={}", orderCode, value);
        } catch (Exception e) {
            log.error("META CAPI: error al enviar Purchase — {}", e.getMessage());
        }
    }
}
