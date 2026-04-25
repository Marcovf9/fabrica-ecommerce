package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.product.ProductRequestDTO;
import com.fabrica.ecommerce.dto.product.ProductResponseDTO;
import com.fabrica.ecommerce.dto.product.SizeStockDTO;
import com.fabrica.ecommerce.model.Product;
import com.fabrica.ecommerce.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/catalog")
    public ResponseEntity<List<ProductResponseDTO>> getCatalog() {
        return ResponseEntity.ok(productService.getActiveCatalog());
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Product> createProduct(
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("sku") String sku,
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("salePrice") BigDecimal salePrice,
            @RequestParam(value = "originalPrice", required = false) BigDecimal originalPrice,
            @RequestParam(value = "sizes", required = false) List<String> sizes,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            @RequestParam(value = "isFeatured", defaultValue = "false") Boolean isFeatured) {
            
        return new ResponseEntity<>(productService.createProduct(categoryId, sku, name, description, salePrice, originalPrice, sizes, images, isFeatured), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> updateProduct(
            @PathVariable Long id,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String sku,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) BigDecimal salePrice,
            @RequestParam(required = false) BigDecimal originalPrice,
            @RequestParam(required = false) List<String> sizes,
            @RequestParam(required = false) MultipartFile[] images,
            @RequestParam(required = false) Boolean clearImages) {
            
        Product p = productService.updateProduct(id, categoryId, sku, name, description, salePrice, originalPrice, sizes, images, clearImages);
        
        List<String> imageUrls = p.getImages().stream()
                .map(com.fabrica.ecommerce.model.ProductImage::getImageUrl)
                .toList();
                
        List<com.fabrica.ecommerce.dto.product.SizeStockDTO> sizeStockList = p.getSizes().stream()
                .map(size -> new com.fabrica.ecommerce.dto.product.SizeStockDTO(size, 0L))
                .toList();
        
        return ResponseEntity.ok(new ProductResponseDTO(
                p.getId(), 
                p.getSku(), 
                p.getName(), 
                p.getDescription(), 
                p.getSalePrice(), 
                p.getCategory().getName(), 
                imageUrls, 
                sizeStockList, 
                p.getOriginalPrice(),
                p.isFeatured()
        ));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateProduct(@PathVariable Long id) {
        productService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }
}