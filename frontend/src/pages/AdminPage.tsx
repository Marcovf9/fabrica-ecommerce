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

  const [newProduct, setNewProduct] = useState({ categoryId: 1, name: '', description: '', salePrice: '' });
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
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
      Swal.fire({ icon: 'error', title: 'Sesión expirada', text: 'Por favor, ingresa nuevamente.', background: '#3A322D', color: '#F5EFE6' });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || defaultMessage, background: '#3A322D', color: '#F5EFE6' });
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
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'Credenciales inválidas.', background: '#3A322D', color: '#F5EFE6' });
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
    formData.append('description', newProduct.description);
    formData.append('salePrice', newProduct.salePrice.toString());
    
    if (imageFiles) {
      for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
      }
    }

    try {
      await adminService.createProduct(formData);
      Swal.fire({ icon: 'success', title: '¡Producto agregado!', html: `SKU Asignado: <b style="color:#D67026">${generatedSku}</b>`, background: '#3A322D', color: '#F5EFE6' });
      setNewProduct({ categoryId: 1, name: '', description: '', salePrice: '' });
      setImageFiles(null); 
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      loadProducts();
    } catch (error) {
      handleApiError(error, 'No se pudo crear el producto.');
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
      Swal.fire({ icon: 'success', title: 'Lote Registrado', text: 'Stock actualizado.', timer: 2000, showConfirmButton: false, background: '#3A322D', color: '#F5EFE6' });
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
      confirmButtonColor: '#D67026',
      cancelButtonColor: '#68594D',
      confirmButtonText: 'Sí, Pago Recibido',
      background: '#3A322D', color: '#F5EFE6'
    });
    
    if (result.isConfirmed) {
      try {
        await adminService.confirmOrder(orderCode);
        Swal.fire({ icon: 'success', title: '¡Cobrado!', timer: 2000, showConfirmButton: false, background: '#3A322D', color: '#F5EFE6' });
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
      cancelButtonColor: '#68594D',
      confirmButtonText: 'Sí, Despachar',
      background: '#3A322D', color: '#F5EFE6'
    });
    
    if (result.isConfirmed) {
      try {
        await adminService.shipOrder(orderCode);
        Swal.fire({ icon: 'success', title: '¡Despachado!', timer: 2000, showConfirmButton: false, background: '#3A322D', color: '#F5EFE6' });
        loadOrders();
      } catch (error: any) {
        handleApiError(error, 'No se pudo despachar el pedido.');
      }
    }
  };

  const handleCancelOrder = async (orderCode: string) => {
    const result = await Swal.fire({
      title: '¿Cancelar Pedido?',
      text: `Se liberará el stock reservado.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#68594D',
      confirmButtonText: 'Sí, Cancelar',
      background: '#3A322D', color: '#F5EFE6'
    });

    if (result.isConfirmed) {
      try {
        await adminService.cancelOrder(orderCode);
        Swal.fire({ icon: 'success', title: 'Cancelado', timer: 2000, showConfirmButton: false, background: '#3A322D', color: '#F5EFE6' });
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
      text: `${product.name}`,
      input: 'number',
      inputValue: product.salePrice,
      showCancelButton: true,
      confirmButtonColor: '#D67026',
      cancelButtonColor: '#68594D',
      background: '#3A322D', color: '#F5EFE6'
    });

    if (newPrice) {
      try {
        const catId = product.categoryName.includes('Plástico') ? 1 : 2;
        await adminService.updateProduct(product.id, {
          categoryId: catId,
          sku: product.sku,
          name: product.name,
          salePrice: Number(newPrice),
          description: product.description
        });
        Swal.fire({ icon: 'success', title: 'Actualizado', timer: 2000, showConfirmButton: false, background: '#3A322D', color: '#F5EFE6' });
        loadProducts(); 
      } catch (error) {
        handleApiError(error, 'No se pudo actualizar el precio.');
      }
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const result = await Swal.fire({
      title: '¿Dar de baja producto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#68594D',
      background: '#3A322D', color: '#F5EFE6'
    });

    if (result.isConfirmed) {
      try {
        await adminService.deleteProduct(product.id);
        Swal.fire({ icon: 'success', title: 'Desactivado', timer: 2000, showConfirmButton: false, background: '#3A322D', color: '#F5EFE6' });
        loadProducts(); 
      } catch (error) {
        handleApiError(error, 'No se pudo desactivar el producto.');
      }
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#4A4132', color: '#F1C40F', text: 'PENDIENTE' };
      case 'PAID': return { bg: '#294736', color: '#2ECC71', text: 'PAGADO' };
      case 'SHIPPED': return { bg: '#284154', color: '#3498DB', text: 'ENVIADO' };
      case 'CANCELLED': return { bg: '#4F2B2B', color: '#E74C3C', text: 'CANCELADO' };
      default: return { bg: '#51433A', color: '#B8B0A3', text: status };
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <form onSubmit={handleLogin} style={{ border: '1px solid #51433A', padding: '40px', borderRadius: '4px', textAlign: 'center', backgroundColor: '#3A322D', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          <h2 style={{ color: '#F5EFE6', marginBottom: '20px' }}>🔐 Acceso Administrativo</h2>
          <input required type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} autoFocus/>
          <input required type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle}/>
          <button type="submit" style={btnStyle('#D67026')}>Iniciar Sesión</button>
        </form>
      </div>
    );
  }

  const COLORS = ['#D67026', '#2980b9', '#27ae60', '#8e44ad', '#f1c40f'];

  return (
    <div style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto' }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#F5EFE6', margin: 0 }}>⚙️ Panel de Control de Fábrica</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>
      <hr style={{ borderColor: '#51433A', marginBottom: '30px' }}/>

      {report.length > 0 && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
          
          <div style={{ ...cardStyle, flex: 2, minWidth: '500px', height: '380px' }}>
            <h3 style={{ marginTop: 0, color: '#D67026' }}>📈 Comparativa: Ingresos vs Costos Operativos</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={report} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#51433A" />
                <XAxis dataKey="category" stroke="#B8B0A3" />
                <YAxis tickFormatter={(val) => `$${(val / 1000)}k`} stroke="#B8B0A3" />
                <RechartsTooltip formatter={(value: any) => `$${Number(value).toLocaleString('es-AR')}`} contentStyle={{ backgroundColor: '#2B2522', borderColor: '#51433A', color: '#F5EFE6' }} />
                <Legend wrapperStyle={{ color: '#B8B0A3' }} />
                <Bar dataKey="totalRevenue" name="Ingresos Brutos" fill="#D67026" radius={[2, 2, 0, 0]} />
                <Bar dataKey="totalCost" name="Costo de Materiales" fill="#51433A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...cardStyle, flex: 1, minWidth: '300px', height: '380px' }}>
            <h3 style={{ marginTop: 0, textAlign: 'center', color: '#D67026' }}>💰 Origen de Ganancia Neta</h3>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={report} dataKey="netProfit" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}>
                  {report.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => `$${Number(value).toLocaleString('es-AR')}`} contentStyle={{ backgroundColor: '#2B2522', borderColor: '#51433A', color: '#F5EFE6' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#B8B0A3' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', flex: 1, minWidth: '350px' }}>
          <div style={cardStyle}>
            <h3 style={{ color: '#D67026' }}>🏷️ Crear Nuevo Producto</h3>
            <form onSubmit={handleCreateProduct}>
              <label style={labelStyle}>Categoría</label>
              <select value={newProduct.categoryId} onChange={(e) => setNewProduct({...newProduct, categoryId: Number(e.target.value)})} style={inputStyle}>
                <option value={1}>Muebles de Exterior Sostenibles (Plástico)</option>
                <option value={2}>Parrillas y Fogoneros Pesados (Hierro)</option>
              </select>
              <label style={labelStyle}>Nombre del Producto</label>
              <input required type="text" placeholder="Ej: Fogonero XL" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} style={inputStyle} />
              <label style={labelStyle}>Descripción Detallada</label>
              <textarea required placeholder="Medidas, materiales ..." value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
              <label style={labelStyle}>Precio de Venta al Público ($)</label>
              <input required type="number" placeholder="Ej: 150000" value={newProduct.salePrice} onChange={(e) => setNewProduct({...newProduct, salePrice: e.target.value})} style={inputStyle} />
              <label style={labelStyle}>Fotografías del Producto (Múltiples)</label>
              <input id="file-upload" type="file" accept="image/*" multiple onChange={(e) => setImageFiles(e.target.files)} style={{...inputStyle, padding: '6px'}} />
              <button type="submit" style={btnStyle('#D67026')}>Crear Producto</button>
            </form>
          </div>

          <div style={cardStyle}>
            <h3 style={{ color: '#D67026' }}>📦 Ingreso de Lote de Producción</h3>
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

          <div style={cardStyle}>
            <h3 style={{ color: '#D67026' }}>📝 Catálogo Activo (Precios)</h3>
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Producto</th>
                    <th style={thStyle}>Precio Actual</th>
                    <th style={thStyle}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td style={{...tdStyle, fontSize: '0.9rem'}}>{p.name} <br/><span style={{color:'#B8B0A3'}}>{p.sku}</span></td>
                      <td style={tdStyle}><strong>${p.salePrice.toLocaleString('es-AR')}</strong></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleEditPrice(p)} style={{ backgroundColor: '#2980b9', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Editar</button>
                          <button onClick={() => handleDeleteProduct(p)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Baja</button>
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
          
          <div style={cardStyle}>
            <h3 style={{ color: '#D67026' }}>📊 Tablero Financiero Detallado</h3>
            {report.length === 0 ? <p style={{ color: '#B8B0A3' }}>No hay ventas confirmadas.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Categoría</th>
                    <th style={thStyle}>Ingresos</th>
                    <th style={thStyle}>Costos</th>
                    <th style={thStyle}>Ganancia</th>
                    <th style={thStyle}>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row, idx) => (
                    <tr key={idx}>
                      <td style={tdStyle}><strong>{row.category}</strong></td>
                      <td style={tdStyle}>${row.totalRevenue.toLocaleString('es-AR')}</td>
                      <td style={{...tdStyle, color: '#e74c3c'}}>-${row.totalCost.toLocaleString('es-AR')}</td>
                      <td style={{...tdStyle, color: '#27ae60', fontWeight: 'bold'}}>${row.netProfit.toLocaleString('es-AR')}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '4px 8px', backgroundColor: row.marginPercentage > 30 ? '#294736' : '#4F2B2B', borderRadius: '2px', color: row.marginPercentage > 30 ? '#2ECC71' : '#E74C3C', fontWeight: 'bold' }}>
                          {row.marginPercentage.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ color: '#D67026' }}>📋 Gestión de Pedidos</h3>
            {orders.length === 0 ? <p style={{ color: '#B8B0A3' }}>No hay pedidos registrados.</p> : (
              <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr>
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
                        <tr key={order.id}>
                          <td style={tdStyle}><strong>{order.orderCode}</strong></td>
                          <td style={tdStyle}>{order.customerContact.split('|')[0]}</td>
                          <td style={tdStyle}>${order.totalSaleAmount.toLocaleString('es-AR')}</td>
                          <td style={tdStyle}>
                            <span style={{ padding: '4px 8px', backgroundColor: statusStyle.bg, color: statusStyle.color, borderRadius: '2px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                              {statusStyle.text}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              <button onClick={() => handleViewDetails(order.orderCode)} style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}>Detalle</button>
                              {order.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleConfirmOrder(order.orderCode)} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}>Cobrado</button>
                                  <button onClick={() => handleCancelOrder(order.orderCode)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                                </>
                              )}
                              {order.status === 'PAID' && (
                                <button onClick={() => handleShipOrder(order.orderCode)} style={{ backgroundColor: '#2980b9', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}>Despachar</button>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(26, 24, 22, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#3A322D', padding: '30px', borderRadius: '4px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #51433A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #51433A', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, color: '#F5EFE6' }}>📦 Remito Interno: {selectedOrderDetails.orderCode}</h2>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ backgroundColor: 'transparent', color: '#B8B0A3', border: 'none', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>
            
            <p style={{ color: '#F5EFE6' }}><strong>Cliente / Contacto:</strong> {selectedOrderDetails.customerContact}</p>
            <p style={{ color: '#F5EFE6' }}><strong>Estado:</strong> {getStatusStyle(selectedOrderDetails.status).text}</p>

            <h3 style={{ marginTop: '20px', color: '#D67026' }}>Artículos a preparar:</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Cant.</th>
                  <th style={thStyle}>Producto (SKU)</th>
                  <th style={thStyle}>P. Unitario</th>
                  <th style={thStyle}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrderDetails.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{...tdStyle, fontWeight: 'bold', color: '#D67026'}}>{item.quantity}x</td>
                    <td style={tdStyle}>{item.productName} <br/><span style={{ fontSize: '0.8rem', color: '#B8B0A3' }}>{item.sku}</span></td>
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
              <button onClick={() => handleDownloadPdf(selectedOrderDetails.orderCode)} style={{ ...btnStyle('#2980b9'), marginTop: 0 }}>🖨️ Descargar Remito PDF</button>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ ...btnStyle('#51433A'), marginTop: 0 }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = { backgroundColor: '#3A322D', padding: '25px', borderRadius: '4px', border: '1px solid #51433A', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', marginTop: '15px', color: '#F5EFE6' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '2px', border: '1px solid #68594D', backgroundColor: '#2B2522', color: '#F5EFE6', boxSizing: 'border-box' as const };
const btnStyle = (color: string) => ({ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: color, color: '#F5EFE6', border: 'none', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' as const });
const thStyle = { padding: '12px', textAlign: 'left' as const, color: '#B8B0A3', borderBottom: '1px solid #51433A' };
const tdStyle = { padding: '12px', textAlign: 'left' as const, color: '#F5EFE6', borderBottom: '1px solid #51433A' };