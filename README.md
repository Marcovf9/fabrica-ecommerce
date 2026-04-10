# Ritual Espacios - E-Commerce & ERP Platform

Plataforma integral de comercio electrónico y gestión de recursos empresariales (ERP) desarrollada a medida para **Ritual Espacios**, fábrica de mobiliario exterior sostenible y estructuras de hierro forjado.

El sistema contempla el flujo completo de ventas al público y un panel administrativo avanzado para el control de inventario físico, trazabilidad de pedidos, gestión de variantes de medida y análisis de rentabilidad.

## 🏗 Arquitectura del Sistema

El proyecto está dividido en dos aplicaciones independientes que se comunican mediante una API RESTful asegurada.

### Frontend (Cliente y Panel Administrativo)
- **Framework:** React.js con TypeScript (empaquetado con Vite).
- **Estilos:** Tailwind CSS para un diseño fluido, responsivo y *Mobile First*.
- **Gráficos:** Recharts para la visualización de métricas financieras.
- **Gestión de Estado:** Context API / LocalStorage para persistencia del carrito.
- **Alertas:** SweetAlert2 para interacciones no bloqueantes.
- **Iconografía:** Lucide React.

### Backend (Core de Negocio y API)
- **Framework:** Java 17 + Spring Boot 3.
- **Seguridad:** Spring Security con autenticación basada en tokens JWT.
- **Base de Datos:** MySQL gestionada en la nube mediante TiDB.
- **Migraciones:** Flyway para el control estricto del esquema de base de datos y la inyección de datos estructurales (Categorías, Usuarios Admin).
- **ORM:** Hibernate / Spring Data JPA.
- **Almacenamiento de Archivos:** Integración nativa con Cloudinary API para el alojamiento optimizado de fotografías de catálogo.
- **Generación de Documentos:** iTextPDF para la creación dinámica de remitos y reportes.
- **Correos:** JavaMailSender para notificaciones transaccionales al cliente.

## 🚀 Características Principales

1. **Gestión de Inventario por Variantes:** Control de stock físico segmentado de manera quirúrgica por ID de producto y Medida específica.
2. **Carrito de Compras Reactivo:** Validación en tiempo real del límite de stock disponible por variante para evitar sobreventas.
3. **Flujo de Checkout y Logística:** Cotización dinámica de envío basada en el Código Postal del cliente.
4. **Recuperación de Carritos:** Captura silenciosa (`onBlur`) de correos y teléfonos para registrar intentos de compra inconclusos.
5. **Dashboard Financiero:** Cálculo automatizado de costos de producción vs. ingresos por ventas (Reporte de Rentabilidad).
6. **Manejo de Estados de Pedido:** Flujo de auditoría desde PENDIENTE -> PAGADO -> DESPACHADO, con impacto directo en la reducción del stock del galpón.

## 🌍 Entorno de Producción y Despliegue

La infraestructura está alojada íntegramente en la nube y asegurada mediante HTTPS:
- **Dominio Oficial:** [ritualespacios.com](https://ritualespacios.com) (Gestionado vía GoDaddy DNS).
- **Frontend Hosting:** Netlify (Red de entrega de contenido global).
- **Backend Hosting:** Render (Servicios web).
- **Database:** TiDB Cloud.

## ⚙️ Ejecución Local (Desarrollo)

**Backend:**
1. Configurar las variables de entorno en `application.properties` (Credenciales TiDB, Cloudinary, JWT Secret).
2. Ejecutar `mvn clean install` para descargar dependencias.
3. Iniciar el servidor Spring Boot (`http://localhost:8080`). Flyway generará automáticamente las tablas y usuarios base.

**Frontend:**
1. Navegar a la carpeta del cliente web.
2. Ejecutar `npm install`.
3. Iniciar el servidor de desarrollo Vite con `npm run dev`.
4. El frontend consumirá la API desde el puerto local 8080.