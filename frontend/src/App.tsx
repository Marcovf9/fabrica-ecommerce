import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';
import TrackingPage from './pages/TrackingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import FaqPage from './pages/FaqPage';
import TermsPage from './pages/TermsPage';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      
      <div className="flex flex-col min-h-screen bg-brand-gray font-sans text-brand-dark">
        
        {/* ENCABEZADO GLOBAL CLARO */}
        <header className="bg-white border-b border-brand-border sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1600px] w-[95%] mx-auto py-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            
            <Link to="/" className="flex items-center gap-5 hover:opacity-80 transition-opacity">
              <img 
                src="/logo.jpeg" 
                alt="Ritual Espacios" 
                className="h-16 md:h-20 w-auto rounded object-cover shadow-sm border border-brand-border" 
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-light tracking-[0.15em] uppercase m-0 text-brand-dark">
                  Ritual <span className="font-bold text-brand-primary">Espacios</span>
                </h1>
                <p className="text-brand-muted text-[10px] md:text-xs tracking-[0.2em] m-0 uppercase mt-1">
                  Fuego & Diseño
                </p>
              </div>
            </Link>
            
            <nav className="flex gap-6">
              <Link to="/" className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors">
                Catálogo
              </Link>
              <Link to="/tracking" className="text-sm font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors">
                Seguir Pedido
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full">
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