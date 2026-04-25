# Ritual Espacios - E-Commerce & ERP Platform

Plataforma integral de comercio electrónico y gestión de recursos empresariales (ERP) desarrollada a medida para **Ritual Espacios**, fábrica de mobiliario exterior sostenible y estructuras de hierro forjado.

El sistema contempla el flujo completo de ventas al público, automatización de pagos y un panel administrativo avanzado para el control de inventario físico, trazabilidad de pedidos, gestión de variantes de medida y análisis de rentabilidad.

## 🏗 Arquitectura del Sistema

El proyecto está dividido en dos aplicaciones independientes que se comunican mediante una API RESTful asegurada.

### Frontend (Cliente y Panel Administrativo)
- **Framework:** React.js con TypeScript (empaquetado con Vite).
- **Estilos:** Tailwind CSS para un diseño fluido, responsivo y *Mobile First*.
- **Gráficos:** Recharts para la visualización de métricas financieras.
- **Gestión de Estado:** Context API / LocalStorage para persistencia del carrito, incluso tras interrupciones de pago.
- **Alertas y UI:** SweetAlert2 para modales y gestión de datos, Lucide React para iconografía.
- **SEO & Tracking:** Implementación de JSON-LD (Schema.org), etiquetas Open Graph y preparación nativa para Meta Pixel y Google Analytics 4.

### Backend (Core de Negocio y API)
- **Framework:** Java 17 + Spring Boot 3.
- **Seguridad:** Spring Security con autenticación basada en tokens JWT.
- **Pasarela de Pagos:** Integración nativa con el SDK de **Mercado Pago** (Preference API & Webhooks).
- **Base de Datos:** MySQL gestionada en la nube mediante TiDB.
- **Migraciones:** Flyway para el control estricto del esquema de base de datos.
- **ORM:** Hibernate / Spring Data JPA.
- **Almacenamiento de Archivos:** Integración con Cloudinary API para alojamiento optimizado de fotografías mediante `multipart/form-data`.
- **Generación de Documentos:** iTextPDF para la creación dinámica de remitos.
- **Comunicaciones:** JavaMailSender para el disparo automatizado de correos transaccionales (alertas administrativas y notificaciones al cliente).

## 🚀 Características Principales

1. **Checkout Automatizado con Mercado Pago:** Flujo de pago integrado con redirección automática y procesamiento de *Webhooks* (IPN) para confirmar cobros y actualizar el estado de los pedidos en tiempo real.
2. **Sistema de Notificaciones por Correo:** Disparo automático de emails HTML formateados para confirmar compras, despachos, cancelaciones y enviar alertas críticas de stock a la administración.
3. **Gestión Quirúrgica de Inventario:** Control de stock físico segmentado por ID de producto y variante de medida, con bloqueo automático en el frontend cuando se agota (Quick Select dinámico).
4. **Dashboard Financiero y ERP:** Panel de administración protegido que calcula en tiempo real ingresos, costos de producción (por lotes) y margen de ganancia neta.
5. **Recuperación de Carritos:** Captura silenciosa (`onBlur`) de correos y teléfonos para registrar intentos de compra inconclusos y gestionar leads.
6. **Manejo de Estados de Pedido:** Flujo de auditoría estricto (PENDIENTE -> PAGADO -> DESPACHADO / CANCELADO), con impacto directo en el stock y opciones de eliminación de registros de prueba.
7. **Gestión Dinámica de Catálogo:** Creación, edición, actualización de precios y reemplazo de fotografías de productos en tiempo real desde el panel de control.

## 🌍 Entorno de Producción y Despliegue

La infraestructura está alojada íntegramente en la nube y asegurada mediante HTTPS:
- **Dominio Oficial:** [ritualespacios.com](https://ritualespacios.com) (Gestionado vía GoDaddy DNS).
- **Frontend Hosting:** Netlify (Red de entrega de contenido global con auditoría estricta de TypeScript).
- **Backend Hosting:** Render (Servicios web para la API y el procesamiento de Webhooks).
- **Database:** TiDB Cloud.
- **Media CDN:** Cloudinary.

## ⚙️ Ejecución Local (Desarrollo)

**Backend:**
1. Configurar las variables de entorno en `application.properties` (Credenciales TiDB, Cloudinary, JWT Secret, MP Access Token, Mail Credentials).
2. Ejecutar `mvn clean install` para descargar dependencias.
3. Iniciar el servidor Spring Boot (`http://localhost:8080`). Flyway generará automáticamente las tablas y usuarios base.

**Frontend:**
1. Navegar a la carpeta del cliente web.
2. Ejecutar `npm install`.
3. Iniciar el servidor de desarrollo Vite con `npm run dev`.
4. El frontend consumirá la API desde el puerto configurado en `.env` (`VITE_API_URL`).