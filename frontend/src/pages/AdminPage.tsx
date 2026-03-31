import { useState, useEffect } from 'react';
import { adminService, catalogService, authService } from '../services/api';
import type { Product, ProfitabilityReport, Order, OrderDetail } from '../types';
import Swal from 'sweetalert2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [report, setReport] = useState<ProfitabilityReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetail | null>(null);

  const [newProduct, setNewProduct] = useState({ categoryId: 1, name: '', salePrice: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newBatch, setNewBatch] = useState({ productId: 0, quantityProduced: '', totalBatchCost: '' });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
      loadReport();
      loadOrders();
    }
  }, [isAuthenticated]);

  const handleApiError = (error: any, defaultMessage: string = 'Ocurrió un error') => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      handleLogout();
      Swal.fire({ icon: 'error', title: 'Sesión expirada', text: 'Por favor, ingresa nuevamente.' });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || defaultMessage });
    }
  };

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
      setOrders(data.reverse()); 
    } catch (error) {
      console.error("Error al cargar pedidos", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await authService.login({ username, password });
      localStorage.setItem('admin_token', data.token);
      setIsAuthenticated(true);
      Swal.fire({ icon: 'success', title: 'Acceso Autorizado', timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'Credenciales inválidas.' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const generatedSku = `PRD-${Date.now().toString().slice(-6)}`;
    
    const formData = new FormData();
    formData.append('categoryId', newProduct.categoryId.toString());
    formData.append('sku', generatedSku);
    formData.append('name', newProduct.name);
    formData.append('salePrice', newProduct.salePrice.toString());
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      await adminService.createProduct(formData);
      Swal.fire({ icon: 'success', title: '¡Producto agregado!', html: `SKU Asignado: <b>${generatedSku}</b>` });
      setNewProduct({ categoryId: 1, name: '', salePrice: '' });
      setImageFile(null); 
      loadProducts();
    } catch (error) {
      handleApiError(error, 'No se pudo crear el producto.');
    }
  };

  const handleRegisterBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { productId: newBatch.productId, quantityProduced: Number(newBatch.quantityProduced), totalBatchCost: Number(newBatch.totalBatchCost) };

    try {
      await adminService.registerBatch(payload);
      Swal.fire({ icon: 'success', title: 'Lote Registrado', text: 'El stock y los costos han sido actualizados.', timer: 2000, showConfirmButton: false });
      setNewBatch(prev => ({ ...prev, quantityProduced: '', totalBatchCost: '' }));
      loadProducts();
      loadReport();
    } catch (error) {
      handleApiError(error, 'No se pudo registrar el lote.');
    }
  };

  const handleConfirmOrder = async (orderCode: string) => {
    const result = await Swal.fire({
      title: '¿Confirmar Pago?',
      text: `Se descontará el stock físico del pedido ${orderCode}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#27ae60',
      cancelButtonColor: '#7f8c8d',
      confirmButtonText: 'Sí, Pago Recibido',
      cancelButtonText: 'Volver'
    });
    
    if (result.isConfirmed) {
      try {
        await adminService.confirmOrder(orderCode);
        Swal.fire({ icon: 'success', title: '¡Cobrado!', text: 'Stock y costos actualizados exitosamente.', timer: 2000, showConfirmButton: false });
        loadOrders(); loadProducts(); loadReport(); 
      } catch (error: any) {
        handleApiError(error, 'No se pudo procesar el pago.');
      }
    }
  };

  const handleShipOrder = async (orderCode: string) => {
    const result = await Swal.fire({
      title: '¿Marcar como Enviado?',
      text: `El pedido ${orderCode} saldrá del galpón.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#2980b9',
      cancelButtonColor: '#7f8c8d',
      confirmButtonText: 'Sí, Despachar',
      cancelButtonText: 'Volver'
    });
    
    if (result.isConfirmed) {
      try {
        await adminService.shipOrder(orderCode);
        Swal.fire({ icon: 'success', title: '¡Despachado!', text: 'El pedido ha sido marcado como enviado.', timer: 2000, showConfirmButton: false });
        loadOrders();
      } catch (error: any) {
        handleApiError(error, 'No se pudo despachar el pedido.');
      }
    }
  };

  const handleCancelOrder = async (orderCode: string) => {
    const result = await Swal.fire({
      title: '¿Cancelar Pedido?',
      text: `Se liberará el stock reservado del pedido ${orderCode}.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#7f8c8d',
      confirmButtonText: 'Sí, Cancelar',
      cancelButtonText: 'Atrás'
    });

    if (result.isConfirmed) {
      try {
        await adminService.cancelOrder(orderCode);
        Swal.fire({ icon: 'success', title: 'Cancelado', text: 'El stock ha vuelto al galpón.', timer: 2000, showConfirmButton: false });
        loadOrders(); loadProducts(); 
      } catch (error: any) {
        handleApiError(error, 'No se pudo cancelar el pedido.');
      }
    }
  };

  const handleViewDetails = async (orderCode: string) => {
    try {
      const details = await adminService.getOrderDetails(orderCode);
      setSelectedOrderDetails(details);
    } catch (error) {
      handleApiError(error, 'No se pudieron cargar los detalles del remito.');
    }
  };

  const handleDownloadPdf = async (orderCode: string) => {
    try {
      const blob = await adminService.downloadOrderPdf(orderCode);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `remito_${orderCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      handleApiError(error, 'No se pudo descargar el remito PDF.');
    }
  };

  const handleEditPrice = async (product: Product) => {
    const { value: newPrice } = await Swal.fire({
      title: `Modificar Precio`,
      text: `${product.name} (SKU: ${product.sku})`,
      input: 'number',
      inputLabel: 'Nuevo Precio de Venta Público ($)',
      inputValue: product.salePrice,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2980b9',
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) return 'Debes ingresar un valor mayor a cero';
      }
    });

    if (newPrice) {
      try {
        const catId = product.categoryName.includes('Plástico') ? 1 : 2;
        await adminService.updateProduct(product.id, {
          categoryId: catId,
          sku: product.sku,
          name: product.name,
          salePrice: Number(newPrice)
        });
        Swal.fire({ icon: 'success', title: '¡Actualizado!', text: 'El precio ha sido modificado exitosamente.', timer: 2000, showConfirmButton: false });
        loadProducts(); 
      } catch (error) {
        handleApiError(error, 'No se pudo actualizar el precio.');
      }
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const result = await Swal.fire({
      title: '¿Dar de baja producto?',
      text: `El producto ${product.name} dejará de estar visible en el catálogo público, pero su historial financiero se mantendrá.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#7f8c8d',
      confirmButtonText: 'Sí, Desactivar'
    });

    if (result.isConfirmed) {
      try {
        await adminService.deleteProduct(product.id);
        Swal.fire({ icon: 'success', title: 'Desactivado', text: 'El producto ha sido dado de baja.', timer: 2000, showConfirmButton: false });
        loadProducts(); 
      } catch (error) {
        handleApiError(error, 'No se pudo desactivar el producto.');
      }
    }
  };

  // Función para resolver estilos de estados
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#fcf3cf', color: '#d4ac0d', text: 'PENDIENTE' };
      case 'PAID': return { bg: '#d4efdf', color: '#1e8449', text: 'PAGADO' };
      case 'SHIPPED': return { bg: '#aed6f1', color: '#2874a6', text: 'ENVIADO' };
      case 'CANCELLED': return { bg: '#fadbd8', color: '#c0392b', text: 'CANCELADO' };
      default: return { bg: '#eee', color: '#333', text: status };
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ border: '1px solid #ccc', padding: '40px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🔐 Acceso Administrativo</h2>
          <input required type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} autoFocus/>
          <input required type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
          <button type="submit" style={btnStyle('#2980b9')}>Iniciar Sesión</button>
        </form>
      </div>
    );
  }

  const COLORS = ['#2980b9', '#e67e22', '#27ae60', '#8e44ad', '#f1c40f'];

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1600px', margin: '0 auto' }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>⚙️ Panel de Control de Fábrica</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>
      <hr style={{ marginBottom: '30px' }}/>

      {report.length > 0 && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
          
          <div style={{ ...cardStyle, flex: 2, minWidth: '500px', height: '380px' }}>
            <h3 style={{ marginTop: 0 }}>📈 Comparativa: Ingresos vs Costos Operativos</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={report} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(val) => `$${(val / 1000)}k`} />
                <RechartsTooltip formatter={(value: any) => `$${Number(value).toLocaleString('es-AR')}`} />
                <Legend />
                <Bar dataKey="totalRevenue" name="Ingresos Brutos" fill="#2ecc71" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalCost" name="Costo de Materiales" fill="#e74c3c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...cardStyle, flex: 1, minWidth: '300px', height: '380px' }}>
            <h3 style={{ marginTop: 0, textAlign: 'center' }}>💰 Origen de Ganancia Neta</h3>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie 
                  data={report} 
                  dataKey="netProfit" 
                  nameKey="category" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60}
                  outerRadius={90} 
                  paddingAngle={5}
                >
                  {report.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => `$${Number(value).toLocaleString('es-AR')}`} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
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
              <label style={labelStyle}>Fotografía del Producto (Opcional)</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{...inputStyle, padding: '6px'}} />
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

          <div style={{...cardStyle, borderTop: '4px solid #9b59b6'}}>
            <h3>📝 Catálogo Activo (Precios)</h3>
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={thStyle}>Producto</th>
                    <th style={thStyle}>Precio Actual</th>
                    <th style={thStyle}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{...tdStyle, fontSize: '0.9rem'}}>{p.name} <br/><span style={{color:'#7f8c8d'}}>{p.sku}</span></td>
                      <td style={tdStyle}><strong>${p.salePrice.toLocaleString('es-AR')}</strong></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleEditPrice(p)} style={{ backgroundColor: '#9b59b6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            Editar
                          </button>
                          <button onClick={() => handleDeleteProduct(p)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            Baja
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1.5, minWidth: '400px' }}>
          
          <div style={{ ...cardStyle, borderTop: '4px solid #f39c12' }}>
            <h3>📊 Tablero Financiero Detallado</h3>
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
              <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
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
                    {orders.map((order) => {
                      const statusStyle = getStatusStyle(order.status);
                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={tdStyle}><strong>{order.orderCode}</strong></td>
                          <td style={tdStyle}>{order.customerContact.split('|')[0]}</td>
                          <td style={tdStyle}>${order.totalSaleAmount.toLocaleString('es-AR')}</td>
                          <td style={tdStyle}>
                            <span style={{ 
                              padding: '4px 8px', 
                              backgroundColor: statusStyle.bg, 
                              color: statusStyle.color, 
                              borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' 
                            }}>
                              {statusStyle.text}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              <button onClick={() => handleViewDetails(order.orderCode)} style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Ver Detalle
                              </button>
                              {order.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleConfirmOrder(order.orderCode)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Cobrado
                                  </button>
                                  <button onClick={() => handleCancelOrder(order.orderCode)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Cancelar
                                  </button>
                                </>
                              )}
                              {order.status === 'PAID' && (
                                <button onClick={() => handleShipOrder(order.orderCode)} style={{ backgroundColor: '#2980b9', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                  Despachar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {selectedOrderDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, color: '#2c3e50' }}>📦 Remito Interno: {selectedOrderDetails.orderCode}</h2>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>
            
            <p><strong>Cliente / Contacto:</strong> {selectedOrderDetails.customerContact}</p>
            <p><strong>Estado:</strong> {getStatusStyle(selectedOrderDetails.status).text}</p>

            <h3 style={{ marginTop: '20px', color: '#34495e' }}>Artículos a preparar:</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={thStyle}>Cant.</th>
                  <th style={thStyle}>Producto (SKU)</th>
                  <th style={thStyle}>P. Unitario</th>
                  <th style={thStyle}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrderDetails.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{...tdStyle, fontWeight: 'bold', color: '#2980b9'}}>{item.quantity}x</td>
                    <td style={tdStyle}>{item.productName} <br/><span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{item.sku}</span></td>
                    <td style={tdStyle}>${item.unitPrice.toLocaleString('es-AR')}</td>
                    <td style={tdStyle}>${item.subTotal.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <h2 style={{ textAlign: 'right', marginTop: '20px', color: '#27ae60' }}>
              Total: ${selectedOrderDetails.totalSaleAmount.toLocaleString('es-AR')}
            </h2>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => handleDownloadPdf(selectedOrderDetails.orderCode)} style={{ ...btnStyle('#2980b9'), marginTop: 0 }}>
                🖨️ Descargar Remito PDF
              </button>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ ...btnStyle('#95a5a6'), marginTop: 0 }}>
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const cardStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', marginTop: '15px' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' as const };
const btnStyle = (color: string) => ({ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' });
const thStyle = { padding: '12px', textAlign: 'left' as const, color: '#495057' };
const tdStyle = { padding: '12px', textAlign: 'left' as const };