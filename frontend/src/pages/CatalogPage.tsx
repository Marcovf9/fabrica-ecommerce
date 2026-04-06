import { useEffect, useState } from 'react';
import { catalogService, orderService, leadService } from '../services/api';
import type { Product, CartItem } from '../types';
import Swal from 'sweetalert2';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Trash2, Plus, Minus, PackageOpen } from 'lucide-react';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('fabrica_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [customer, setCustomer] = useState({ firstName: '', lastName: '', email: '', phone: '', street: '', number: '', zip: '', city: '' });
  const [formErrors, setFormErrors] = useState({ firstName: '', lastName: '', email: '', phone: '', street: '', number: '', zip: '', city: '' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await catalogService.getCatalog();
        setProducts(data);
      } catch (err) { setError("Error al cargar el catálogo de productos."); } 
      finally { setLoading(false); }
    };
    fetchCatalog();
  }, []);

  useEffect(() => { localStorage.setItem('fabrica_cart', JSON.stringify(cart)); }, [cart]);

  const addToCart = (product: Product) => {
    if (product.availableStock <= 0) return Swal.fire({ icon: 'error', title: 'Agotado', text: `El producto no tiene stock disponible.` });
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.availableStock) {
          Swal.fire({ icon: 'warning', title: 'Límite de stock', text: `Solo quedan ${product.availableStock} unidades.`, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
          return prevCart;
        }
        Swal.fire({ icon: 'success', title: 'Agregado al carrito', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        return prevCart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      Swal.fire({ icon: 'success', title: 'Agregado al carrito', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const decreaseQuantity = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item );
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const removeFromCart = (productId: number) => setCart(prev => prev.filter(item => item.product.id !== productId));

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
    if (name === 'email' && value.length === 5 && (window as any).fbq) { (window as any).fbq('track', 'InitiateCheckout'); }

    let errorMsg = '';
    if ((name === 'firstName' || name === 'lastName') && value && !/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(value)) errorMsg = 'Solo debe contener letras.';
    else if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errorMsg = 'Formato inválido.';
    else if (name === 'phone' && value && !/^[0-9]+$/.test(value)) errorMsg = 'Solo debe contener números.';
    setFormErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleSilentCapture = async () => {
    if (cart.length === 0 || (!customer.email.trim() && !customer.phone.trim())) return;
    const cartContent = cart.map(item => `${item.quantity}x ${item.product.name}`).join(' | ');
    try { await leadService.captureLead({ email: customer.email, phone: customer.phone, cartContent }); } catch (error) { console.error("Fallo captura silenciosa"); }
  };

  const submitOrder = async () => {
    if (cart.length === 0) return Swal.fire({ icon: 'warning', title: 'Carrito vacío' });
    if (!customer.firstName.trim() || !customer.lastName.trim() || !customer.email.trim() || !customer.phone.trim() || !customer.street.trim() || !customer.number.trim() || !customer.zip.trim() || !customer.city.trim()) {
      return Swal.fire({ icon: 'error', title: 'Datos incompletos', text: 'Todos los campos son obligatorios.' });
    }
    if (Object.values(formErrors).some(err => err !== '')) return Swal.fire({ icon: 'error', title: 'Formato inválido', text: 'Corrige los errores marcados.' });
    
    try {
      const formattedContact = `${customer.lastName}, ${customer.firstName} | ${customer.email} | Tel: ${customer.phone}`;
      const formattedAddress = `${customer.street} ${customer.number}, CP: ${customer.zip}, ${customer.city}`;
      const payload = { customerContact: formattedContact, deliveryAddress: formattedAddress, items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })) };
      
      const response = await orderService.createPendingOrder(payload);
      const cartTotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
      if ((window as any).fbq) { (window as any).fbq('track', 'Purchase', { value: cartTotal, currency: 'ARS' }); }

      const waMessage = `Hola Ritual Espacios, soy ${customer.firstName} ${customer.lastName}. Generé el pedido #${response.orderCode} por $${cartTotal.toLocaleString('es-AR')}. Mi envío es a ${formattedAddress}. Quiero coordinar el pago.`;
      const waUrl = `https://wa.me/5493517150510?text=${encodeURIComponent(waMessage)}`;

      Swal.fire({
        icon: 'success', title: '¡Pedido Registrado!',
        html: `Código: <b class="text-brand-primary">${response.orderCode}</b><br/><br/>Stock reservado. Contáctanos para el pago.`,
        confirmButtonColor: '#D67026', confirmButtonText: 'Coordinar Pago (WhatsApp)'
      }).then((result) => { if (result.isConfirmed) window.open(waUrl, '_blank'); });
      
      setCart([]);
      setCustomer({ firstName: '', lastName: '', email: '', phone: '', street: '', number: '', zip: '', city: '' });
    } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al procesar.' }); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-brand-gray"><div className="animate-spin text-brand-primary"><PackageOpen size={48} /></div></div>;
  if (error) return <div className="h-screen flex items-center justify-center bg-brand-gray text-red-500"><h2>{error}</h2></div>;

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  const allCategories = ['Todas', ...Array.from(new Set(products.map(p => p.categoryName)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (selectedCategory === 'Todas' || p.categoryName === selectedCategory);
  });
  const displayCategories = Array.from(new Set(filteredProducts.map(p => p.categoryName)));

  return (
    <>
      <Helmet><title>Ritual Espacios | Parrillas y Mobiliario de Diseño</title></Helmet>

      <div className="max-w-[1600px] w-[95%] mx-auto py-8 flex flex-col lg:flex-row gap-8">
        
        {/* CATÁLOGO PRINCIPAL */}
        <div className="flex-1">
          <div className="bg-white p-6 rounded-xl border border-brand-border mb-8 shadow-sm">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-3.5 text-brand-muted" size={20} />
              <input 
                type="search" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-brand-gray border border-brand-border rounded-md text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              {allCategories.map(cat => (
                <button 
                  key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all duration-200 border ${selectedCategory === cat ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-muted border-brand-border hover:border-brand-primary hover:text-brand-primary'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-brand-muted flex flex-col items-center">
              <PackageOpen size={48} className="mb-4 opacity-50" />
              <p className="text-lg">No hay inventario que coincida con la búsqueda.</p>
            </div>
          ) : (
            displayCategories.map(category => (
              <div key={category} className="mb-12">
                <h2 className="text-2xl text-brand-dark font-light uppercase tracking-widest border-b border-brand-border pb-3 mb-6">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.filter(p => p.categoryName === category).map((product) => (
                    <div key={product.id} className="bg-white border border-brand-border rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300">
                      <Link to={`/producto/${product.sku}`} className="h-64 bg-brand-gray overflow-hidden relative block">
                        {product.imageUrls && product.imageUrls.length > 0 ? (
                          <img src={optimizeCloudinaryUrl(product.imageUrls[0], 500)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-muted"><PackageOpen size={64} /></div>
                        )}
                      </Link>
                      <div className="p-6 flex flex-col flex-1">
                        <Link to={`/producto/${product.sku}`} className="hover:text-brand-primary transition-colors">
                          <h3 className="text-xl font-bold text-brand-dark mb-1">{product.name}</h3>
                        </Link>
                        <p className="text-brand-muted text-sm mb-4">Stock: {product.availableStock} unid.</p>
                        <div className="mt-auto">
                          <p className="text-2xl font-black text-brand-primary mb-4">${product.salePrice.toLocaleString('es-AR')}</p>
                          <button 
                            onClick={() => addToCart(product)} disabled={product.availableStock <= 0}
                            className={`w-full py-3 px-4 font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 ${product.availableStock > 0 ? 'bg-brand-dark hover:bg-brand-primary text-white' : 'bg-brand-border text-brand-muted cursor-not-allowed'}`}
                          >
                            <ShoppingCart size={18} /> {product.availableStock > 0 ? 'Agregar' : 'Agotado'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* SIDEBAR DEL CARRITO */}
        <div className="w-full lg:w-96 lg:sticky lg:top-32 self-start bg-white p-6 rounded-xl border border-brand-border shadow-lg max-h-[calc(100vh-9rem)] overflow-y-auto">
          <div className="flex items-center gap-3 mb-6 border-b border-brand-border pb-4">
            <ShoppingCart className="text-brand-primary" size={24} />
            <h2 className="text-xl font-bold uppercase tracking-widest text-brand-dark m-0">Tu Pedido</h2>
          </div>
          
          {cart.length === 0 ? (
            <p className="text-brand-muted text-center py-8">Tu carrito está vacío.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center bg-brand-gray p-3 rounded border border-brand-border">
                  <div className="flex-1">
                    <p className="text-brand-dark font-bold text-sm">{item.product.name}</p>
                    <p className="text-brand-primary font-bold text-sm">${(item.product.salePrice * item.quantity).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-brand-border shadow-sm">
                    <button onClick={() => decreaseQuantity(item.product.id)} className="text-brand-muted hover:text-brand-primary p-1"><Minus size={14} /></button>
                    <span className="text-brand-dark font-bold w-4 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => addToCart(item.product)} className="text-brand-muted hover:text-brand-primary p-1"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="ml-3 text-red-500 hover:text-red-600 transition-colors p-1"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          )}
          
          <div className="border-t border-brand-border pt-4 mb-6">
            <h3 className="text-2xl font-black text-brand-dark flex justify-between">
              <span>Total:</span> <span>${cartTotal.toLocaleString('es-AR')}</span>
            </h3>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-brand-primary text-xs uppercase tracking-widest font-bold border-b border-brand-border pb-2">Contacto Administrativo</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase text-brand-muted font-bold mb-1">Nombre</label>
                <input type="text" name="firstName" value={customer.firstName} onChange={handleCustomerChange} className="w-full p-2.5 bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                {formErrors.firstName && <span className="text-red-500 text-xs mt-1 block">{formErrors.firstName}</span>}
              </div>
              <div>
                <label className="block text-xs uppercase text-brand-muted font-bold mb-1">Apellido</label>
                <input type="text" name="lastName" value={customer.lastName} onChange={handleCustomerChange} className="w-full p-2.5 bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                {formErrors.lastName && <span className="text-red-500 text-xs mt-1 block">{formErrors.lastName}</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase text-brand-muted font-bold mb-1">Correo Electrónico</label>
              <input type="email" name="email" value={customer.email} onChange={handleCustomerChange} onBlur={handleSilentCapture} className="w-full p-2.5 bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
              {formErrors.email && <span className="text-red-500 text-xs mt-1 block">{formErrors.email}</span>}
            </div>

            <div>
              <label className="block text-xs uppercase text-brand-muted font-bold mb-1">Teléfono (Sin guiones)</label>
              <input type="tel" name="phone" value={customer.phone} onChange={handleCustomerChange} onBlur={handleSilentCapture} className="w-full p-2.5 bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
              {formErrors.phone && <span className="text-red-500 text-xs mt-1 block">{formErrors.phone}</span>}
            </div>

            <h4 className="text-brand-primary text-xs uppercase tracking-widest font-bold border-b border-brand-border pb-2 pt-4">Destino Logístico</h4>
            
            <div className="flex gap-3">
              <div className="flex-[2]">
                <label className="block text-xs uppercase text-brand-muted font-bold mb-1">Calle</label>
                <input type="text" name="street" value={customer.street} onChange={handleCustomerChange} className="w-full p-2.5 bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-xs uppercase text-brand-muted font-bold mb-1">Núm.</label>
                <input type="text" name="number" value={customer.number} onChange={handleCustomerChange} className="w-full p-2.5 bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs uppercase text-brand-muted font-bold mb-1">C.P.</label>
                <input type="text" name="zip" value={customer.zip} onChange={handleCustomerChange} className="w-full p-2.5 bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs uppercase text-brand-muted font-bold mb-1">Localidad</label>
                <input type="text" name="city" value={customer.city} onChange={handleCustomerChange} className="w-full p-2.5 bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
              </div>
            </div>
            
            <button 
              onClick={submitOrder} 
              className="w-full mt-6 py-4 bg-brand-primary hover:bg-orange-600 text-white font-bold uppercase tracking-widest rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Confirmar y Coordinar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}