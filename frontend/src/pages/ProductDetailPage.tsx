import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { catalogService } from '../services/api';
import type { Product, CartItem } from '../types';
import Swal from 'sweetalert2';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Camera, ShoppingCart, Tag, Box, Ruler, Truck } from 'lucide-react';

export default function ProductDetailPage() {
  const { sku } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [selectedSize, setSelectedSize] = useState<string>('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const catalog = await catalogService.getCatalog();
        const found = catalog.find(p => p.sku === sku);
        if (found) { 
          setProduct(found);
          if (found.sizes && found.sizes.length === 1) {
            setSelectedSize(found.sizes[0].size);
          }
        } 
        else {
          Swal.fire({ icon: 'error', title: 'Extraviado', text: 'El producto no existe o fue dado de baja.' });
          navigate('/');
        }
      } catch (err) { Swal.fire({ icon: 'error', title: 'Error de Red' }); } 
      finally { setLoading(false); }
    };
    fetchProduct();
  }, [sku, navigate]);

  const currentSizeData = product?.sizes?.find(s => s.size === selectedSize);
  const availableStock = currentSizeData ? currentSizeData.stock : 0;

  const handleAddToCartAndReturn = () => {
    if (!product || availableStock <= 0) return;
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      Swal.fire({ icon: 'warning', title: 'Falta información', text: 'Por favor, selecciona una medida.' });
      return;
    }

    const savedCart = localStorage.getItem('fabrica_cart');
    let currentCart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
    
    const existingIndex = currentCart.findIndex(item => item.product.id === product.id && item.size === selectedSize);
    
    if (existingIndex >= 0) {
      if (currentCart[existingIndex].quantity >= availableStock) {
        Swal.fire({ icon: 'warning', title: 'Límite de stock', text: `Solo quedan ${availableStock} unidades de esta variante.`});
        return;
      }
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({ product, quantity: 1, size: selectedSize || 'Estándar' });
    }
    
    localStorage.setItem('fabrica_cart', JSON.stringify(currentCart));
    Swal.fire({ icon: 'success', title: 'Agregado al pedido', timer: 1500, showConfirmButton: false });
    navigate('/productos');
  };

  if (loading) return <div className="h-screen flex justify-center items-center bg-brand-gray"><div className="animate-spin text-brand-primary"><Camera size={48}/></div></div>;
  if (!product) return null;

  const transferPrice = product.salePrice * 0.85;

  return (
    <>
      <Helmet>
        <title>{product.name} | Ritual Espacios</title>
        <meta name="description" content={product.description?.substring(0, 150) + "..."} />
      </Helmet>

      <div className="max-w-[1600px] w-[95%] mx-auto py-6 md:py-10">
        <Link to="/productos" className="inline-flex items-center gap-2 text-brand-primary text-xs md:text-sm font-bold tracking-widest uppercase hover:text-orange-500 transition-colors mb-6 md:mb-8">
          <ArrowLeft size={18} /> Catálogo
        </Link>
        
        <div className="bg-white rounded-2xl flex flex-col lg:flex-row border border-brand-border overflow-hidden shadow-sm">
          
          <div className="flex-[1.2] bg-brand-gray relative min-h-[300px] md:min-h-[400px] lg:min-h-[600px] flex items-center justify-center p-4 md:p-8">
            
            {/* INSIGNIA ENVÍO GRATIS */}
            <div className="absolute top-6 left-6 bg-brand-dark text-white text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded shadow-lg z-10 flex items-center gap-2">
              <Truck size={16}/> Envío Gratis a todo el país
            </div>

            {product.imageUrls && product.imageUrls.length > 0 ? (
              <>
                <img src={optimizeCloudinaryUrl(product.imageUrls[currentImageIndex], 1000)} alt={product.name} className="w-full h-full object-contain max-h-[350px] md:max-h-[700px] animate-fade-in drop-shadow-md" />
                {product.imageUrls.length > 1 && (
                  <div className="absolute bottom-4 md:bottom-6 flex gap-2 md:gap-3 w-full justify-center bg-white/60 py-2 md:py-3 backdrop-blur-sm shadow-sm rounded-full mx-auto max-w-fit px-4 md:px-6">
                    {product.imageUrls.map((_, idx) => (
                      <button 
                        key={idx} onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 shadow-sm ${currentImageIndex === idx ? 'bg-brand-primary scale-125' : 'bg-brand-muted hover:bg-brand-dark'}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Camera className="text-brand-muted opacity-50" size={60} />
            )}
          </div>

          <div className="flex-1 p-5 md:p-8 lg:p-12 flex flex-col justify-center">
            <h1 className="text-2xl md:text-4xl lg:text-5xl text-brand-dark font-light uppercase tracking-widest mb-2 md:mb-4">{product.name}</h1>
            
            {/* BLOQUE PRECIO DUAL */}
            <div className="mb-6 md:mb-8 border-b border-brand-border pb-6">
              {product.originalPrice && product.originalPrice > product.salePrice && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm md:text-base text-brand-muted line-through font-medium">${product.originalPrice.toLocaleString('es-AR')}</span>
                  <span className="text-[10px] md:text-xs font-black text-red-500 bg-red-100 px-2 py-0.5 rounded uppercase tracking-wider">{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}% OFF</span>
                </div>
              )}
              <p className={`text-3xl md:text-4xl font-black leading-tight ${product.originalPrice && product.originalPrice > product.salePrice ? 'text-red-600' : 'text-brand-dark'}`}>
                ${product.salePrice.toLocaleString('es-AR')} <span className="text-xs md:text-sm font-bold text-brand-muted uppercase tracking-wider block md:inline md:ml-2">/ 3 Cuotas sin interés</span>
              </p>
              <p className="text-xl md:text-2xl font-black text-brand-primary mt-2 flex items-center gap-2">
                ${transferPrice.toLocaleString('es-AR')} <span className="text-[10px] md:text-xs font-bold bg-orange-100 text-brand-primary px-2 py-1 rounded uppercase tracking-wider">Precio por Transferencia (-15%)</span>
              </p>
            </div>
            
            <div className="bg-brand-gray p-4 md:p-6 rounded-lg mb-6 md:mb-8 border border-brand-border">
              <p className="text-brand-dark whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {product.description || "Sin especificaciones técnicas registradas."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-white p-4 rounded-lg border border-brand-border shadow-sm">
                <p className="text-brand-muted text-xs uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><Tag size={14}/> Categoría</p>
                <p className="text-brand-dark font-bold text-sm md:text-base">{product.categoryName}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-brand-border shadow-sm">
                <p className="text-brand-muted text-xs uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><Box size={14}/> Selección</p>
                <p className={`font-bold text-sm md:text-base ${selectedSize ? (availableStock > 0 ? 'text-green-600' : 'text-red-500') : 'text-brand-muted'}`}>
                  {!selectedSize ? 'Esperando medida...' : (availableStock > 0 ? `${availableStock} disp.` : 'Agotado')}
                </p>
              </div>
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8 md:mb-10">
                <p className="text-brand-muted text-xs uppercase font-bold tracking-widest mb-3 flex items-center gap-2"><Ruler size={14}/> Seleccionar Medida</p>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {product.sizes.map((s, idx) => {
                    const sizeName = s.size || `Medida-${idx}`;
                    const sizeStock = s.stock || 0;
                    return (
                      <button
                        key={sizeName}
                        onClick={() => setSelectedSize(sizeName)}
                        className={`px-4 md:px-5 py-2.5 md:py-3 border-2 rounded-lg font-bold tracking-wider uppercase transition-all duration-200 flex flex-col items-center
                          ${selectedSize === sizeName 
                            ? 'border-brand-primary bg-brand-primary text-white shadow-md' 
                            : 'border-brand-border bg-white text-brand-dark hover:border-brand-primary hover:text-brand-primary'
                          } ${sizeStock <= 0 ? 'opacity-50' : ''}`}
                      >
                        <span className="text-sm md:text-base">{sizeName}</span>
                        <span className={`text-[9px] md:text-[10px] ${selectedSize === sizeName ? 'text-white/80' : 'text-brand-muted'}`}>
                          {sizeStock > 0 ? `${sizeStock} disp.` : 'Agotado'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button 
              onClick={handleAddToCartAndReturn} 
              disabled={availableStock <= 0 || (product.sizes?.length > 0 && !selectedSize)}
              className={`w-full py-4 md:py-5 px-6 text-sm md:text-base font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 transition-all duration-300 
                ${(availableStock > 0 && (!product.sizes?.length || selectedSize)) 
                  ? 'bg-brand-primary hover:bg-orange-600 text-white shadow-lg' 
                  : 'bg-brand-border text-brand-muted cursor-not-allowed'}`}
            >
              <ShoppingCart size={20} className="md:w-6 md:h-6" /> 
              {!selectedSize && product.sizes?.length > 0 ? 'Selecciona una medida' : (availableStock <= 0 ? 'Agotado' : 'Agregar y Continuar')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}