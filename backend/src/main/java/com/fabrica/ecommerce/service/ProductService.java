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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getActiveCatalog() {
        return productRepository.getActiveCatalogWithStock();
    }

    @Transactional
    public Product createProduct(ProductRequestDTO request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("Categoría inválida"));
        
        Product product = new Product();
        product.setCategory(category);
        product.setSku(request.sku());
        product.setName(request.name());
        product.setSalePrice(request.salePrice());
        product.setIsActive(true);
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
}