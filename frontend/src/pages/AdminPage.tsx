import { useState, useEffect } from 'react';
import { adminService, catalogService } from '../services/api';
import type { Product } from '../types';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  // Dejamos los números como strings vacíos inicialmente para evitar el molesto "0" atascado
  const [newProduct, setNewProduct] = useState({ categoryId: 1, name: '', salePrice: '' });
  const [newBatch, setNewBatch] = useState({ productId: 0, quantityProduced: '', totalBatchCost: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated]);

  const loadProducts = async () => {
    try {
      const data = await catalogService.getCatalog();
      setProducts(data);
      if (data.length > 0) setNewBatch(prev => ({ ...prev, productId: data[0].id }));
    } catch (error) {
      console.error("Error al cargar productos", error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') setIsAuthenticated(true);
    else alert('PIN incorrecto');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Autogeneramos el SKU en silencio (Ej: PRD-458912)
    const generatedSku = `PRD-${Date.now().toString().slice(-6)}`;

    const payload = {
      categoryId: newProduct.categoryId,
      sku: generatedSku,
      name: newProduct.name,
      salePrice: Number(newProduct.salePrice)
    };

    try {
      await adminService.createProduct(payload);
      alert(`¡Producto agregado!\nSKU Asignado: ${generatedSku}`);
      setNewProduct({ categoryId: 1, name: '', salePrice: '' });
      loadProducts();
    } catch (error) {
      alert('Error al crear el producto.');
      console.error(error);
    }
  };

  const handleRegisterBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      productId: newBatch.productId,
      quantityProduced: Number(newBatch.quantityProduced),
      totalBatchCost: Number(newBatch.totalBatchCost)
    };

    try {
      await adminService.registerBatch(payload);
      alert('¡Lote de stock registrado con éxito!');
      setNewBatch(prev => ({ ...prev, quantityProduced: '', totalBatchCost: '' }));
      loadProducts();
    } catch (error) {
      alert('Error al registrar el lote.');
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ border: '1px solid #ccc', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
          <h2>Acceso Restringido</h2>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} style={{ padding: '10px', fontSize: '1.2rem', width: '150px', textAlign: 'center', marginBottom: '15px' }} autoFocus/>
          <br/>
          <button type="submit" style={btnStyle('#2c3e50')}>Ingresar</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Estilo global inyectado para ocultar las flechas de los inputs numéricos */}
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <h1 style={{ color: '#2c3e50' }}>⚙️ Panel de Control de Fábrica</h1>
      <hr style={{ marginBottom: '30px' }}/>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        <div style={cardStyle}>
          <h3>🏷️ Crear Nuevo Producto</h3>
          <form onSubmit={handleCreateProduct}>
            <label style={labelStyle}>Categoría</label>
            <select value={newProduct.categoryId} onChange={(e) => setNewProduct({...newProduct, categoryId: Number(e.target.value)})} style={inputStyle}>
              <option value={1}>Muebles de Exterior Sostenibles (Plástico)</option>
              <option value={2}>Parrillas y Fogoneros Pesados (Hierro)</option>
            </select>

            <label style={labelStyle}>Nombre del Producto</label>
            <input required type="text" placeholder="Ej: Fogonero XL" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} style={inputStyle} />

            <label style={labelStyle}>Precio de Venta al Público ($)</label>
            <input required type="number" placeholder="Ej: 150000" value={newProduct.salePrice} onChange={(e) => setNewProduct({...newProduct, salePrice: e.target.value})} style={inputStyle} />

            <button type="submit" style={btnStyle('#2980b9')}>Crear Producto</button>
          </form>
        </div>

        <div style={cardStyle}>
          <h3>📦 Ingreso de Lote de Producción</h3>
          <form onSubmit={handleRegisterBatch}>
            <label style={labelStyle}>Seleccionar Producto</label>
            <select value={newBatch.productId} onChange={(e) => setNewBatch({...newBatch, productId: Number(e.target.value)})} style={inputStyle}>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock actual: {p.availableStock})</option>
              ))}
            </select>

            <label style={labelStyle}>Cantidad Fabricada (Unidades)</label>
            <input required type="number" placeholder="Ej: 50" value={newBatch.quantityProduced} onChange={(e) => setNewBatch({...newBatch, quantityProduced: e.target.value})} style={inputStyle} />

            <label style={labelStyle}>Costo TOTAL del lote ($)</label>
            <input required type="number" placeholder="Ej: 500000" value={newBatch.totalBatchCost} onChange={(e) => setNewBatch({...newBatch, totalBatchCost: e.target.value})} style={inputStyle} />

            <button type="submit" style={btnStyle('#27ae60')}>Registrar Lote y Stock</button>
          </form>
        </div>

      </div>
    </div>
  );
}

const cardStyle = { flex: 1, minWidth: '350px', backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '8px', border: '1px solid #dee2e6' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', marginTop: '15px' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' as const };
const btnStyle = (color: string) => ({ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' });