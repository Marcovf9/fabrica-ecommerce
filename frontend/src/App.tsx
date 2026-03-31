import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage';
import AdminPage from './pages/AdminPage';
import TrackingPage from './pages/TrackingPage';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ 
        padding: '15px 30px', 
        backgroundColor: '#1a252f', 
        display: 'flex', 
        gap: '30px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
          🛒 Tienda Pública
        </Link>
        <Link to="/tracking" style={{ color: '#bdc3c7', textDecoration: 'none', fontSize: '1rem', fontWeight: 'bold', borderLeft: '1px solid #34495e', paddingLeft: '30px' }}>
          📍 Seguir mi Pedido
        </Link>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;