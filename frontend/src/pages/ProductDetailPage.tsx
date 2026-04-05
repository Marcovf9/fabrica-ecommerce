import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { catalogService } from '../services/api';
import type { Product, CartItem } from '../types';
import Swal from 'sweetalert2';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';

export default function ProductDetailPage() {
  const { sku } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const catalog = await catalogService.getCatalog();
        const found = catalog.find(p => p.sku === sku);
        if (found) {
          setProduct(found);
        } else {
          Swal.fire({ icon: 'error', title: 'Extraviado', text: 'El producto no existe o fue dado de baja.', background: '#3A322D', color: '#F5EFE6' });
          navigate('/');
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo cargar la información.', background: '#3A322D', color: '#F5EFE6' });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [sku, navigate]);

  const handleAddToCartAndReturn = () => {
    if (!product || product.availableStock <= 0) return;

    const savedCart = localStorage.getItem('fabrica_cart');
    let currentCart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

    const existingIndex = currentCart.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      if (currentCart[existingIndex].quantity >= product.availableStock) {
        Swal.fire({ icon: 'warning', title: 'Límite de stock', background: '#3A322D', color: '#F5EFE6', text: `Solo quedan ${product.availableStock} unidades.`});
        return;
      }
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({ product, quantity: 1 });
    }

    localStorage.setItem('fabrica_cart', JSON.stringify(currentCart));
    Swal.fire({ icon: 'success', title: 'Agregado al pedido', timer: 1500, showConfirmButton: false, background: '#3A322D', color: '#F5EFE6' });
    navigate('/');
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2>Cargando especificaciones...</h2></div>;
  if (!product) return null;

  return (
    <>
      {/* INYECCIÓN SEO DINÁMICA */}
      <Helmet>
        <title>{product.name} | Ritual Espacios</title>
        <meta name="description" content={product.description?.substring(0, 150) + "..."} />
        <meta property="og:title" content={`${product.name} - $${product.salePrice.toLocaleString('es-AR')}`} />
        <meta property="og:description" content={product.description?.substring(0, 150) + "..."} />
        {product.imageUrls && product.imageUrls.length > 0 && (
          <meta property="og:image" content={optimizeCloudinaryUrl(product.imageUrls[0], 800)} />
        )}
      </Helmet>

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <Link to="/" style={{ color: '#D67026', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', marginBottom: '20px' }}>
          ← VOLVER AL CATÁLOGO
        </Link>
        
        <div style={{ backgroundColor: '#3A322D', borderRadius: '4px', display: 'flex', flexWrap: 'wrap', border: '1px solid #51433A', overflow: 'hidden' }}>
          
          <div style={{ flex: '1 1 500px', backgroundColor: '#1A1816', position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <>
                <img src={optimizeCloudinaryUrl(product.imageUrls[currentImageIndex], 800)} alt={product.name} style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }} />
                {product.imageUrls.length > 1 && (
                  <div style={{ position: 'absolute', bottom: '20px', display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                    {product.imageUrls.map((_, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setCurrentImageIndex(idx)}
                        style={{ width: '14px', height: '14px', borderRadius: '50%', border: 'none', backgroundColor: currentImageIndex === idx ? '#D67026' : '#68594D', cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <span style={{ color: '#68594D', fontSize: '4rem' }}>📷</span>
            )}
          </div>

          <div style={{ flex: '1 1 400px', padding: '40px' }}>
            <h1 style={{ color: '#F5EFE6', margin: '0 0 10px 0', fontSize: '2.5rem' }}>{product.name}</h1>
            <p style={{ color: '#D67026', fontSize: '2rem', fontWeight: 'bold', margin: '0 0 30px 0' }}>${product.salePrice.toLocaleString('es-AR')}</p>
            
            <div style={{ backgroundColor: '#2B2522', padding: '20px', borderRadius: '2px', marginBottom: '30px', border: '1px solid #51433A' }}>
              <p style={{ color: '#B8B0A3', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.05rem' }}>
                {product.description || "Sin especificaciones técnicas registradas."}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
              <div>
                <p style={{ margin: 0, color: '#68594D', fontSize: '0.85rem', textTransform: 'uppercase' }}>Categoría</p>
                <p style={{ margin: '5px 0 0 0', color: '#F5EFE6', fontWeight: 'bold' }}>{product.categoryName}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#68594D', fontSize: '0.85rem', textTransform: 'uppercase' }}>Disponibilidad física</p>
                <p style={{ margin: '5px 0 0 0', color: product.availableStock > 0 ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                  {product.availableStock > 0 ? `${product.availableStock} unidades en planta` : 'Sin stock'}
                </p>
              </div>
            </div>

            <button 
              onClick={handleAddToCartAndReturn}
              disabled={product.availableStock <= 0}
              style={{ 
                padding: '18px', width: '100%', cursor: product.availableStock > 0 ? 'pointer' : 'not-allowed', 
                backgroundColor: product.availableStock > 0 ? '#D67026' : '#51433A', color: product.availableStock > 0 ? '#F5EFE6' : '#B8B0A3', 
                border: 'none', borderRadius: '2px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '1px'
              }}>
              {product.availableStock > 0 ? 'Agregar al Pedido y Continuar' : 'Agotado'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}