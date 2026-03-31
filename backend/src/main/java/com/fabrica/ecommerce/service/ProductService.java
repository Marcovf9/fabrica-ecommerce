package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.dto.product.ProductRequestDTO;
import com.fabrica.ecommerce.dto.product.ProductResponseDTO;
import com.fabrica.ecommerce.model.Category;
import com.fabrica.ecommerce.model.Product;
import com.fabrica.ecommerce.repository.CategoryRepository;
import com.fabrica.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getActiveCatalog() {
        return productRepository.getActiveCatalogWithStock();
    }

    @Transactional
    public Product createProduct(Long categoryId, String sku, String name, BigDecimal salePrice, MultipartFile image) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));

        Product product = new Product();
        product.setCategory(category);
        product.setSku(sku);
        product.setName(name);
        product.setSalePrice(salePrice);
        
        if (image != null && !image.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(image);
            product.setImageUrl(imageUrl);
        }

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, ProductRequestDTO request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        product.setName(request.name());
        product.setSalePrice(request.salePrice());
        return productRepository.save(product);
    }

    @Transactional
    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        // Baja lógica: no lo borramos de la BD, solo lo ocultamos
        product.setIsActive(false);
        productRepository.save(product);
    }
}