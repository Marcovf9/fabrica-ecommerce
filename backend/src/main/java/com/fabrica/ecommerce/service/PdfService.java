package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.dto.order.OrderDetailResponseDTO;
import com.fabrica.ecommerce.dto.order.OrderItemDetailDTO;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.util.Locale;

@Service
public class PdfService {

    public byte[] generateOrderReceipt(OrderDetailResponseDTO order) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // Documento tamaño A4 con márgenes
            Document document = new Document(PageSize.A4, 36, 36, 54, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.DARK_GRAY);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.BLACK);

            // Formateador de moneda local
            NumberFormat format = NumberFormat.getNumberInstance(Locale.forLanguageTag("es-AR"));

            // Encabezado
            Paragraph title = new Paragraph("REMITO INTERNO DE FÁBRICA", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Datos del Cliente y Orden
            document.add(new Paragraph("Código de Pedido: " + order.orderCode(), headerFont));
            document.add(new Paragraph("Contacto: " + order.customerContact(), normalFont));
            document.add(new Paragraph("Estado Físico: " + order.status(), normalFont));
            document.add(new Paragraph(" "));

            // Tabla de Artículos
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 4f, 2f, 2f}); // Proporción de columnas

            String[] headers = {"Cant.", "Producto (SKU)", "P. Unitario", "Subtotal"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(Color.LIGHT_GRAY);
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            for (OrderItemDetailDTO item : order.items()) {
                table.addCell(createCell(String.valueOf(item.quantity()), normalFont, Element.ALIGN_CENTER));
                table.addCell(createCell(item.productName() + "\nSKU: " + item.sku(), normalFont, Element.ALIGN_LEFT));
                table.addCell(createCell("$" + format.format(item.unitPrice()), normalFont, Element.ALIGN_RIGHT));
                table.addCell(createCell("$" + format.format(item.subTotal()), normalFont, Element.ALIGN_RIGHT));
            }

            document.add(table);
            document.add(new Paragraph(" "));

            // Total
            Paragraph total = new Paragraph("TOTAL ORDEN: $" + format.format(order.totalSaleAmount()), titleFont);
            total.setAlignment(Element.ALIGN_RIGHT);
            document.add(total);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Fallo estructural al generar el PDF del remito.", e);
        }
    }

    private PdfPCell createCell(String content, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(content, font));
        cell.setPadding(5);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }
}