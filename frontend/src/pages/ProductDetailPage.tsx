import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { catalogService } from '../services/api';
import type { Product, CartItem } from '../types';
import Swal from 'sweetalert2';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Camera, ShoppingCart, Tag, Box } from 'lucide-react';

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
        if (found) { setProduct(found); } 
        else {
          Swal.fire({ icon: 'error', title: 'Extraviado', text: 'El producto no existe o fue dado de baja.', background: '#3A322D', color: '#F5EFE6' });
          navigate('/');
        }
      } catch (err) { Swal.fire({ icon: 'error', title: 'Error de Red', background: '#3A322D', color: '#F5EFE6' }); } 
      finally { setLoading(false); }
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

  if (loading) return <div className="h-screen flex justify-center items-center bg-brand-dark"><div className="animate-spin text-brand-primary"><Camera size={48}/></div></div>;
  if (!product) return null;

  return (
    <>
      <Helmet>
        <title>{product.name} | Ritual Espacios</title>
        <meta name="description" content={product.description?.substring(0, 150) + "..."} />
        <meta property="og:title" content={`${product.name} - $${product.salePrice.toLocaleString('es-AR')}`} />
        <meta property="og:description" content={product.description?.substring(0, 150) + "..."} />
        {product.imageUrls && product.imageUrls.length > 0 && <meta property="og:image" content={optimizeCloudinaryUrl(product.imageUrls[0], 800)} />}
      </Helmet>

      <div className="max-w-[1600px] w-[95%] mx-auto py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-primary font-bold tracking-widest uppercase hover:text-orange-500 transition-colors mb-8">
          <ArrowLeft size={20} /> Volver al catálogo
        </Link>
        
        <div className="bg-brand-panel rounded-xl flex flex-col lg:flex-row border border-brand-border overflow-hidden shadow-2xl">
          
          <div className="flex-[1.2] bg-black relative min-h-[400px] lg:min-h-[600px] flex items-center justify-center p-8">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <>
                <img src={optimizeCloudinaryUrl(product.imageUrls[currentImageIndex], 1000)} alt={product.name} className="w-full h-full object-contain max-h-[700px] animate-fade-in" />
                {product.imageUrls.length > 1 && (
                  <div className="absolute bottom-6 flex gap-3 w-full justify-center bg-black/40 py-3 backdrop-blur-sm">
                    {product.imageUrls.map((_, idx) => (
                      <button 
                        key={idx} onClick={() => setCurrentImageIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${currentImageIndex === idx ? 'bg-brand-primary scale-125' : 'bg-brand-muted hover:bg-white'}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Camera className="text-brand-border" size={80} />
            )}
          </div>

          <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
            <h1 className="text-4xl lg:text-5xl text-brand-text font-light uppercase tracking-widest mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-brand-primary mb-8">${product.salePrice.toLocaleString('es-AR')}</p>
            
            <div className="bg-brand-dark p-6 rounded-lg mb-8 border border-brand-border">
              <p className="text-brand-muted whitespace-pre-wrap leading-relaxed text-lg">
                {product.description || "Sin especificaciones técnicas registradas."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="bg-brand-dark p-4 rounded border border-brand-border">
                <p className="text-brand-muted text-xs uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><Tag size={14}/> Categoría</p>
                <p className="text-brand-text font-medium">{product.categoryName}</p>
              </div>
              <div className="bg-brand-dark p-4 rounded border border-brand-border">
                <p className="text-brand-muted text-xs uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><Box size={14}/> Planta</p>
                <p className={`font-bold ${product.availableStock > 0 ? 'text-green-400' : 'text-red-500'}`}>
                  {product.availableStock > 0 ? `${product.availableStock} disponibles` : 'Sin stock'}
                </p>
              </div>
            </div>

            <button 
              onClick={handleAddToCartAndReturn} disabled={product.availableStock <= 0}
              className={`w-full py-5 px-6 font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 transition-all duration-300 ${product.availableStock > 0 ? 'bg-brand-primary hover:bg-orange-600 text-white shadow-lg hover:shadow-brand-primary/40' : 'bg-brand-border text-brand-muted cursor-not-allowed'}`}
            >
              <ShoppingCart size={24} /> {product.availableStock > 0 ? 'Agregar y Continuar' : 'Agotado'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}