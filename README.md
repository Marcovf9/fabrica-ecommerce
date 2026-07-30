# Ritual Espacios — Ecommerce

Plataforma de ecommerce para [ritualespacios.com](https://ritualespacios.com), tienda de parrillas, chulengos y accesorios de diseño artesanal. Full-stack con frontend React y backend Spring Boot.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Spring Boot 3.5 + Java + Spring Security (JWT) |
| Base de datos | MySQL 8 (Docker local / Render producción) |
| Migraciones | Flyway |
| Imágenes | Cloudinary |
| Pagos | MercadoPago SDK |
| Email | SMTP Gmail |
| Marketing | Meta Pixel + Conversions API + Catálogo XML |
| Deploy | Netlify (frontend) + Render (backend) |

---

## Estructura

```
fabrica-ecommerce/
├── frontend/
│   └── src/
│       ├── pages/        # HomePage, ProductsPage, ProductDetailPage, TrackingPage...
│       ├── components/   # Footer, ScrollToTop
│       ├── services/     # api.ts (axios)
│       ├── types/        # interfaces TypeScript
│       └── utils/        # imageUtils, metaPixel
├── backend/
│   └── src/main/java/com/fabrica/ecommerce/
│       ├── controller/   # Products, Orders, Auth, MetaCatalog, Reports...
│       ├── service/      # OrderService, ProductService, MetaConversions, Email...
│       ├── model/        # Product, Order, OrderItem, InventoryBatch...
│       ├── repository/
│       ├── dto/
│       └── security/     # JWT filter, SecurityConfig
└── docker-compose.yml    # MySQL local
```

---

## Setup local

### 1. Base de datos

```bash
docker-compose up -d
```

Levanta MySQL en `localhost:3306`. Flyway corre las migraciones automáticamente al iniciar el backend.

### 2. Backend

Crear el archivo `backend/src/main/resources/application-secret.properties`:

```properties
SMTP_PASSWORD=tu_password_de_app_gmail
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
mercadopago.access.token=tu_token_mp
META_CAPI_TOKEN=tu_token_capi_meta
```

```bash
cd backend
./mvnw spring-boot:run
```

Corre en `http://localhost:8080`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Corre en `http://localhost:5173`. Por defecto apunta al backend en `localhost:8080`.

---

## Variables de entorno en producción

### Backend (Render)

| Variable | Descripción |
|---|---|
| `SMTP_PASSWORD` | Password de app Gmail |
| `CLOUDINARY_URL` | URL completa de Cloudinary |
| `mercadopago.access.token` | Token de MercadoPago producción |
| `META_CAPI_TOKEN` | Token de Conversions API de Meta |

### Frontend (Netlify)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | `https://ritual-backend-1bfi.onrender.com` |

---

## API — Endpoints principales

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/products/catalog` | Catálogo activo con stock por talle |
| `GET` | `/api/products/categories` | Categorías |
| `POST` | `/api/orders` | Crear pedido |
| `POST` | `/api/orders/webhook` | Webhook de MercadoPago |
| `GET` | `/api/orders/:code` | Detalle de pedido (tracking) |
| `GET` | `/api/meta/catalog.xml` | Feed XML para Meta Ads |

### Protegidos (JWT)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Login admin |
| `POST` | `/api/products` | Crear producto |
| `POST` | `/api/products/:id` | Editar producto |
| `DELETE` | `/api/products/:id` | Desactivar producto |
| `POST` | `/api/orders/:code/confirm` | Confirmar pago |
| `POST` | `/api/orders/:code/ship` | Marcar como despachado |
| `GET` | `/api/reports/profitability` | Reporte de rentabilidad |

---

## Flujo de una venta

```
Cliente arma carrito → completa datos → elige método de pago
  ├── Transferencia → pedido PENDING → admin confirma manualmente → PAID
  └── MercadoPago  → redirige a checkout → webhook automático → PAID
                                                    ↓
                              Stock descontado por lote de inventario
                              Email al cliente y al admin
                              Evento Purchase → Meta Conversions API
```

---

## Integración Meta Ads

| Componente | Detalle |
|---|---|
| Pixel ID | `1692923315300704` |
| Eventos (browser) | PageView, ViewContent, AddToCart, InitiateCheckout, Purchase |
| CAPI (servidor) | Evento Purchase en `confirmOrder`, deduplicado por `orderCode` |
| Catálogo | Feed RSS/XML en `/api/meta/catalog.xml`, sincronización horaria en Commerce Manager |

---

## Panel de administración

Ruta: `/admin`

- CRUD de productos con imágenes (Cloudinary)
- Gestión de órdenes: confirmar, despachar, cancelar, eliminar
- Control de inventario por lotes con costo unitario
- Reporte de rentabilidad por categoría
- Generación de remitos en PDF
