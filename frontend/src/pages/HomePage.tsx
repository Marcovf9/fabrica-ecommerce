import { useEffect, useState } from 'react';
import { catalogService } from '../services/api';
import type { Product } from '../types';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { PackageOpen, LayoutGrid } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await catalogService.getCatalog();
        setProducts(data);
      } catch (err) { console.error("Error al cargar destacados", err); }
    };
    fetchCatalog();
  }, []);

  const featuredProducts = products.filter(p => (p as any).isFeatured).length > 0 
    ? products.filter(p => (p as any).isFeatured) 
    : products.slice(0, 4);

  const categoryFilters = [
    { name: 'Todas', icon: <LayoutGrid size={28} className="text-white" /> }, 
    { name: 'Parrillas', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776966658/Parrilla_2_efiv1z.jpg' },
    { name: 'Chulengos', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776968980/Chulengo_1_upvasu.jpg' },
    { name: 'Accesorios', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776966616/Palita_y_Atizador_1_di9p5e.jpg' },
    { name: 'Fogoneros', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776969396/Fogonero_1_b2rjp7.jpg' },
    { name: 'Muebles de exterior sostenibles', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776970228/Muebles_de_exterior_1_p45uhn.png' }
  ];

  return (
    <>
      <Helmet><title>Ritual Espacios | Fuego & Diseño</title></Helmet>

      {/* 1. SECCIÓN PORTADA (HERO) */}
      <div className="relative w-full bg-brand-dark flex flex-col items-center justify-center">
        
        <img 
          src="https://res.cloudinary.com/dq5bau3ky/image/upload/f_auto,q_auto,dpr_auto/v1776989629/Portada_sxxmtm.png" 
          alt="Ritual Espacios Portada" 
          className="w-full h-auto block opacity-100" 
        />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto md:mt-16">
            <Link 
              to="/productos" 
              className="inline-block bg-brand-primary text-white px-4 md:px-12 py-1.5 md:py-4 rounded-sm text-[8px] md:text-base font-bold uppercase tracking-widest hover:bg-orange-600 transition-all duration-300 shadow-[0_4px_20px_rgba(214,112,38,0.4)] hover:scale-105"
            >
              Ver Productos
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TIRA DE CATEGORÍAS (NAVEGA A PRODUCTOS) */}
      <div className="bg-white border-b border-brand-border py-8 shadow-sm">
        <div className="max-w-[1600px] w-[95%] mx-auto flex gap-3 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth items-start justify-start lg:justify-center">
          {categoryFilters.map(cat => (
            <button 
              key={cat.name} 
              // Al tocar, navegamos a /productos y le mandamos la categoría elegida
              onClick={() => navigate('/productos', { state: { category: cat.name } })}
              className="flex flex-col items-center gap-2 group flex-shrink-0 w-[76px] md:w-[100px]"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full p-1 transition-all duration-300 border-2 border-transparent group-hover:border-brand-primary">
                <div className="w-full h-full rounded-full overflow-hidden shadow-inner bg-brand-dark flex items-center justify-center">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="transition-transform duration-700 group-hover:scale-110">{cat.icon}</div>
                  )}
                </div>
              </div>
              <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-center leading-tight line-clamp-2 px-1 text-brand-muted group-hover:text-brand-dark">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. PRODUCTOS DESTACADOS */}
      {featuredProducts.length > 0 && (
        <section className="bg-brand-dark py-12 md:py-20 relative">
          <div className="max-w-[1600px] w-[95%] mx-auto">
            <h2 className="text-center text-2xl md:text-4xl text-white font-light uppercase tracking-[0.2em] mb-2 drop-shadow-lg">
              Colección <span className="font-bold text-brand-primary">Destacada</span>
            </h2>
            <p className="text-center text-brand-gray text-xs md:text-sm uppercase tracking-widest mb-10 opacity-80">
              Los favoritos de Ritual
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
               {featuredProducts.slice(0, 4).map(product => (
                  <Link key={`feat-${product.id}`} to={`/producto/${product.sku}`} className="bg-white border border-brand-border rounded-lg overflow-hidden group hover:shadow-2xl hover:shadow-brand-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="h-48 md:h-72 overflow-hidden relative bg-brand-gray">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        <img src={optimizeCloudinaryUrl(product.imageUrls[0], 500)} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-muted"><PackageOpen size={32} /></div>
                      )}
                      <div className="absolute top-3 right-3 bg-brand-dark text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-sm shadow-md">
                        🌟 Top Ventas
                      </div>
                    </div>
                    <div className="p-4 md:p-6 text-center">
                      <h3 className="text-sm md:text-base font-bold text-brand-dark mb-2 line-clamp-1">{product.name}</h3>
                      <p className="text-lg md:text-xl font-black text-brand-primary">${product.salePrice.toLocaleString('es-AR')}</p>
                    </div>
                  </Link>
               ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. BANNER DE INSTAGRAM (Sin línea naranja, con un tono apenas diferente) */}
      <div id="contacto" className="w-full bg-[#111111] py-16 md:py-24 text-center border-t border-white/5">
        <p className="text-brand-muted text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-6">
          Formá parte de la comunidad
        </p>
        <a 
          href="https://instagram.com/ritual.espacios" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center gap-4 text-3xl md:text-5xl font-light text-white hover:text-brand-primary transition-colors tracking-widest group"
        >
          <FaInstagram className="text-brand-primary group-hover:scale-110 transition-transform" /> 
          @RITUAL.ESPACIOS
        </a>
      </div>
    </>
  );
}