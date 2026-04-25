import { useState, useEffect } from 'react';
import { adminService, catalogService, authService } from '../services/api';
import type { Product, ProfitabilityReport, Order, OrderDetail } from '../types';
import Swal from 'sweetalert2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LogOut, Tag, Archive, BarChart3, ShoppingBag, Ghost, FileText, Download, Check, X } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [report, setReport] = useState<ProfitabilityReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetail | null>(null);

  const [newProduct, setNewProduct] = useState({ categoryId: 1, name: '', description: '', salePrice: '', originalPrice: '', sizes: '', isFeatured: false });
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [newBatch, setNewBatch] = useState({ productId: 0, size: '', quantityProduced: '', totalBatchCost: '' });

  const selectedProductForBatch = products.find(p => p.id === newBatch.productId);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);

  useEffect(() => { const token = localStorage.getItem('admin_token'); if (token) { setIsAuthenticated(true); } }, []);

  const loadAbandonedCarts = async () => { try { const data = await adminService.getAbandonedCarts(); setAbandonedCarts(data.reverse()); } catch (error) { } };

  const handleRecoverCart = async (id: number) => {
    try { await adminService.recoverAbandonedCart(id); Swal.fire({ icon: 'success', title: 'Recuperado', timer: 1500, showConfirmButton: false }); loadAbandonedCarts(); } catch (error) { handleApiError(error); }
  };

  const handleDeleteCart = async (id: number) => {
    const result = await Swal.fire({ title: '¿Eliminar registro?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e74c3c' });
    if (result.isConfirmed) { try { await adminService.deleteAbandonedCart(id); Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false }); loadAbandonedCarts(); } catch (error) { handleApiError(error); } }
  };

  useEffect(() => { if (isAuthenticated) { loadProducts(); loadReport(); loadOrders(); loadAbandonedCarts(); } }, [isAuthenticated]);

  const handleApiError = (error: any, defaultMessage: string = 'Ocurrió un error') => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) { handleLogout(); Swal.fire({ icon: 'error', title: 'Sesión expirada' }); } 
    else { Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || defaultMessage }); }
  };

  const loadProducts = async () => { try { const data = await catalogService.getCatalog(); setProducts(data); if (data.length > 0) setNewBatch(prev => ({ ...prev, productId: data[0].id })); } catch (error) { } };
  const loadReport = async () => { try { const data = await adminService.getProfitabilityReport(); setReport(data); } catch (error) { } };
  const loadOrders = async () => { try { const data = await adminService.getOrders(); setOrders(data.reverse()); } catch (error) { } };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const data = await authService.login({ username, password }); localStorage.setItem('admin_token', data.token); setIsAuthenticated(true); } 
    catch (error) { Swal.fire({ icon: 'error', title: 'Acceso Denegado' }); }
  };

  const handleLogout = () => { localStorage.removeItem('admin_token'); setIsAuthenticated(false); setUsername(''); setPassword(''); };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const generatedSku = `PRD-${Date.now().toString().slice(-6)}`;
    const formData = new FormData();
    formData.append('categoryId', newProduct.categoryId.toString()); 
    formData.append('sku', generatedSku); 
    formData.append('name', newProduct.name); 
    formData.append('description', newProduct.description); 
    formData.append('salePrice', newProduct.salePrice.toString());
    formData.append('isFeatured', newProduct.isFeatured.toString());
    
    if (newProduct.originalPrice) {
      formData.append('originalPrice', newProduct.originalPrice.toString());
    }

    if (newProduct.sizes) {
      const sizesArray = newProduct.sizes.split(',').map(s => s.trim()).filter(s => s !== "");
      sizesArray.forEach(size => formData.append('sizes', size));
    }

    if (imageFiles) { for (let i = 0; i < imageFiles.length; i++) { formData.append('images', imageFiles[i]); } }
    try { 
      await adminService.createProduct(formData); 
      Swal.fire({ icon: 'success', title: '¡Agregado!', html: `SKU: <b>${generatedSku}</b>` }); 
      setNewProduct({ categoryId: 1, name: '', description: '', salePrice: '', originalPrice: '', sizes: '' , isFeatured: false}); 
      setImageFiles(null); 
      const fileInput = document.getElementById('file-upload') as HTMLInputElement; 
      if (fileInput) fileInput.value = ''; 
      loadProducts(); 
    } 
    catch (error) { handleApiError(error); }
  };

  const handleRegisterBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await adminService.registerBatch({ productId: newBatch.productId, size: newBatch.size, quantityProduced: Number(newBatch.quantityProduced), totalBatchCost: Number(newBatch.totalBatchCost) }); Swal.fire({ icon: 'success', title: 'Lote Registrado', timer: 2000, showConfirmButton: false }); setNewBatch(prev => ({ ...prev, quantityProduced: '', totalBatchCost: '' })); loadProducts(); loadReport(); } 
    catch (error) { handleApiError(error); }
  };

  const handleConfirmOrder = async (orderCode: string) => {
    const result = await Swal.fire({ title: '¿Confirmar Pago?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#D67026' });
    if (result.isConfirmed) { try { await adminService.confirmOrder(orderCode); Swal.fire({ icon: 'success', title: '¡Cobrado!', timer: 2000, showConfirmButton: false }); loadOrders(); loadProducts(); loadReport(); } catch (error: any) { handleApiError(error); } }
  };

  const handleShipOrder = async (orderCode: string) => {
    const result = await Swal.fire({ title: '¿Despachar?', icon: 'info', showCancelButton: true, confirmButtonColor: '#2980b9' });
    if (result.isConfirmed) { try { await adminService.shipOrder(orderCode); Swal.fire({ icon: 'success', title: '¡Despachado!', timer: 2000, showConfirmButton: false }); loadOrders(); } catch (error: any) { handleApiError(error); } }
  };

  const handleCancelOrder = async (orderCode: string) => {
    const result = await Swal.fire({ title: '¿Cancelar Pedido?', icon: 'error', showCancelButton: true, confirmButtonColor: '#e74c3c' });
    if (result.isConfirmed) { try { await adminService.cancelOrder(orderCode); Swal.fire({ icon: 'success', title: 'Cancelado', timer: 2000, showConfirmButton: false }); loadOrders(); loadProducts(); } catch (error: any) { handleApiError(error); } }
  };

  const handleViewDetails = async (orderCode: string) => {
    try { const details = await adminService.getOrderDetails(orderCode); setSelectedOrderDetails(details); } catch (error) { handleApiError(error); }
  };

  const handleDownloadCsv = async () => {
    try { const blob = await adminService.downloadProfitabilityCsv(); const url = window.URL.createObjectURL(new Blob([blob])); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `rentabilidad_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(link); link.click(); link.parentNode?.removeChild(link); } 
    catch (error) { handleApiError(error); }
  };

  const handleDownloadPdf = async (orderCode: string) => {
    try { const blob = await adminService.downloadOrderPdf(orderCode); const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' })); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `remito_${orderCode}.pdf`); document.body.appendChild(link); link.click(); link.parentNode?.removeChild(link); } 
    catch (error) { handleApiError(error); }
  };

  const handleDeleteOrder = async (orderCode: string) => {
    const result = await Swal.fire({ title: '¿Eliminar de la base?', text: 'Se borrará permanentemente este pedido de prueba.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e74c3c' });
    if (result.isConfirmed) { 
      try { 
        await adminService.deleteOrder(orderCode); 
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false }); 
        loadOrders(); 
      } catch (error: any) { handleApiError(error); } 
    }
  };

  const handleEditProduct = async (product: Product) => {
    let catId = 1;
    switch(product.categoryName) { case 'Parrillas': catId = 1; break; case 'Chulengos': catId = 2; break; case 'Accesorios': catId = 3; break; case 'Fogoneros': catId = 4; break; case 'Muebles de exterior sostenibles': catId = 5; break; }

    const { value: formValues } = await Swal.fire({
      title: 'Editar Producto',
      width: '600px',
      html:
        `<div class="flex flex-col gap-4 text-left p-2">` +
          `<div><label class="text-[10px] font-bold uppercase text-brand-muted mb-1 block">Nombre</label><input id="swal-name" class="swal2-input !m-0 !w-full !text-sm" type="text" value="${product.name}"></div>` +
          `<div><label class="text-[10px] font-bold uppercase text-brand-muted mb-1 block">Descripción</label><textarea id="swal-desc" class="swal2-textarea !m-0 !w-full !text-sm">${product.description}</textarea></div>` +
          `<div class="flex gap-2">` +
            `<div class="flex-1"><label class="text-[10px] font-bold uppercase text-brand-muted mb-1 block">Precio Real</label><input id="swal-salePrice" class="swal2-input !m-0 !w-full !text-sm" type="number" value="${product.salePrice}"></div>` +
            `<div class="flex-1"><label class="text-[10px] font-bold uppercase text-brand-primary mb-1 block">Precio Tachado</label><input id="swal-originalPrice" class="swal2-input !m-0 !w-full !text-sm" type="number" value="${product.originalPrice || ''}"></div>` +
          `</div>` +
          `<div><label class="text-[10px] font-bold uppercase text-brand-muted mb-1 block">Medidas (separadas por coma)</label><input id="swal-sizes" class="swal2-input !m-0 !w-full !text-sm" type="text" value="${product.sizes?.map(s => s.size).join(', ') || ''}"></div>` +
          `<div class="mt-2 p-3 bg-brand-gray border border-brand-border rounded">` +
            `<label class="text-[10px] font-bold uppercase text-brand-muted mb-2 block">Nuevas Imágenes (Opcional)</label>` +
            `<input type="file" id="swal-images" multiple accept="image/*" class="w-full text-xs mb-2">` +
            `<label class="flex items-center gap-2 cursor-pointer mt-3"><input type="checkbox" id="swal-clear-images" class="w-4 h-4 accent-red-500"><span class="text-xs text-red-600 font-bold uppercase">Borrar imágenes anteriores</span></label>` +
          `</div>` +
        `</div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      confirmButtonColor: '#D67026',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const desc = (document.getElementById('swal-desc') as HTMLTextAreaElement).value;
        const salePrice = (document.getElementById('swal-salePrice') as HTMLInputElement).value;
        const originalPrice = (document.getElementById('swal-originalPrice') as HTMLInputElement).value;
        const sizes = (document.getElementById('swal-sizes') as HTMLInputElement).value;
        const imageFiles = (document.getElementById('swal-images') as HTMLInputElement).files;
        const clearImages = (document.getElementById('swal-clear-images') as HTMLInputElement).checked;

        if (!salePrice || !name) { Swal.showValidationMessage('Nombre y Precio son obligatorios'); return false; }
        
        return { name, desc, salePrice, originalPrice, sizes, imageFiles, clearImages, catId };
      }
    });

    if (formValues) {
      try {
        const formData = new FormData();
        formData.append('categoryId', formValues.catId.toString());
        formData.append('sku', product.sku);
        formData.append('name', formValues.name);
        formData.append('description', formValues.desc);
        formData.append('salePrice', formValues.salePrice);
        if (formValues.originalPrice) formData.append('originalPrice', formValues.originalPrice);
        if (formValues.sizes) {
          formValues.sizes.split(',').forEach((s: string) => formData.append('sizes', s.trim()));
        }
        if (formValues.imageFiles) {
          for (let i = 0; i < formValues.imageFiles.length; i++) formData.append('images', formValues.imageFiles[i]);
        }
        formData.append('clearImages', formValues.clearImages.toString());

        await adminService.updateProduct(product.id, formData);
        Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
        loadProducts();
      } catch (error) { handleApiError(error); }
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const result = await Swal.fire({ title: '¿Baja de producto?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e74c3c' });
    if (result.isConfirmed) { try { await adminService.deleteProduct(product.id); Swal.fire({ icon: 'success', title: 'Desactivado', timer: 2000, showConfirmButton: false }); loadProducts(); } catch (error) { handleApiError(error); } }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'PENDIENTE' };
      case 'PAID': return { bg: 'bg-green-100', text: 'text-green-700', label: 'PAGADO' };
      case 'SHIPPED': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'ENVIADO' };
      case 'CANCELLED': return { bg: 'bg-red-100', text: 'text-red-700', label: 'CANCELADO' };
      default: return { bg: 'bg-gray-200', text: 'text-gray-700', label: status };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-brand-gray px-4">
        <form onSubmit={handleLogin} className="bg-white p-6 md:p-8 rounded-xl border border-brand-border shadow-lg w-full max-w-md text-center">
          <h2 className="text-xl md:text-2xl text-brand-dark mb-4 md:mb-6 font-light uppercase tracking-widest">Acceso Administrativo</h2>
          <input required type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 md:p-3 mb-3 md:mb-4 text-sm md:text-base bg-brand-gray border border-brand-border rounded text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" autoFocus/>
          <input required type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 md:p-3 mb-4 md:mb-6 text-sm md:text-base bg-brand-gray border border-brand-border rounded text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"/>
          <button type="submit" className="w-full py-2.5 md:py-3 text-sm md:text-base bg-brand-primary hover:bg-orange-600 text-white font-bold uppercase rounded-lg transition-colors tracking-widest">Ingresar</button>
        </form>
      </div>
    );
  }

  const COLORS = ['#D67026', '#2980b9', '#27ae60', '#8e44ad', '#f1c40f'];

  return (
    <div className="p-3 md:p-8 max-w-[1600px] mx-auto bg-brand-gray min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-3 md:gap-4">
        <h1 className="text-xl md:text-3xl text-brand-dark font-light uppercase tracking-widest flex items-center gap-2 md:gap-3">
          <Archive className="text-brand-primary" size={24} /> Panel de Fábrica
        </h1>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-brand-dark hover:bg-gray-800 text-white rounded font-bold uppercase text-[10px] md:text-sm transition-colors tracking-wider">
          <LogOut size={14} className="md:w-4 md:h-4" /> Cerrar Sesión
        </button>
      </div>
      
      {report.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex-[2] bg-white p-4 md:p-6 rounded-xl border border-brand-border shadow-sm min-h-[350px]">
            <h3 className="text-brand-primary font-bold text-xs md:text-base uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart3 size={16}/> Ingresos vs Costos</h3>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="category" 
                    stroke="#6B7280" 
                    fontSize={10} 
                    tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                  />
                  <YAxis tickFormatter={(val) => `$${(val / 1000)}k`} stroke="#6B7280" fontSize={10} />
                  <RechartsTooltip formatter={(value: any) => `$${Number(value).toLocaleString('es-AR')}`} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#111827', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ color: '#6B7280', fontSize: '10px', marginTop: '10px' }} />
                  <Bar dataKey="totalRevenue" name="Ingresos" fill="#D67026" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalCost" name="Costos" fill="#111827" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex-1 bg-white p-4 md:p-6 rounded-xl border border-brand-border shadow-sm min-h-[350px]">
            <h3 className="text-brand-primary font-bold text-xs md:text-base uppercase tracking-wider mb-4 text-center">Ganancia Neta</h3>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={report} dataKey="netProfit" nameKey="category" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                    {report.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => `$${Number(value).toLocaleString('es-AR')}`} contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#111827', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#6B7280', fontSize: '10px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
        <div className="flex flex-col gap-6 md:gap-8 flex-1 w-full">
          <div className="bg-white p-4 md:p-6 rounded-xl border border-brand-border shadow-sm">
            <h3 className="text-brand-primary font-bold text-sm md:text-base uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2"><Tag size={16}/> Nuevo Producto</h3>
            <form onSubmit={handleCreateProduct}>
              <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Categoría</label>
<select value={newProduct.categoryId} onChange={(e) => setNewProduct({...newProduct, categoryId: Number(e.target.value)})} className="w-full p-2 md:p-3 mb-3 md:mb-4 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark outline-none">
  <option value={1}>Parrillas</option>
  <option value={2}>Chulengos</option>
  <option value={3}>Accesorios</option>
  <option value={4}>Fogoneros</option>
  <option value={5}>Muebles de exterior sostenibles</option>
</select>
              <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Nombre</label>
              <input required type="text" placeholder="Ej: Fogonero XL" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-2 md:p-3 mb-3 md:mb-4 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark outline-none" />
              <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Descripción</label>
              <textarea required placeholder="Especificaciones..." value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-2 md:p-3 mb-3 md:mb-4 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark outline-none min-h-[80px] md:min-h-[100px]" />
              
              <div className="flex gap-4 mb-3 md:mb-4">
                <div className="flex-1">
                  <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Precio de Venta (Real) *</label>
                  <input required type="number" placeholder="Ej: 150000" value={newProduct.salePrice} onChange={(e) => setNewProduct({...newProduct, salePrice: e.target.value})} className="w-full p-2 md:p-3 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2 text-brand-primary">Precio Original (Tachado)</label>
                  <input type="number" placeholder="Opc. Ej: 200000" value={newProduct.originalPrice} onChange={(e) => setNewProduct({...newProduct, originalPrice: e.target.value})} className="w-full p-2 md:p-3 text-xs md:text-sm bg-white border border-brand-primary/30 rounded text-brand-dark outline-none focus:border-brand-primary" />
                </div>
              </div>

              <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Medidas Opcionales (Separa por comas)</label>
              <input type="text" placeholder="Ej: 80cm, 100cm, 120cm" value={newProduct.sizes} onChange={(e) => setNewProduct({...newProduct, sizes: e.target.value})} className="w-full p-2 md:p-3 mb-3 md:mb-4 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark outline-none" />
              <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Fotografías</label>
              <input id="file-upload" type="file" accept="image/*" multiple onChange={(e) => setImageFiles(e.target.files)} className="w-full p-1.5 md:p-2 mb-4 md:mb-6 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark" />
              <div className="mb-6 p-3 border border-brand-primary/30 bg-orange-50 rounded-lg">
  <label className="flex items-center gap-3 cursor-pointer">
    <input type="checkbox" checked={newProduct.isFeatured} onChange={(e) => setNewProduct({...newProduct, isFeatured: e.target.checked})} className="w-5 h-5 text-brand-primary accent-brand-primary cursor-pointer" />
    <span className="text-xs md:text-sm font-bold uppercase text-brand-dark tracking-wider">🌟 Mostrar en sección de Destacados</span>
  </label>
</div>
              <button type="submit" className="w-full py-2 md:py-3 text-xs md:text-sm bg-brand-primary hover:bg-orange-600 text-white font-bold uppercase rounded-lg transition-colors tracking-wider">Crear Producto</button>
            </form>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl border border-brand-border shadow-sm">
            <h3 className="text-brand-primary font-bold text-sm md:text-base uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2"><Archive size={16}/> Ingreso de Lote</h3>
            <form onSubmit={handleRegisterBatch}>
              <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Producto</label>
              <select value={newBatch.productId} onChange={(e) => setNewBatch({...newBatch, productId: Number(e.target.value), size: ''})} className="w-full p-2 md:p-3 mb-3 md:mb-4 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark outline-none">
                <option value={0}>Seleccione un producto</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              {selectedProductForBatch && selectedProductForBatch.sizes && selectedProductForBatch.sizes.length > 0 && (
                <>
                  <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Medida a registrar</label>
                  <select required value={newBatch.size} onChange={(e) => setNewBatch({...newBatch, size: e.target.value})} className="w-full p-2 md:p-3 mb-3 md:mb-4 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark outline-none">
                    <option value="">Seleccione una medida</option>
                    {selectedProductForBatch.sizes.map((s, idx) => (
                    <option key={s.size || `fallback-${idx}`} value={s.size}>{s.size} (Stock actual: {s.stock || 0})</option>
                    ))}
                  </select>
                </>
              )}
              <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Cantidad (Unid.)</label>
              <input required type="number" placeholder="Ej: 50" value={newBatch.quantityProduced} onChange={(e) => setNewBatch({...newBatch, quantityProduced: e.target.value})} className="w-full p-2 md:p-3 mb-3 md:mb-4 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark outline-none" />
              <label className="block text-[10px] md:text-xs uppercase font-bold text-brand-muted mb-1 md:mb-2">Costo Total ($)</label>
              <input required type="number" placeholder="Ej: 500000" value={newBatch.totalBatchCost} onChange={(e) => setNewBatch({...newBatch, totalBatchCost: e.target.value})} className="w-full p-2 md:p-3 mb-4 md:mb-6 text-xs md:text-sm bg-brand-gray border border-brand-border rounded text-brand-dark outline-none" />
              <button type="submit" className="w-full py-2 md:py-3 text-xs md:text-sm bg-green-600 hover:bg-green-700 text-white font-bold uppercase rounded-lg transition-colors tracking-wider">Registrar Stock</button>
            </form>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl border border-brand-border shadow-sm">
            <h3 className="text-brand-primary font-bold text-sm md:text-base uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2"><Tag size={16}/> Catálogo Activo</h3>
            <div className="overflow-x-auto max-h-[300px] md:max-h-[400px]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Producto</th>
                    <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Precio</th>
                    <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const totalStock = p.sizes ? p.sizes.reduce((acc, s) => acc + (s.stock || 0), 0) : 0;
                    return (
                      <tr key={p.id} className="hover:bg-brand-gray transition-colors">
                        <td className="p-2 md:p-3 border-b border-brand-border">
                          <span className="text-brand-dark font-bold block text-xs md:text-base whitespace-normal min-w-[120px]">{p.name}</span>
                          <span className="text-brand-muted text-[10px] md:text-xs">{p.sku} (Total: {totalStock})</span>
                        </td>
                        <td className="p-2 md:p-3 border-b border-brand-border">
                          {p.originalPrice && p.originalPrice > p.salePrice && (
                            <span className="text-[9px] md:text-[10px] text-brand-muted line-through block">
                              ${p.originalPrice.toLocaleString('es-AR')}
                            </span>
                          )}
                          <span className="text-brand-primary font-bold text-xs md:text-base">
                            ${p.salePrice.toLocaleString('es-AR')}
                          </span>
                        </td>
                        <td className="p-2 md:p-3 border-b border-brand-border">
                          <div className="flex gap-1 md:gap-2">
                            <button onClick={() => handleEditProduct(p)} className="px-2 md:px-3 py-1 md:py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white rounded text-[10px] md:text-xs font-bold transition-colors">Editar</button>
                            <button onClick={() => handleDeleteProduct(p)} className="px-2 md:px-3 py-1 md:py-1.5 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white rounded text-[10px] md:text-xs font-bold transition-colors">Baja</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:gap-8 flex-[1.5] w-full">
          <div className="bg-white p-4 md:p-6 rounded-xl border border-brand-border shadow-sm">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h3 className="text-brand-primary font-bold text-sm md:text-base uppercase tracking-wider flex items-center gap-2"><BarChart3 size={16}/> Finanzas</h3>
              {report.length > 0 && (
                <button onClick={handleDownloadCsv} className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors">
                  <Download size={12}/> CSV
                </button>
              )}
            </div>
            {report.length === 0 ? <p className="text-brand-muted text-xs md:text-sm italic">Sin ventas confirmadas.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Categoría</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Ingresos</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Costos</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Ganancia</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((row, idx) => (
                      <tr key={idx} className="hover:bg-brand-gray transition-colors text-xs md:text-sm">
                        <td className="p-2 md:p-3 border-b border-brand-border text-brand-dark font-bold whitespace-normal min-w-[150px]">{row.category}</td>
                        <td className="p-2 md:p-3 border-b border-brand-border text-brand-dark">${row.totalRevenue.toLocaleString('es-AR')}</td>
                        <td className="p-2 md:p-3 border-b border-brand-border text-red-500">-${row.totalCost.toLocaleString('es-AR')}</td>
                        <td className="p-2 md:p-3 border-b border-brand-border text-green-600 font-black">${row.netProfit.toLocaleString('es-AR')}</td>
                        <td className="p-2 md:p-3 border-b border-brand-border">
                          <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold ${row.marginPercentage > 30 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {row.marginPercentage.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl border border-brand-border shadow-sm">
            <h3 className="text-brand-primary font-bold text-sm md:text-base uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2"><ShoppingBag size={16}/> Pedidos</h3>
            {orders.length === 0 ? <p className="text-brand-muted text-xs md:text-sm italic">No hay pedidos registrados.</p> : (
              <div className="overflow-x-auto max-h-[300px] md:max-h-[500px]">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Código</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Cliente</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Total</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Estado</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const status = getStatusConfig(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-brand-gray transition-colors text-xs md:text-sm">
                          <td className="p-2 md:p-3 border-b border-brand-border text-brand-dark font-bold">{order.orderCode}</td>
                          <td className="p-2 md:p-3 border-b border-brand-border text-brand-dark text-[10px] md:text-sm">{order.customerContact.split('|')[0]}</td>
                          <td className="p-2 md:p-3 border-b border-brand-border text-brand-primary font-black">${order.totalSaleAmount.toLocaleString('es-AR')}</td>
                          <td className="p-2 md:p-3 border-b border-brand-border">
                            <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[9px] md:text-xs font-bold tracking-wider ${status.bg} ${status.text}`}>{status.label}</span>
                          </td>
                          <td className="p-2 md:p-3 border-b border-brand-border">
                            <div className="flex gap-1 md:gap-2 flex-wrap">
                              <button onClick={() => handleViewDetails(order.orderCode)} className="px-2 md:px-3 py-1 md:py-1.5 bg-gray-200 text-gray-700 hover:bg-gray-700 hover:text-white rounded text-[9px] md:text-xs font-bold transition-colors">Ver</button>
                              <button onClick={() => handleDeleteOrder(order.orderCode)} className="px-2 md:px-3 py-1 md:py-1.5 bg-gray-200 text-gray-700 hover:bg-red-600 hover:text-white rounded text-[9px] md:text-xs font-bold transition-colors">Borrar</button>
                              {order.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleConfirmOrder(order.orderCode)} className="px-2 md:px-3 py-1 md:py-1.5 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded text-[9px] md:text-xs font-bold transition-colors">Cobro</button>
                                  <button onClick={() => handleCancelOrder(order.orderCode)} className="px-2 md:px-3 py-1 md:py-1.5 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white rounded text-[9px] md:text-xs font-bold transition-colors">Anular</button>
                                </>
                              )}
                              {order.status === 'PAID' && (
                                <button onClick={() => handleShipOrder(order.orderCode)} className="px-2 md:px-3 py-1 md:py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white rounded text-[9px] md:text-xs font-bold transition-colors">Enviar</button>
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

          <div className="bg-white p-4 md:p-6 rounded-xl border border-red-200 shadow-sm">
            <h3 className="text-red-500 font-bold text-sm md:text-base uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2"><Ghost size={16}/> Carritos Abandonados</h3>
            {abandonedCarts.length === 0 ? <p className="text-brand-muted text-xs md:text-sm italic">Sin registros de fuga recientes.</p> : (
              <div className="overflow-x-auto max-h-[300px] md:max-h-[400px]">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Fecha</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Contacto</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Intento</th>
                      <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abandonedCarts.map((cart) => (
                      <tr key={cart.id} className="hover:bg-brand-gray transition-colors text-xs md:text-sm">
                        <td className="p-2 md:p-3 border-b border-brand-border text-brand-muted text-[10px] md:text-xs">{new Date(cart.capturedAt).toLocaleDateString('es-AR')}</td>
                        <td className="p-2 md:p-3 border-b border-brand-border">
                          <span className="block text-brand-dark text-[10px] md:text-sm">{cart.customerEmail}</span>
                          <span className="text-brand-primary font-bold text-[10px] md:text-sm">{cart.customerPhone}</span>
                        </td>
                        <td className="p-2 md:p-3 border-b border-brand-border text-[10px] md:text-xs text-brand-muted whitespace-normal min-w-[200px]">{cart.cartContent}</td>
                        <td className="p-2 md:p-3 border-b border-brand-border">
                          <div className="flex gap-1 md:gap-2">
                            <button onClick={() => handleRecoverCart(cart.id)} className="p-1 md:p-1.5 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded transition-colors" title="Recuperado"><Check size={14}/></button>
                            <button onClick={() => handleDeleteCart(cart.id)} className="p-1 md:p-1.5 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors" title="Eliminar"><X size={14}/></button>
                          </div>
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

      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-brand-dark/80 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white p-5 md:p-8 rounded-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border border-brand-border shadow-2xl">
            <div className="flex justify-between items-center border-b-2 border-brand-border pb-3 md:pb-4 mb-4 md:mb-6">
              <h2 className="text-base md:text-2xl text-brand-dark font-light uppercase tracking-widest flex items-center gap-2 md:gap-3"><FileText className="text-brand-primary" size={20}/> Remito: {selectedOrderDetails.orderCode}</h2>
              <button onClick={() => setSelectedOrderDetails(null)} className="text-brand-muted hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="space-y-1.5 md:space-y-2 mb-6 md:mb-8 bg-brand-gray p-4 md:p-6 rounded-lg border border-brand-border">
              <p className="text-brand-dark text-xs md:text-base"><strong className="text-brand-muted uppercase text-[10px] md:text-xs mr-1 md:mr-2">Cliente:</strong> {selectedOrderDetails.customerContact}</p>
              <p className="text-brand-dark text-xs md:text-base"><strong className="text-brand-muted uppercase text-[10px] md:text-xs mr-1 md:mr-2">Dirección:</strong> {selectedOrderDetails.deliveryAddress}</p>
              <p className="text-brand-dark text-xs md:text-base"><strong className="text-brand-muted uppercase text-[10px] md:text-xs mr-1 md:mr-2">Estado:</strong> <span className={`${getStatusConfig(selectedOrderDetails.status).text} bg-transparent p-0 font-black`}>{getStatusConfig(selectedOrderDetails.status).label}</span></p>
            </div>
            
            <h3 className="text-brand-primary font-bold text-sm md:text-base uppercase tracking-wider mb-3 md:mb-4">Artículos</h3>
            <table className="w-full text-left border-collapse mb-5 md:mb-6 whitespace-nowrap">
              <thead>
                <tr>
                  <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Cant.</th>
                  <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider">Producto</th>
                  <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider hidden sm:table-cell">P. Unit.</th>
                  <th className="p-2 md:p-3 border-b-2 border-brand-border text-brand-muted text-[10px] md:text-xs uppercase tracking-wider text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrderDetails.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-brand-border">
                    <td className="p-2 md:p-3 text-brand-primary text-xs md:text-base font-black">{item.quantity}x</td>
                    <td className="p-2 md:p-3 text-brand-dark text-[10px] md:text-sm font-bold whitespace-normal min-w-[150px]">{item.productName} <span className="text-brand-primary">[{item.size}]</span><br/><span className="text-[9px] md:text-xs text-brand-muted font-normal">{item.sku}</span></td>
                    <td className="p-2 md:p-3 text-brand-dark text-xs md:text-sm hidden sm:table-cell">${item.unitPrice.toLocaleString('es-AR')}</td>
                    <td className="p-2 md:p-3 text-brand-dark text-xs md:text-base font-black text-right">${item.subTotal.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <h2 className="text-right text-xl md:text-3xl text-brand-dark font-light mb-6 md:mb-8 pt-3 md:pt-4">
              Total: <span className="font-black text-brand-primary">${selectedOrderDetails.totalSaleAmount.toLocaleString('es-AR')}</span>
            </h2>
            
            <div className="flex gap-2 md:gap-4">
              <button onClick={() => handleDownloadPdf(selectedOrderDetails.orderCode)} className="flex-1 py-3 md:py-4 bg-brand-dark hover:bg-brand-primary text-white font-bold text-xs md:text-base uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 md:gap-2 transition-colors"><Download size={16} className="md:w-5 md:h-5"/> PDF</button>
              <button onClick={() => setSelectedOrderDetails(null)} className="flex-1 py-3 md:py-4 bg-brand-gray border border-brand-border hover:bg-gray-200 text-brand-dark font-bold text-xs md:text-base uppercase tracking-widest rounded-lg transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}