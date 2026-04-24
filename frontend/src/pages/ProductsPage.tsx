import { useEffect, useState } from 'react';
import { catalogService, orderService, leadService, shippingService } from '../services/api';
import type { Product, CartItem } from '../types';
import Swal from 'sweetalert2';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Trash2, Plus, Minus, PackageOpen, Eye, LayoutGrid } from 'lucide-react';

export default function ProductsPage() {
  const location = useLocation();
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
  const [selectedCategory, setSelectedCategory] = useState(location.state?.category || 'Todas');
  const [shippingCost, setShippingCost] = useState(0);

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

  useEffect(() => {
    const calculateShipping = async () => {
      if (customer.zip.trim().length >= 4 && cart.length > 0) {
        try {
          const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
          const cost = await shippingService.calculate(customer.zip, totalItems);
          setShippingCost(cost);
        } catch (err) { setShippingCost(0); }
      } else {
        setShippingCost(0);
      }
    };
    const timeoutId = setTimeout(calculateShipping, 500);
    return () => clearTimeout(timeoutId);
  }, [customer.zip, cart]);

  const addQuantity = (productId: number, size: string) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.product.id === productId && item.size === size);
      if (existing) {
        const sizeData = existing.product.sizes?.find(s => s.size === size);
        const maxStock = sizeData ? sizeData.stock : 0;
        
        if (existing.quantity >= maxStock) {
          Swal.fire({ icon: 'warning', title: 'Límite de stock', text: `Solo quedan ${maxStock} unidades de esta variante.`, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
          return prevCart;
        }
        return prevCart.map(item => (item.product.id === productId && item.size === size) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return prevCart;
    });
  };

  const decreaseQuantity = (productId: number, size: string) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === productId && item.size === size);
      if (existing && existing.quantity > 1) {
        return prev.map(item => (item.product.id === productId && item.size === size) ? { ...item, quantity: item.quantity - 1 } : item );
      }
      return prev.filter(item => !(item.product.id === productId && item.size === size));
    });
  };

  const removeFromCart = (productId: number, size: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.size === size)));
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });

    let errorMsg = '';
    if ((name === 'firstName' || name === 'lastName' || name === 'city') && value && !/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(value)) {
      errorMsg = 'Solo debe contener letras.';
    } 
    else if ((name === 'phone' || name === 'number' || name === 'zip') && value && !/^[0-9]+$/.test(value)) {
      errorMsg = 'Solo debe contener números.';
    }

    if (name !== 'email') {
      setFormErrors(prev => ({ ...prev, [name]: errorMsg }));
    } else {
      setFormErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFormErrors(prev => ({ ...prev, email: 'Formato de correo inválido.' }));
    }
    if (name === 'email' || name === 'phone') {
      handleSilentCapture();
    }
  };

  const handleSilentCapture = async () => {
    if (cart.length === 0 || (!customer.email.trim() && !customer.phone.trim())) return;
    const cartContent = cart.map(item => `${item.quantity}x ${item.product.name} (${item.size})`).join(' | ');
    try { await leadService.captureLead({ email: customer.email, phone: customer.phone, cartContent }); } catch (error) { console.error("Fallo captura silenciosa"); }
  };

  const submitOrder = async () => {
    if (cart.length === 0) return Swal.fire({ icon: 'warning', title: 'Carrito vacío' });
    if (!customer.firstName.trim() || !customer.lastName.trim() || !customer.email.trim() || !customer.phone.trim() || !customer.street.trim() || !customer.number.trim() || !customer.zip.trim() || !customer.city.trim()) {
      return Swal.fire({ icon: 'error', title: 'Datos incompletos', text: 'Todos los campos son obligatorios.' });
    }
    if (Object.values(formErrors).some(err => err !== '')) return Swal.fire({ icon: 'error', title: 'Formato inválido', text: 'Corrige los errores marcados en rojo.' });
    
    try {
      const formattedContact = `${customer.lastName}, ${customer.firstName} | ${customer.email} | Tel: ${customer.phone}`;
      const formattedAddress = `${customer.street} ${customer.number}, CP: ${customer.zip}, ${customer.city}`;
      const payload = { 
        customerContact: formattedContact, 
        deliveryAddress: formattedAddress, 
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, size: item.size })) 
      };
      
      const response = await orderService.createPendingOrder(payload);
      const cartTotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
      if ((window as any).fbq) { (window as any).fbq('track', 'Purchase', { value: cartTotal, currency: 'ARS' }); }

      const itemsList = cart.map(i => `${i.quantity}x ${i.product.name} [${i.size}]`).join('\n');
      const waMessage = `Hola Ritual Espacios, soy ${customer.firstName} ${customer.lastName}. Generé el pedido #${response.orderCode}.\n\nArtículos:\n${itemsList}\n\nSubtotal: $${cartSubtotal.toLocaleString('es-AR')}.\nEnvío cotizado a CP ${customer.zip}: $${shippingCost.toLocaleString('es-AR')}.\nTotal a transferir: $${finalTotal.toLocaleString('es-AR')}.\nMi envío es a ${formattedAddress}. Quiero coordinar el pago.`;
      
      const waUrl = `https://wa.me/5493516071362?text=${encodeURIComponent(waMessage)}`;

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

  const categoryFilters = [
    { name: 'Todas', icon: <LayoutGrid size={28} className="text-white" /> }, 
    { name: 'Parrillas', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776966658/Parrilla_2_efiv1z.jpg' },
    { name: 'Chulengos', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776968980/Chulengo_1_upvasu.jpg' },
    { name: 'Accesorios', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776966616/Palita_y_Atizador_1_di9p5e.jpg' },
    { name: 'Fogoneros', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776969396/Fogonero_1_b2rjp7.jpg' },
    { name: 'Muebles de exterior sostenibles', image: 'https://res.cloudinary.com/dq5bau3ky/image/upload/v1776970228/Muebles_de_exterior_1_p45uhn.png' }
  ];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (selectedCategory === 'Todas' || p.categoryName === selectedCategory);
  });
  
  const displayCategories = Array.from(new Set(filteredProducts.map(p => p.categoryName)));
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  const finalTotal = cartSubtotal + shippingCost;

  return (
    <>
      <Helmet><title>Productos | Ritual Espacios</title></Helmet>

      {/* FILA DE CATEGORÍAS FIJA */}
      <div id="catalogo" className="bg-white border-b border-brand-border sticky top-[72px] md:top-[88px] z-40 shadow-sm">
        <div className="max-w-[1600px] w-[95%] mx-auto py-4 md:py-6 flex gap-3 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth items-start justify-start lg:justify-center">
          {categoryFilters.map(cat => (
            <button 
              key={cat.name} 
              onClick={() => setSelectedCategory(cat.name)}
              className="flex flex-col items-center gap-2 group flex-shrink-0 w-[76px] md:w-[100px]"
            >
              <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full p-1 transition-all duration-300 border-2 ${selectedCategory === cat.name ? 'border-brand-primary' : 'border-transparent group-hover:border-gray-200'}`}>
                <div className="w-full h-full rounded-full overflow-hidden shadow-inner bg-brand-dark flex items-center justify-center">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className={`w-full h-full object-cover transition-transform duration-700 ${selectedCategory === cat.name ? 'scale-110' : 'group-hover:scale-110'}`} />
                  ) : (
                    <div className={`transition-transform duration-700 ${selectedCategory === cat.name ? 'scale-110' : 'group-hover:scale-110'}`}>{cat.icon}</div>
                  )}
                </div>
              </div>
              <span className={`text-[9px] md:text-xs font-bold uppercase tracking-wider text-center leading-tight line-clamp-2 px-1 ${selectedCategory === cat.name ? 'text-brand-primary' : 'text-brand-muted group-hover:text-brand-dark'}`}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: CATÁLOGO Y CARRITO */}
      <div className="max-w-[1600px] w-[95%] mx-auto py-8 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-screen">
        
        {/* LADO IZQUIERDO: PRODUCTOS */}
        <div className="flex-1">
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-4 top-3.5 text-brand-muted" size={18} />
            <input 
              type="search" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-brand-border rounded-md text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm shadow-sm"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-brand-muted flex flex-col items-center bg-white rounded-xl border border-brand-border">
              <PackageOpen size={48} className="mb-4 opacity-50" />
              <p className="text-lg">No hay productos en esta categoría.</p>
              <button onClick={() => setSelectedCategory('Todas')} className="mt-4 text-brand-primary font-bold underline">Ver todo el catálogo</button>
            </div>
          ) : (
            displayCategories.map(category => (
              <div key={category} className="mb-12">
                <h2 className="text-lg md:text-2xl text-brand-dark font-light uppercase tracking-[0.15em] border-b border-brand-border pb-3 mb-6">{category}</h2>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.filter(p => p.categoryName === category).map((product) => {
                    const totalStock = product.sizes ? product.sizes.reduce((acc, s) => acc + (s.stock || 0), 0) : 0;
                    return (
                      <div key={product.id} className="bg-white border border-brand-border rounded-lg md:rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
                        <Link to={`/producto/${product.sku}`} className="h-40 md:h-64 bg-brand-gray overflow-hidden relative block">
                          {product.imageUrls && product.imageUrls.length > 0 ? (
                            <img src={optimizeCloudinaryUrl(product.imageUrls[0], 500)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-muted"><PackageOpen size={32} className="md:w-16 md:h-16" /></div>
                          )}
                        </Link>
                        <div className="p-4 md:p-6 flex flex-col flex-1">
                          <Link to={`/producto/${product.sku}`} className="hover:text-brand-primary transition-colors">
                            <h3 className="text-sm md:text-lg font-bold text-brand-dark mb-1 line-clamp-2">{product.name}</h3>
                          </Link>
                          <div className="mt-auto pt-4 relative">
                            {product.originalPrice && product.originalPrice > product.salePrice && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs md:text-sm text-brand-muted line-through font-medium">${product.originalPrice.toLocaleString('es-AR')}</span>
                                <span className="text-[10px] md:text-xs font-black text-red-500 bg-red-100 px-2 py-0.5 rounded uppercase tracking-wider">{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}% OFF</span>
                              </div>
                            )}
                            <p className={`text-base md:text-2xl font-black mb-4 ${product.originalPrice && product.originalPrice > product.salePrice ? 'text-red-600' : 'text-brand-primary'}`}>
                              ${product.salePrice.toLocaleString('es-AR')}
                            </p>
                            <Link 
                              to={`/producto/${product.sku}`}
                              className={`w-full py-2 md:py-3 px-4 text-xs md:text-sm font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 ${totalStock > 0 ? 'bg-brand-dark hover:bg-brand-primary text-white shadow-md' : 'bg-brand-gray text-brand-muted cursor-not-allowed pointer-events-none'}`}
                            >
                              <Eye size={16} /> {totalStock > 0 ? 'Ver Detalles' : 'Agotado'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* LADO DERECHO: SIDEBAR DEL CARRITO */}
        <div className="w-full lg:w-[400px] lg:sticky lg:top-36 self-start bg-white p-5 md:p-6 rounded-xl border border-brand-border shadow-xl lg:max-h-[calc(100vh-10rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-6 border-b border-brand-border pb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="text-brand-primary" size={24} />
              <h2 className="text-lg font-bold uppercase tracking-widest text-brand-dark m-0">Tu Pedido</h2>
            </div>
            <span className="bg-brand-gray text-brand-dark text-xs font-bold px-2 py-1 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} ítems</span>
          </div>
          
          {cart.length === 0 ? (
            <p className="text-brand-muted text-sm text-center py-8">Aún no agregaste productos.</p>
          ) : (
            <div className="space-y-3 mb-6">
              {cart.map((item, idx) => (
                <div key={`${item.product.id}-${idx}`} className="flex justify-between items-center bg-brand-gray p-3 rounded-lg border border-brand-border">
                  <div className="flex-1 pr-2">
                    <p className="text-brand-dark font-bold text-xs md:text-sm leading-tight mb-1">{item.product.name}</p>
                    <p className="text-brand-primary font-black text-[10px] md:text-xs uppercase mb-1">Medida: {item.size}</p>
                    <p className="text-brand-muted font-bold text-xs">${(item.product.salePrice * item.quantity).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-md px-2 py-1 border border-brand-border shadow-sm">
                    <button onClick={() => decreaseQuantity(item.product.id, item.size)} className="text-brand-muted hover:text-brand-primary p-1"><Minus size={12} /></button>
                    <span className="text-brand-dark font-bold w-4 text-center text-xs">{item.quantity}</span>
                    <button onClick={() => addQuantity(item.product.id, item.size)} className="text-brand-muted hover:text-brand-primary p-1"><Plus size={12} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id, item.size)} className="ml-3 text-red-500 hover:text-red-600 transition-colors p-2 bg-white rounded-md border border-red-100 shadow-sm"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
          
          <div className="border-t border-brand-border pt-4 mb-6 bg-brand-gray/50 rounded-lg p-4">
            <div className="flex justify-between text-brand-dark mb-2 text-sm font-bold">
              <span>Subtotal:</span> <span>${cartSubtotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-brand-muted mb-4 text-sm">
              <span>Envío (Est.):</span> <span>{shippingCost > 0 ? `$${shippingCost.toLocaleString('es-AR')}` : 'Ingresa C.P.'}</span>
            </div>
            <h3 className="text-xl font-black text-brand-dark flex justify-between border-t border-brand-border pt-4">
              <span>Total:</span> <span className="text-brand-primary">${finalTotal.toLocaleString('es-AR')}</span>
            </h3>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-brand-primary text-xs uppercase tracking-widest font-bold border-b border-brand-border pb-2">Datos de Contacto</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-brand-muted font-bold mb-1">Nombre</label>
                <input type="text" name="firstName" value={customer.firstName} onChange={handleCustomerChange} className="w-full p-2.5 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                {formErrors.firstName && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.firstName}</span>}
              </div>
              <div>
                <label className="block text-[10px] uppercase text-brand-muted font-bold mb-1">Apellido</label>
                <input type="text" name="lastName" value={customer.lastName} onChange={handleCustomerChange} className="w-full p-2.5 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                {formErrors.lastName && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.lastName}</span>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-brand-muted font-bold mb-1">Correo Electrónico</label>
              <input type="email" name="email" value={customer.email} onChange={handleCustomerChange} onBlur={handleInputBlur} className="w-full p-2.5 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
              {formErrors.email && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.email}</span>}
            </div>

            <div>
              <label className="block text-[10px] uppercase text-brand-muted font-bold mb-1">Teléfono (Sin guiones)</label>
              <input type="tel" name="phone" value={customer.phone} onChange={handleCustomerChange} onBlur={handleInputBlur} className="w-full p-2.5 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
              {formErrors.phone && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.phone}</span>}
            </div>

            <h4 className="text-brand-primary text-xs uppercase tracking-widest font-bold border-b border-brand-border pb-2 pt-4">Destino Logístico</h4>
            
            <div className="flex gap-3">
              <div className="flex-[2]">
                <label className="block text-[10px] uppercase text-brand-muted font-bold mb-1">Calle</label>
                <input type="text" name="street" value={customer.street} onChange={handleCustomerChange} className="w-full p-2.5 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase text-brand-muted font-bold mb-1">Núm.</label>
                <input type="text" name="number" value={customer.number} onChange={handleCustomerChange} className="w-full p-2.5 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                {formErrors.number && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.number}</span>}
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] uppercase text-brand-muted font-bold mb-1">C.P.</label>
                <input type="text" name="zip" value={customer.zip} onChange={handleCustomerChange} className="w-full p-2.5 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                {formErrors.zip && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.zip}</span>}
              </div>
              <div className="flex-[2]">
                <label className="block text-[10px] uppercase text-brand-muted font-bold mb-1">Localidad</label>
                <input type="text" name="city" value={customer.city} onChange={handleCustomerChange} className="w-full p-2.5 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
                {formErrors.city && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.city}</span>}
              </div>
            </div>
            
            <button 
              onClick={submitOrder} 
              className="w-full mt-6 py-4 bg-brand-dark hover:bg-brand-primary text-white font-bold uppercase tracking-[0.2em] rounded-md transition-all duration-300 shadow-xl hover:shadow-brand-primary/50 text-sm"
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      </div>
    </>
  );
}