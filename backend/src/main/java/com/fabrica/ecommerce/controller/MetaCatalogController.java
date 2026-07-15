package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.product.ProductResponseDTO;
import com.fabrica.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/meta")
@RequiredArgsConstructor
public class MetaCatalogController {

    private static final String STORE_URL = "https://ritualespacios.com";

    private final ProductService productService;

    @GetMapping(value = "/catalog.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getMetaCatalog() {
        List<ProductResponseDTO> products = productService.getActiveCatalog();
        StringBuilder xml = new StringBuilder();

        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">\n");
        xml.append("  <channel>\n");
        xml.append("    <title>Ritual Espacios - Catálogo</title>\n");
        xml.append("    <link>").append(STORE_URL).append("</link>\n");
        xml.append("    <description>Parrillas, chulengos y accesorios de diseño</description>\n");

        for (ProductResponseDTO p : products) {
            String imageUrl = (p.imageUrls() != null && !p.imageUrls().isEmpty())
                    ? p.imageUrls().get(0)
                    : "";

            String availability = p.sizes() != null && p.sizes().stream().anyMatch(s -> s.stock() > 0)
                    ? "in stock"
                    : "out of stock";

            xml.append("    <item>\n");
            xml.append("      <g:id>").append(escape(String.valueOf(p.id()))).append("</g:id>\n");
            xml.append("      <g:title>").append(escape(p.name())).append("</g:title>\n");
            xml.append("      <g:description>").append(escape(nvl(p.description(), p.name()))).append("</g:description>\n");
            xml.append("      <g:link>").append(STORE_URL).append("/producto/").append(escape(p.sku())).append("</g:link>\n");
            xml.append("      <g:image_link>").append(escape(imageUrl)).append("</g:image_link>\n");
            xml.append("      <g:availability>").append(availability).append("</g:availability>\n");
            xml.append("      <g:condition>new</g:condition>\n");
            xml.append("      <g:price>").append(p.salePrice()).append(" ARS</g:price>\n");
            if (p.originalPrice() != null) {
                xml.append("      <g:sale_price>").append(p.salePrice()).append(" ARS</g:sale_price>\n");
            }
            xml.append("      <g:brand>Ritual Espacios</g:brand>\n");
            xml.append("      <g:google_product_category>638</g:google_product_category>\n"); // Home & Garden > Outdoor Cooking
            xml.append("      <g:item_group_id>").append(escape(p.sku())).append("</g:item_group_id>\n");
            xml.append("    </item>\n");
        }

        xml.append("  </channel>\n");
        xml.append("</rss>");

        return ResponseEntity.ok(xml.toString());
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String nvl(String value, String fallback) {
        return (value != null && !value.isBlank()) ? value : fallback;
    }
}
