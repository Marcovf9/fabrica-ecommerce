import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      {/* Barra de Navegación Global (Visible en todas las páginas) */}
      <nav style={{ 
        padding: '15px 30px', 
        backgroundColor: '#1a252f', 
        display: 'flex', 
        gap: '30px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
          🛒 Tienda Pública
        </Link>
      </nav>

      {/* El contenedor donde se renderizará la página correspondiente */}
      <main>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;