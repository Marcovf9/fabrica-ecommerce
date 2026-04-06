package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.model.AbandonedCart; 
import com.fabrica.ecommerce.repository.AbandonedCartRepository; 
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartRecoveryScheduler {

    private final AbandonedCartRepository abandonedCartRepository;
    private final EmailService emailService;

    // Se ejecuta en el minuto 0 de cada hora (Ej: 14:00, 15:00)
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void processAbandonedCarts() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(2);
        List<AbandonedCart> abandonedCarts = abandonedCartRepository.findUnnotifiedAbandonedCarts(threshold);

        if (abandonedCarts.isEmpty()) {
            return; 
        }

        for (AbandonedCart cart : abandonedCarts) {
            String email = cart.getCustomerEmail(); 
            
            String content = "<p style='font-size: 16px;'>Notamos que dejaste estructuras pendientes en tu carrito de compras de Ritual Espacios.</p>" +
                             "<div style='background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 15px; margin: 20px 0; border-radius: 4px;'>" +
                             "<p style='margin: 0; font-size: 14px; color: #6B7280; text-transform: uppercase; font-weight: bold;'>Tu selección:</p>" +
                             "<p style='margin: 10px 0 0 0; font-size: 16px; color: #111827;'><b>" + cart.getCartContent() + "</b></p>" +
                             "</div>" +
                             "<p style='font-size: 16px;'>El inventario de nuestra planta es dinámico. Si deseas concretar la fabricación o envío de estos productos, puedes volver al catálogo para finalizar la operación.</p>" +
                             "<div style='text-align: center; margin-top: 30px;'>" +
                             "  <a href='http://localhost:5173/' style='background-color: #D67026; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;'>Recuperar mi pedido</a>" +
                             "</div>";

            String htmlBody = buildProfessionalEmailWrapper("¿Olvidaste tu carrito?", content);

            try {
                emailService.sendHtmlEmail(email, "Tu pedido en Ritual Espacios sigue disponible", htmlBody);
                cart.setNotified(true); 
                abandonedCartRepository.save(cart);
            } catch (Exception e) {
                System.err.println("Error al intentar recuperar carrito de: " + email);
            }
        }
    }

    private String buildProfessionalEmailWrapper(String title, String mainContent) {
        return "<div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; background-color: #FFFFFF;\">" +
               "  <div style=\"background-color: #FFFFFF; padding: 30px; text-align: center; border-bottom: 2px solid #D67026;\">" +
               "    <img src=\"TU_ENLACE_PUBLICO_REAL_AQUI.jpg\" alt=\"Ritual Espacios\" style=\"height: 70px; border-radius: 4px;\" />" +
               "  </div>" +
               "  <div style=\"padding: 40px 30px; color: #111827; line-height: 1.6;\">" +
               "    <h2 style=\"color: #D67026; margin-top: 0; text-transform: uppercase; letter-spacing: 1px; font-size: 22px;\">" + title + "</h2>" +
               mainContent +
               "  </div>" +
               "  <div style=\"background-color: #111827; padding: 30px; text-align: center; font-size: 12px; color: #9CA3AF;\">" +
               "    <p style=\"margin: 0 0 10px 0; font-weight: bold; color: #FFFFFF; letter-spacing: 2px;\">RITUAL ESPACIOS - FUEGO & DISEÑO</p>" +
               "    <p style=\"margin: 0 0 15px 0;\">Córdoba, Argentina</p>" +
               "  </div>" +
               "</div>";
    }
}