package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.dto.product.ProductRequestDTO;
import com.fabrica.ecommerce.dto.product.ProductResponseDTO;
import com.fabrica.ecommerce.model.Category;
import com.fabrica.ecommerce.model.Product;
import com.fabrica.ecommerce.model.ProductImage;
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
        List<Object[]> results = productRepository.getActiveProductsWithStock();
        return results.stream().map(row -> {
            Product p = (Product) row[0];
            Long stock = ((Number) row[1]).longValue();
            List<String> imageUrls = p.getImages().stream()
                .map(com.fabrica.ecommerce.model.ProductImage::getImageUrl)
                .collect(Collectors.toList());
                
            return new ProductResponseDTO(
                p.getId(), p.getSku(), p.getName(), p.getDescription(), 
                p.getSalePrice(), p.getCategory().getName(), stock, imageUrls
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public Product createProduct(Long categoryId, String sku, String name, String description, BigDecimal salePrice, MultipartFile[] images) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));

        Product product = new Product();
        product.setCategory(category);
        product.setSku(sku);
        product.setName(name);
        product.setDescription(description);
        product.setSalePrice(salePrice);
        
        if (images != null) {
            for (int i = 0; i < images.length; i++) {
                MultipartFile file = images[i];
                if (!file.isEmpty()) {
                    String url = fileStorageService.storeFile(file);
                    ProductImage pi = new ProductImage();
                    pi.setImageUrl(url);
                    pi.setProduct(product);
                    pi.setIsPrimary(i == 0); // La primera imagen se marca como principal
                    product.getImages().add(pi);
                }
            }
        }
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, ProductRequestDTO request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        product.setName(request.name());
        product.setDescription(request.description()); // Mapeo de la nueva columna
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