package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.product.ProductRequestDTO;
import com.fabrica.ecommerce.dto.product.ProductResponseDTO;
import com.fabrica.ecommerce.model.Product;
import com.fabrica.ecommerce.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * Endpoint Público: Obtener el catálogo para el frontend
     * GET /api/products/catalog
     */
    @GetMapping("/catalog")
    public ResponseEntity<List<ProductResponseDTO>> getCatalog() {
        return ResponseEntity.ok(productService.getActiveCatalog());
    }

    /**
     * Endpoint Privado: Crear un nuevo producto
     * POST /api/products
     */
    @PostMapping
    public ResponseEntity<ProductResponseDTO> createProduct(@Valid @RequestBody ProductRequestDTO request) {
        Product p = productService.createProduct(request);
        return ResponseEntity.ok(new ProductResponseDTO(
                p.getId(), p.getSku(), p.getName(), p.getSalePrice(), p.getCategory().getName(), 0L
        ));
    }

    /**
     * Endpoint Privado: Actualizar un producto existente
     * PUT /api/products/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequestDTO request) {
        Product p = productService.updateProduct(id, request);
        return ResponseEntity.ok(new ProductResponseDTO(
                p.getId(), p.getSku(), p.getName(), p.getSalePrice(), p.getCategory().getName(), 0L
        ));
    }
}