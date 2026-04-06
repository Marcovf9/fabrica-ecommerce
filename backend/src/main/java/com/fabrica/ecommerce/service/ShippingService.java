package com.fabrica.ecommerce.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class ShippingService {

    public BigDecimal calculateShipping(String zip, int totalItems) {
        if (zip == null || zip.trim().length() < 4) return BigDecimal.ZERO;
        
        String prefix = zip.trim().substring(0, 1);
        BigDecimal baseCost;
        BigDecimal perItemCost;

        switch (prefix) {
            case "5": // Zona Local (Córdoba y alrededores)
                baseCost = new BigDecimal("8000");
                perItemCost = new BigDecimal("3000");
                break;
            case "1":
            case "2":
            case "3": // Zona Nacional 1 (CABA, Bs As, Santa Fe, Entre Ríos)
                baseCost = new BigDecimal("15000");
                perItemCost = new BigDecimal("6000");
                break;
            default: // Zona Nacional 2 (Resto del país)
                baseCost = new BigDecimal("25000");
                perItemCost = new BigDecimal("9000");
                break;
        }

        return baseCost.add(perItemCost.multiply(new BigDecimal(totalItems)));
    }
}