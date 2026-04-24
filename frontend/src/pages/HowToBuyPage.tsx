import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import CatalogPage from './ProductsPage.tsx';
import AdminPage from '../pages/AdminPage';
import TrackingPage from '../pages/TrackingPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import HowToBuyPage from '../pages/HowToBuyPage';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import FaqPage from '../pages/FaqPage';
import TermsPage from '../pages/TermsPage';
import { Menu, X } from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      
      <div className="flex flex-col min-h-screen bg-brand-gray font-sans text-brand-dark">
        <header className="bg-white border-b border-brand-border sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1600px] w-[95%] mx-auto py-3 md:py-4 flex justify-between items-center">
            
            <Link to="/" onClick={closeMenu} className="flex items-center gap-3 md:gap-5 hover:opacity-80 transition-opacity z-50">
              <img 
                src="/logo.jpeg" 
                alt="Ritual Espacios" 
                className="h-12 md:h-20 w-auto rounded object-cover shadow-sm border border-brand-border" 
              />
              <div>
                <h1 className="text-xl md:text-3xl font-light tracking-[0.15em] uppercase m-0 text-brand-dark">
                  Ritual <span className="font-bold text-brand-primary">Espacios</span>
                </h1>
                <p className="text-brand-muted text-[9px] md:text-xs tracking-[0.2em] m-0 uppercase md:mt-1">
                  Fuego & Diseño
                </p>
              </div>
            </Link>
            
            {/* Botón Menú Hamburguesa (Solo Celular) */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center gap-2 p-2 border border-brand-border rounded text-brand-dark hover:bg-brand-gray z-50"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Menú</span>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Navegación Desktop (Oculta en Celular) */}
            <nav className="hidden md:flex gap-6 items-center">
              <Link to="/como-comprar" className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors">
                Cómo Comprar
              </Link>
              <Link to="/" className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors">
                Catálogo
              </Link>
              <Link to="/tracking" className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors">
                Seguir Pedido
              </Link>
            </nav>
          </div>

          {/* Menú Desplegable Celular */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-brand-border shadow-lg flex flex-col py-4 px-4 gap-4 animate-fade-in z-40">
              <Link 
                to="/como-comprar" 
                onClick={closeMenu}
                className="p-4 bg-orange-50 rounded-lg text-brand-primary font-bold uppercase tracking-widest flex justify-between items-center border border-orange-200"
              >
                1. ¿Cómo comprar? <span className="text-brand-primary">→</span>
              </Link>
              <Link 
                to="/" 
                onClick={closeMenu}
                className="p-4 bg-brand-gray rounded-lg text-brand-dark font-bold uppercase tracking-widest flex justify-between items-center border border-brand-border"
              >
                2. Ver Catálogo <span className="text-brand-primary">→</span>
              </Link>
              <Link 
                to="/tracking" 
                onClick={closeMenu}
                className="p-4 bg-brand-gray rounded-lg text-brand-dark font-bold uppercase tracking-widest flex justify-between items-center border border-brand-border"
              >
                3. Seguir mi Pedido <span className="text-brand-primary">→</span>
              </Link>
              <Link 
                to="/faq" 
                onClick={closeMenu}
                className="p-4 bg-white rounded-lg text-brand-muted text-xs font-bold uppercase tracking-widest text-center mt-2 border border-brand-border"
              >
                Preguntas Frecuentes
              </Link>
            </div>
          )}
        </header>

        <main className="flex-1 w-full relative z-10">
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/producto/:sku" element={<ProductDetailPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/como-comprar" element={<HowToBuyPage />} /> {/* <-- RUTA NUEVA */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="/faq" element={<FaqPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;