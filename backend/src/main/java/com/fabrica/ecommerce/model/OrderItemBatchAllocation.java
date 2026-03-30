package com.fabrica.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "order_item_batch_allocations")
@Data
public class OrderItemBatchAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_batch_id", nullable = false)
    private InventoryBatch inventoryBatch;

    @Column(name = "quantity_allocated", nullable = false)
    private Integer quantityAllocated;

    // Snapshot estricto del costo en el momento exacto de la asignación.
    @Column(name = "cost_at_allocation", nullable = false, precision = 10, scale = 2)
    private BigDecimal costAtAllocation;
}