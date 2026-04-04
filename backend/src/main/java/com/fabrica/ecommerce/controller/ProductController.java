package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.product.ProductRequestDTO;
import com.fabrica.ecommerce.dto.product.ProductResponseDTO;
import com.fabrica.ecommerce.model.Product;
import com.fabrica.ecommerce.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

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
    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Product> createProduct(
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("sku") String sku,
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("salePrice") BigDecimal salePrice,
            @RequestParam(value = "images", required = false) MultipartFile[] images) { // CORREGIDO A ARREGLO
            
        return new ResponseEntity<>(productService.createProduct(categoryId, sku, name, description, salePrice, images), HttpStatus.CREATED);
    }

    /**
     * Endpoint Privado: Actualizar un producto existente
     * PUT /api/products/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequestDTO request) {
        Product p = productService.updateProduct(id, request);
        
        // Extraer las URLs para el DTO de respuesta
        List<String> imageUrls = p.getImages().stream()
                .map(com.fabrica.ecommerce.model.ProductImage::getImageUrl)
                .collect(Collectors.toList());

        // Construcción actualizada con descripción y lista de URLs
        return ResponseEntity.ok(new ProductResponseDTO(
                p.getId(), p.getSku(), p.getName(), p.getDescription(), p.getSalePrice(), p.getCategory().getName(), 0L, imageUrls
        ));
    }
    
    /**
     * Endpoint Privado: Desactivar un producto (Baja Lógica)
     * DELETE /api/products/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateProduct(@PathVariable Long id) {
        productService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }
}