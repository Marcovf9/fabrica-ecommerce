import { useState, useEffect } from 'react';
import { adminService, catalogService } from '../services/api';
// Actualizamos los imports para traer los nuevos tipos
import type { Product, ProfitabilityReport, Order } from '../types';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  // Estados de los datos
  const [products, setProducts] = useState<Product[]>([]);
  const [report, setReport] = useState<ProfitabilityReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Estados de los formularios
  const [newProduct, setNewProduct] = useState({ categoryId: 1, name: '', salePrice: '' });
  const [newBatch, setNewBatch] = useState({ productId: 0, quantityProduced: '', totalBatchCost: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadReport();
      loadOrders();
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

  const loadReport = async () => {
    try {
      const data = await adminService.getProfitabilityReport();
      setReport(data);
    } catch (error) {
      console.error("Error al cargar el reporte", error);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await adminService.getOrders();
      setOrders(data.reverse()); // Los más nuevos primero
    } catch (error) {
      console.error("Error al cargar pedidos", error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') setIsAuthenticated(true);
    else alert('PIN incorrecto');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const generatedSku = `PRD-${Date.now().toString().slice(-6)}`;
    const payload = { categoryId: newProduct.categoryId, sku: generatedSku, name: newProduct.name, salePrice: Number(newProduct.salePrice) };

    try {
      await adminService.createProduct(payload);
      alert(`¡Producto agregado!\nSKU Asignado: ${generatedSku}`);
      setNewProduct({ categoryId: 1, name: '', salePrice: '' });
      loadProducts();
    } catch (error) {
      alert('Error al crear el producto.');
    }
  };

  const handleRegisterBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { productId: newBatch.productId, quantityProduced: Number(newBatch.quantityProduced), totalBatchCost: Number(newBatch.totalBatchCost) };

    try {
      await adminService.registerBatch(payload);
      alert('¡Lote de stock registrado con éxito!');
      setNewBatch(prev => ({ ...prev, quantityProduced: '', totalBatchCost: '' }));
      loadProducts();
      loadReport();
    } catch (error) {
      alert('Error al registrar el lote.');
    }
  };

  const handleConfirmOrder = async (orderCode: string) => {
    if (!window.confirm(`¿Confirmar pedido ${orderCode}? Esto descontará el stock definitivamente.`)) return;
    
    try {
      await adminService.confirmOrder(orderCode);
      alert('¡Pedido confirmado! Stock y costos actualizados.');
      loadOrders();
      loadProducts(); 
      loadReport(); 
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al confirmar. Posible falta de stock.');
    }
  };

  const handleCancelOrder = async (orderCode: string) => {
    if (!window.confirm(`¿Estás seguro de CANCELAR el pedido ${orderCode}? Esto liberará el stock reservado.`)) return;
    
    try {
      await adminService.cancelOrder(orderCode);
      alert('Pedido cancelado. El stock ha sido liberado.');
      loadOrders();
      loadProducts(); 
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cancelar el pedido.');
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
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <h1 style={{ color: '#2c3e50' }}>⚙️ Panel de Control de Fábrica</h1>
      <hr style={{ marginBottom: '30px' }}/>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* COLUMNA IZQ: Formularios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1, minWidth: '350px' }}>
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
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.availableStock})</option>
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

        {/* COLUMNA DER: Reportes y Pedidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1.5, minWidth: '400px' }}>
          
          <div style={{ ...cardStyle, borderTop: '4px solid #f39c12' }}>
            <h3>📊 Desempeño Financiero</h3>
            {report.length === 0 ? <p>No hay ventas confirmadas.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={thStyle}>Categoría</th>
                    <th style={thStyle}>Ingresos</th>
                    <th style={thStyle}>Costos</th>
                    <th style={thStyle}>Ganancia</th>
                    <th style={thStyle}>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}><strong>{row.category}</strong></td>
                      <td style={tdStyle}>${row.totalRevenue.toLocaleString('es-AR')}</td>
                      <td style={{...tdStyle, color: '#e74c3c'}}>-${row.totalCost.toLocaleString('es-AR')}</td>
                      <td style={{...tdStyle, color: '#27ae60', fontWeight: 'bold'}}>${row.netProfit.toLocaleString('es-AR')}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '4px 8px', backgroundColor: row.marginPercentage > 30 ? '#d4efdf' : '#fadbd8', borderRadius: '4px', color: row.marginPercentage > 30 ? '#1e8449' : '#c0392b', fontWeight: 'bold' }}>
                          {row.marginPercentage.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ ...cardStyle, borderTop: '4px solid #3498db' }}>
            <h3>📋 Gestión de Pedidos</h3>
            {orders.length === 0 ? <p>No hay pedidos registrados.</p> : (
              <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={thStyle}>Código</th>
                      <th style={thStyle}>Cliente</th>
                      <th style={thStyle}>Total</th>
                      <th style={thStyle}>Estado</th>
                      <th style={thStyle}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={tdStyle}><strong>{order.orderCode}</strong></td>
                        <td style={tdStyle}>{order.customerContact.split('|')[0]}</td>
                        <td style={tdStyle}>${order.totalSaleAmount.toLocaleString('es-AR')}</td>
                        <td style={tdStyle}>
                          <span style={{ 
                            padding: '4px 8px', 
                            backgroundColor: order.status === 'PENDING' ? '#fcf3cf' : (order.status === 'CONFIRMED' ? '#d4efdf' : '#fadbd8'), 
                            color: order.status === 'PENDING' ? '#d4ac0d' : (order.status === 'CONFIRMED' ? '#1e8449' : '#c0392b'), 
                            borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' 
                          }}>
                            {order.status === 'PENDING' ? 'PENDIENTE' : (order.status === 'CONFIRMED' ? 'CONFIRMADO' : 'CANCELADO')}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {order.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => handleConfirmOrder(order.orderCode)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Confirmar
                              </button>
                              <button onClick={() => handleCancelOrder(order.orderCode)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', marginTop: '15px' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' as const };
const btnStyle = (color: string) => ({ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' });
const thStyle = { padding: '12px', textAlign: 'left' as const, color: '#495057' };
const tdStyle = { padding: '12px', textAlign: 'left' as const };