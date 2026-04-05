package com.fabrica.ecommerce.dto;

public record LeadRequestDTO(
        String email,
        String phone,
        String cartContent
) {}