import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import AdminPage from './pages/AdminPage';
import TrackingPage from './pages/TrackingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import HowToBuyPage from './pages/HowToBuyPage';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import FaqPage from './pages/FaqPage';
import TermsPage from './pages/TermsPage';
import { Menu, X, Mail } from 'lucide-react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      
      <div className="flex flex-col min-h-screen bg-brand-gray font-sans text-brand-dark">
        <header className="bg-white border-b border-brand-border sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1600px] w-[95%] mx-auto py-3 md:py-4 flex justify-between items-center">
            
            <Link to="/" 
              onClick={() => { 
                closeMenu(); window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }} className="flex items-center gap-3 md:gap-5 hover:opacity-80 transition-opacity z-50">
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
              <Link to="/productos" className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors">
                Productos
              </Link>
              <Link to="/tracking" className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors">
                Seguir Pedido
              </Link>
              <div className="relative group py-4">
                <span className="text-sm font-bold uppercase tracking-widest text-brand-muted group-hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-1">
                  Contacto
                </span>
                <div className="absolute top-full right-0 mt-[-10px] w-48 bg-white border border-brand-border rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 flex flex-col overflow-hidden">
                  <a href="https://wa.me/5493516071362" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center gap-3 text-xs font-bold text-brand-dark hover:bg-brand-gray hover:text-brand-primary transition-colors border-b border-brand-border uppercase tracking-widest">
                    <FaWhatsapp size={16} /> WhatsApp
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

          {/* Menú Móvil */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-brand-border shadow-lg flex flex-col py-4 px-4 gap-4 animate-fade-in z-40">
              <Link to="/" onClick={() => { closeMenu(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-4 bg-brand-gray rounded-lg text-brand-dark font-bold uppercase tracking-widest flex justify-between items-center border border-brand-border">
                1. Inicio <span className="text-brand-primary">→</span>
              </Link>
              <Link to="/productos" onClick={closeMenu} className="p-4 bg-brand-gray rounded-lg text-brand-dark font-bold uppercase tracking-widest flex justify-between items-center border border-brand-border">
                2. Ver Productos <span className="text-brand-primary">→</span>
              </Link>
              <Link to="/tracking" onClick={closeMenu} className="p-4 bg-brand-gray rounded-lg text-brand-dark font-bold uppercase tracking-widest flex justify-between items-center border border-brand-border">
                3. Seguir mi Pedido <span className="text-brand-primary">→</span>
              </Link>
              <div className="p-4 bg-brand-gray rounded-lg border border-brand-border flex flex-col gap-3 mt-2">
                <span className="text-brand-dark font-bold uppercase tracking-widest text-xs mb-1 text-center">Contacto Rápido</span>
                <div className="flex gap-2">
                   <a href="https://wa.me/5493516071362" onClick={closeMenu} className="flex-1 flex justify-center py-3 bg-white rounded border border-brand-border text-brand-dark hover:text-brand-primary shadow-sm"><FaWhatsapp size={20}/></a>
                   <a href="https://instagram.com/ritual.espacios" onClick={closeMenu} className="flex-1 flex justify-center py-3 bg-white rounded border border-brand-border text-brand-dark hover:text-brand-primary shadow-sm"><FaInstagram size={20}/></a>
                   <a href="mailto:ritualparrillas@gmail.com" onClick={closeMenu} className="flex-1 flex justify-center py-3 bg-white rounded border border-brand-border text-brand-dark hover:text-brand-primary shadow-sm"><Mail size={20}/></a>
                </div>
              </div>
              <Link to="/faq" onClick={closeMenu} className="p-4 bg-white rounded-lg text-brand-muted text-xs font-bold uppercase tracking-widest text-center mt-2 border border-brand-border">
                Preguntas Frecuentes
              </Link>
            </div>
          )}
        </header>

        <main className="flex-1 w-full relative z-10">
          <Routes>
            {/* Nuevas rutas separadas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/productos" element={<ProductsPage />} />
            
            <Route path="/producto/:sku" element={<ProductDetailPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/como-comprar" element={<HowToBuyPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="/faq" element={<FaqPage />} />
          </Routes>
        </main>

        <Footer />

        {/* Botón Global Flotante WhatsApp */}
        <a 
          href="https://wa.me/5493516071362" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#25D366] text-white p-3 md:p-4 rounded-full shadow-[0_4px_14px_rgba(37,211,102,0.4)] hover:scale-110 hover:bg-[#20bd5a] transition-all duration-300 z-[100] flex items-center justify-center"
          title="Contactanos por WhatsApp"
        >
          <FaWhatsapp className="w-8 h-8 md:w-10 md:h-10" />
        </a>

      </div>
    </BrowserRouter>
  );
}

export default App;