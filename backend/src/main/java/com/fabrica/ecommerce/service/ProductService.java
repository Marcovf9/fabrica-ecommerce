package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.dto.product.ProductRequestDTO;
import com.fabrica.ecommerce.dto.product.ProductResponseDTO;
import com.fabrica.ecommerce.dto.product.SizeStockDTO;
import com.fabrica.ecommerce.model.Category;
import com.fabrica.ecommerce.model.InventoryBatch;
import com.fabrica.ecommerce.model.Product;
import com.fabrica.ecommerce.model.ProductImage;
import com.fabrica.ecommerce.repository.CategoryRepository;
import com.fabrica.ecommerce.repository.InventoryBatchRepository;
import com.fabrica.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;
    private final InventoryBatchRepository inventoryBatchRepository;

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getActiveCatalog() {
        List<Product> activeProducts = productRepository.findAll().stream().filter(Product::getIsActive).toList();

        return activeProducts.stream().map(p -> {
            List<String> imageUrls = p.getImages().stream().map(ProductImage::getImageUrl).toList();
            
            List<SizeStockDTO> sizeStockList = p.getSizes().stream().map(sizeName -> {
                long stock = inventoryBatchRepository.findAvailableBatchesForProductAndSize(p.getId(), sizeName)
                        .stream().mapToLong(InventoryBatch::getQuantityRemaining).sum();
                return new SizeStockDTO(sizeName, stock);
            }).toList();
                
            return new ProductResponseDTO(
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
            );
        }).toList();
    }

    @Transactional
    public Product createProduct(Long categoryId, String sku, String name, String description, BigDecimal salePrice, BigDecimal originalPrice, List<String> sizes, MultipartFile[] images, Boolean isFeatured) { // <--- AGREGADO
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));

        Product product = new Product();
        product.setCategory(category);
        product.setSku(sku);
        product.setName(name);
        product.setDescription(description);
        product.setSalePrice(salePrice);
        product.setOriginalPrice(originalPrice);
        
        // Guardamos si es destacado
        if (isFeatured != null) {
            product.setFeatured(isFeatured);
        }
        
        if (sizes != null && !sizes.isEmpty()) {
            product.setSizes(sizes);
        }
        
        if (images != null) {
            for (int i = 0; i < images.length; i++) {
                MultipartFile file = images[i];
                if (!file.isEmpty()) {
                    String url = fileStorageService.storeFile(file);
                    ProductImage pi = new ProductImage();
                    pi.setImageUrl(url);
                    pi.setProduct(product);
                    pi.setIsPrimary(i == 0);
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
        product.setDescription(request.description());
        product.setSalePrice(request.salePrice());
        product.setOriginalPrice(request.originalPrice());
        
        if (request.sizes() != null) {
            product.setSizes(request.sizes());
        }
        
        return productRepository.save(product);
    }

    @Transactional
    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        product.setIsActive(false);
        productRepository.save(product);
    }
}