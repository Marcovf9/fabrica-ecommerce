import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';
import TrackingPage from './pages/TrackingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import FaqPage from './pages/FaqPage';
import TermsPage from './pages/TermsPage';
import { Menu, X, MessageCircle, Mail } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';

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

            {/* Navegación Desktop */}
            <nav className="hidden md:flex gap-6 items-center">
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors items-center flex">
                Inicio
              </Link>
              <a href="/#catalogo" className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors">
                Categorías
              </a>
              <Link to="/tracking" className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors">
                Seguir Pedido
              </Link>
              {/* Desplegable de Contacto */}
              <div className="relative group py-4">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-muted group-hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-1">
                  Contacto
                </span>
                {/* Menú Flotante */}
                <div className="absolute top-full right-0 mt-[-10px] w-48 bg-white border border-brand-border rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 flex flex-col overflow-hidden">
                  <a href="https://wa.me/5493516071362" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center gap-3 text-xs font-bold text-brand-dark hover:bg-brand-gray hover:text-brand-primary transition-colors border-b border-brand-border uppercase tracking-widest">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  <a href="https://instagram.com/ritual.espacios" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center gap-3 text-xs font-bold text-brand-dark hover:bg-brand-gray hover:text-brand-primary transition-colors border-b border-brand-border uppercase tracking-widest">
                    <FaInstagram size={16} /> Instagram
                  </a>
                  <a href="mailto:ritualparrillas@gmail.com" className="px-4 py-3 flex items-center gap-3 text-xs font-bold text-brand-dark hover:bg-brand-gray hover:text-brand-primary transition-colors uppercase tracking-widest">
                    <Mail size={16} /> Email
                  </a>
                </div>
              </div>
            </nav>
          </div>

          {/* Menú Desplegable Celular */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-brand-border shadow-lg flex flex-col py-4 px-4 gap-4 animate-fade-in z-40">
              <Link to="/" onClick={() => { closeMenu(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-4 bg-brand-gray rounded-lg text-brand-dark font-bold uppercase tracking-widest border border-brand-border">
                Inicio
              </Link>
              <a href="/#catalogo" onClick={closeMenu} className="p-4 bg-brand-gray rounded-lg text-brand-dark font-bold uppercase tracking-widest border border-brand-border">
                Categorías
              </a>
              <Link to="/tracking" onClick={closeMenu} className="p-4 bg-brand-gray rounded-lg text-brand-dark font-bold uppercase tracking-widest border border-brand-border">
                Seguir mi Pedido
              </Link>
              {/* Contacto en Menú Móvil */}
              <div className="p-4 bg-brand-gray rounded-lg border border-brand-border flex flex-col gap-3 mt-2">
                <span className="text-brand-dark font-bold uppercase tracking-widest text-xs mb-1 text-center">Contacto Rápido</span>
                <div className="flex gap-2">
                   <a href="https://wa.me/5493516071362" onClick={closeMenu} className="flex-1 flex justify-center py-3 bg-white rounded border border-brand-border text-brand-dark hover:text-brand-primary"><MessageCircle size={20}/></a>
                   <a href="https://instagram.com/ritual.espacios" onClick={closeMenu} className="flex-1 flex justify-center py-3 bg-white rounded border border-brand-border text-brand-dark hover:text-brand-primary"><FaInstagram size={20}/></a>
                   <a href="mailto:ritualparrillas@gmail.com" onClick={closeMenu} className="flex-1 flex justify-center py-3 bg-white rounded border border-brand-border text-brand-dark hover:text-brand-primary"><Mail size={20}/></a>
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 w-full relative z-10">
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/producto/:sku" element={<ProductDetailPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
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