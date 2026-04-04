import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';
import TrackingPage from './pages/TrackingPage';

function App() {
  return (
    <BrowserRouter>
      <div style={{ backgroundColor: '#2B2522', minHeight: '100vh', color: '#F5EFE6', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>
        
        {/* ENCABEZADO GLOBAL */}
        <header style={{ backgroundColor: '#1A1816', borderBottom: '2px solid #D67026', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
              <img src="/logo.jpeg" alt="Ritual Espacios" style={{ height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#F5EFE6' }}>RITUAL <span style={{ color: '#D67026' }}>ESPACIOS</span></h1>
                <p style={{ margin: 0, color: '#B8B0A3', fontSize: '0.85rem', letterSpacing: '1px' }}>FUEGO & DISEÑO</p>
              </div>
            </Link>
            
            <nav style={{ display: 'flex', gap: '25px' }}>
              <Link to="/" style={navLinkStyle}>Catálogo</Link>
              <Link to="/tracking" style={navLinkStyle}>Seguir Pedido</Link>
            </nav>
          </div>
        </header>

        {/* CONTENIDO DINÁMICO */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/terminos" element={<div style={pagePlaceholder}><h2>Términos y Condiciones</h2><p>Documento en redacción...</p></div>} />
            <Route path="/faq" element={<div style={pagePlaceholder}><h2>Preguntas Frecuentes</h2><p>Documento en redacción...</p></div>} />
          </Routes>
        </main>

        {/* PIE DE PÁGINA GLOBAL */}
        <footer style={{ backgroundColor: '#1A1816', borderTop: '1px solid #3A322D', padding: '50px 20px', marginTop: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between' }}>
            
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ color: '#D67026', letterSpacing: '1px', marginBottom: '20px' }}>RITUAL ESPACIOS</h3>
              <p style={{ color: '#B8B0A3', lineHeight: '1.6' }}>Fabricación de mobiliario exterior y parrillas pesadas. Estructuras sólidas diseñadas para perdurar.</p>
            </div>

            <div style={{ flex: '1 1 250px' }}>
              <h4 style={{ color: '#F5EFE6', marginBottom: '20px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Atención al Cliente</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#B8B0A3', lineHeight: '2' }}>
                <li>📱 WhatsApp: <a href="https://wa.me/5493516071362" target="_blank" rel="noreferrer" style={footerLink}>+54 9 351 607 1362</a></li>
                <li>📸 Instagram: <a href="https://instagram.com/ritual.espacios" target="_blank" rel="noreferrer" style={footerLink}>@ritual.espacios</a></li>
                <li>✉️ Correo: <a href="mailto:ritualparrillas@gmail.com" style={footerLink}>ritualparrillas@gmail.com</a></li>
              </ul>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <h4 style={{ color: '#F5EFE6', marginBottom: '20px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Información Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
                <li><Link to="/faq" style={footerLink}>Preguntas Frecuentes (FAQ)</Link></li>
                <li><Link to="/terminos" style={footerLink}>Términos y Condiciones</Link></li>
                <li><Link to="/terminos" style={footerLink}>Política de Envíos y Devoluciones</Link></li>
              </ul>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: '#68594D', marginTop: '50px', fontSize: '0.8rem' }}>
            &copy; {new Date().getFullYear()} Ritual Espacios. Todos los derechos reservados.
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

const navLinkStyle = { color: '#F5EFE6', textDecoration: 'none', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase' as const, letterSpacing: '1px' };
const footerLink = { color: '#B8B0A3', textDecoration: 'none', transition: 'color 0.2s' };
const pagePlaceholder = { padding: '60px 20px', textAlign: 'center' as const, color: '#B8B0A3' };

export default App;