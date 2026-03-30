package com.fabrica.ecommerce.repository;

import com.fabrica.ecommerce.model.OrderItemBatchAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemBatchAllocationRepository extends JpaRepository<OrderItemBatchAllocation, Long> {
}