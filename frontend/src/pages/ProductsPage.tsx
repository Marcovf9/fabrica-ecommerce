import { useEffect, useState } from 'react';
import { catalogService, orderService, leadService } from '../services/api';
import type { Product, CartItem } from '../types';
import Swal from 'sweetalert2';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Trash2, Plus, Minus, PackageOpen, Eye, LayoutGrid, CreditCard, Building2, Truck } from 'lucide-react';

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
  
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'MERCADO_PAGO'>('TRANSFER');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await catalogService.getCatalog();
        setProducts(data);
      } catch (err) { setError("Error al cargar el catálogo."); } 
      finally { setLoading(false); }
    };
    fetchCatalog();
  }, []);

  useEffect(() => { localStorage.setItem('fabrica_cart', JSON.stringify(cart)); }, [cart]);

  const addQuantity = (productId: number, size: string) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === productId && item.size === size);
      if (existing) {
        const sizeData = existing.product.sizes?.find(s => s.size === size);
        const maxStock = sizeData ? sizeData.stock : 0;
        if (existing.quantity >= maxStock) {
          Swal.fire({ icon: 'warning', title: 'Límite de stock', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
          return prev;
        }
        return prev.map(item => (item.product.id === productId && item.size === size) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return prev;
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

  // VALIDACIONES RESTAURADAS
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
    
    setIsProcessing(true);
    try {
      const formattedContact = `${customer.lastName}, ${customer.firstName} | ${customer.email} | Tel: ${customer.phone}`;
      const formattedAddress = `${customer.street} ${customer.number}, CP: ${customer.zip}, ${customer.city}`;
      const payload = { 
        customerContact: formattedContact, 
        deliveryAddress: formattedAddress, 
        paymentMethod: paymentMethod,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, size: item.size })) 
      };
      
      const response = await orderService.createPendingOrder(payload);
      
      setCart([]);
      localStorage.removeItem('fabrica_cart');

      if (paymentMethod === 'TRANSFER') {
        const itemsList = cart.map(i => `${i.quantity}x ${i.product.name} [${i.size}]`).join('\n');
        const waMessage = `Hola Ritual Espacios, soy ${customer.firstName} ${customer.lastName}. Generé el pedido #${response.order.orderCode} mediante Transferencia.\n\nArtículos:\n${itemsList}\n\nTotal a transferir (Con 15% OFF): $${finalTotal.toLocaleString('es-AR')}.\nMi envío (Gratis) es a ${formattedAddress}. Solicito los datos bancarios.`;
        const waUrl = `https://wa.me/5493516071362?text=${encodeURIComponent(waMessage)}`;

        Swal.fire({
          icon: 'success', title: '¡Pedido Registrado!',
          html: `Código: <b class="text-brand-primary">${response.order.orderCode}</b><br/><br/>Serás redirigido a WhatsApp para coordinar el pago con descuento.`,
          confirmButtonColor: '#D67026', confirmButtonText: 'Ir a WhatsApp'
        }).then(() => { window.location.href = waUrl; });
      } else {
        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
        } else {
          Swal.fire({ icon: 'error', title: 'Error de pasarela', text: 'No se pudo generar el link de pago.' });
        }
      }
    } catch (err) { 
      Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al procesar el pedido.' }); 
    } finally {
      setIsProcessing(false);
    }
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
  const discountAmount = paymentMethod === 'TRANSFER' ? cartSubtotal * 0.15 : 0;
  const finalTotal = cartSubtotal - discountAmount;

  return (
    <>
      <Helmet><title>Productos | Ritual Espacios</title></Helmet>

      <div id="catalogo" className="bg-white border-b border-brand-border sticky top-[72px] md:top-[88px] z-40 shadow-sm">
        <div className="max-w-[1600px] w-[95%] mx-auto py-4 md:py-6 flex gap-3 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth items-start justify-start lg:justify-center">
          {categoryFilters.map(cat => (
            <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className="flex flex-col items-center gap-2 group flex-shrink-0 w-[76px] md:w-[100px]">
              <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full p-1 transition-all duration-300 border-2 ${selectedCategory === cat.name ? 'border-brand-primary' : 'border-transparent group-hover:border-gray-200'}`}>
                <div className="w-full h-full rounded-full overflow-hidden shadow-inner bg-brand-dark flex items-center justify-center">
                  {cat.image ? <img src={cat.image} alt={cat.name} className={`w-full h-full object-cover transition-transform duration-700 ${selectedCategory === cat.name ? 'scale-110' : 'group-hover:scale-110'}`} /> : <div className={`transition-transform duration-700 ${selectedCategory === cat.name ? 'scale-110' : 'group-hover:scale-110'}`}>{cat.icon}</div>}
                </div>
              </div>
              <span className={`text-[9px] md:text-xs font-bold uppercase tracking-wider text-center leading-tight line-clamp-2 px-1 ${selectedCategory === cat.name ? 'text-brand-primary' : 'text-brand-muted group-hover:text-brand-dark'}`}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] w-[95%] mx-auto py-8 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-screen">
        
        {/* LADO IZQUIERDO: PRODUCTOS */}
        <div className="flex-1">
          
          <div className="bg-brand-dark rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between border-l-4 border-brand-primary shadow-lg">
            <div className="text-left mb-4 md:mb-0">
              <h3 className="text-base md:text-lg font-bold uppercase tracking-widest text-brand-primary mb-1">¿Equipás un emprendimiento gastronómico o complejo?</h3>
              <p className="text-xs md:text-sm text-brand-muted">Consultá precios directos de fábrica por volumen (exclusivo con CUIT).</p>
            </div>
            <a 
              href="https://wa.me/5493516071362?text=Hola,%20busco%20equipar%20mi%20emprendimiento.%20Mi%20CUIT%20es:%20_____.%20Me%20interesa%20comprar%20por%20volumen%20los%20siguientes%20productos:" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-brand-primary hover:bg-orange-600 text-white px-6 py-3 rounded-md font-bold uppercase tracking-widest text-xs transition-all shadow-md whitespace-nowrap"
            >
              Consultar Mayorista
            </a>
          </div>

          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-4 top-3.5 text-brand-muted" size={18} />
            <input type="search" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-brand-border rounded-md text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm shadow-sm" />
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
                    const transferPrice = product.salePrice * 0.85; 
                    
                    return (
                      <div key={product.id} className="bg-white border border-brand-border rounded-lg md:rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 relative">
                        
                        <div className="absolute top-3 right-3 bg-brand-dark text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-md z-10 flex items-center gap-1">
                          <Truck size={12}/> Envío Gratis
                        </div>

                        <Link to={`/producto/${product.sku}`} className="h-40 md:h-64 bg-brand-gray overflow-hidden relative block">
                          {product.imageUrls && product.imageUrls.length > 0 ? <img src={optimizeCloudinaryUrl(product.imageUrls[0], 500)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-brand-muted"><PackageOpen size={32} className="md:w-16 md:h-16" /></div>}
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
                            
                            <div className="mb-4">
                              <p className={`text-base md:text-xl font-black leading-tight ${product.originalPrice && product.originalPrice > product.salePrice ? 'text-red-600' : 'text-brand-dark'}`}>
                                ${product.salePrice.toLocaleString('es-AR')} <span className="text-[9px] md:text-[10px] font-bold text-brand-muted uppercase tracking-wider block md:inline md:ml-1">/ 3 Cuotas s/interés</span>
                              </p>
                              <p className="text-sm md:text-lg font-black text-brand-primary mt-1 flex items-center gap-1 md:gap-2">
                                ${transferPrice.toLocaleString('es-AR')} <span className="text-[9px] font-bold bg-orange-100 text-brand-primary px-1.5 py-0.5 rounded uppercase tracking-wider">Transferencia (-15%)</span>
                              </p>
                            </div>

                            <Link to={`/producto/${product.sku}`} className={`w-full py-2 md:py-3 px-4 text-xs md:text-sm font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 ${totalStock > 0 ? 'bg-brand-dark hover:bg-brand-primary text-white shadow-md' : 'bg-brand-gray text-brand-muted cursor-not-allowed pointer-events-none'}`}>
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

          <div className="space-y-4">
            <h4 className="text-brand-primary text-xs uppercase tracking-widest font-bold border-b border-brand-border pb-2 pt-4">Datos de Destino (Logística)</h4>
            
            {/* INPUTS CON VALIDACIONES VISUALES RESTAURADAS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input type="text" name="firstName" placeholder="Nombre" value={customer.firstName} onChange={handleCustomerChange} className="w-full p-2 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                {formErrors.firstName && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.firstName}</span>}
              </div>
              <div>
                <input type="text" name="lastName" placeholder="Apellido" value={customer.lastName} onChange={handleCustomerChange} className="w-full p-2 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                {formErrors.lastName && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.lastName}</span>}
              </div>
            </div>
            
            <div>
              <input type="email" name="email" placeholder="Email" value={customer.email} onChange={handleCustomerChange} onBlur={handleInputBlur} className="w-full p-2 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
              {formErrors.email && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.email}</span>}
            </div>
            
            <div>
              <input type="tel" name="phone" placeholder="Teléfono" value={customer.phone} onChange={handleCustomerChange} onBlur={handleInputBlur} className="w-full p-2 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
              {formErrors.phone && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.phone}</span>}
            </div>
            
            <div className="flex gap-3">
              <div className="flex-[2]">
                <input type="text" name="street" placeholder="Calle" value={customer.street} onChange={handleCustomerChange} className="w-full p-2 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
              </div>
              <div className="flex-1">
                <input type="text" name="number" placeholder="Nro" value={customer.number} onChange={handleCustomerChange} className="w-full p-2 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                {formErrors.number && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.number}</span>}
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <input type="text" name="zip" placeholder="C.P." value={customer.zip} onChange={handleCustomerChange} className="w-full p-2 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                {formErrors.zip && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.zip}</span>}
              </div>
              <div className="flex-[2]">
                <input type="text" name="city" placeholder="Localidad" value={customer.city} onChange={handleCustomerChange} className="w-full p-2 text-sm bg-brand-gray border border-brand-border rounded focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" />
                {formErrors.city && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.city}</span>}
              </div>
            </div>

            <h4 className="text-brand-primary text-xs uppercase tracking-widest font-bold border-b border-brand-border pb-2 pt-6">Método de Pago</h4>
            <div className="flex flex-col gap-3 mb-4">
              <label className={`border p-3 md:p-4 rounded-lg cursor-pointer flex items-center gap-3 transition-all ${paymentMethod === 'TRANSFER' ? 'border-brand-primary bg-orange-50 shadow-md transform scale-[1.02]' : 'border-brand-border bg-white hover:bg-brand-gray'}`}>
                <input type="radio" name="payment" value="TRANSFER" checked={paymentMethod === 'TRANSFER'} onChange={() => setPaymentMethod('TRANSFER')} className="accent-brand-primary w-4 h-4" />
                <div className="flex-1">
                  <p className="font-bold text-brand-dark text-sm flex items-center gap-2"><Building2 size={16}/> Transferencia</p>
                  <p className="text-xs text-brand-primary font-black mt-1">🔥 15% DE DESCUENTO</p>
                </div>
              </label>
              
              <label className={`border p-3 md:p-4 rounded-lg cursor-pointer flex items-center gap-3 transition-all ${paymentMethod === 'MERCADO_PAGO' ? 'border-[#009EE3] bg-[#009EE3]/10 shadow-md transform scale-[1.02]' : 'border-brand-border bg-white hover:bg-brand-gray'}`}>
                <input type="radio" name="payment" value="MERCADO_PAGO" checked={paymentMethod === 'MERCADO_PAGO'} onChange={() => setPaymentMethod('MERCADO_PAGO')} className="accent-[#009EE3] w-4 h-4" />
                <div className="flex-1">
                  <p className="font-bold text-brand-dark text-sm flex items-center gap-2"><CreditCard size={16}/> Tarjetas / Mercado Pago</p>
                  <p className="text-[10px] md:text-xs text-brand-muted mt-1 leading-tight">Hasta 3 Cuotas Sin Interés.</p>
                </div>
              </label>
            </div>

            <div className="border-t border-brand-border pt-4 mb-6 bg-brand-gray/50 rounded-lg p-4">
              <div className="flex justify-between text-brand-dark mb-2 text-sm">
                <span>Subtotal lista:</span> <span>${cartSubtotal.toLocaleString('es-AR')}</span>
              </div>
              
              {paymentMethod === 'TRANSFER' && (
                <div className="flex justify-between text-green-600 mb-2 text-sm font-bold animate-fade-in">
                  <span>Descuento (15%):</span> <span>-${discountAmount.toLocaleString('es-AR')}</span>
                </div>
              )}

              <div className="flex justify-between text-brand-dark font-bold mb-4 text-sm">
                <span>Costo de Envío:</span> <span className="text-green-600 flex items-center gap-1"><Truck size={14}/> GRATIS</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-brand-dark flex justify-between border-t border-brand-border pt-4">
                <span>Total:</span> <span className="text-brand-primary">${finalTotal.toLocaleString('es-AR')}</span>
              </h3>
            </div>
            
            <button 
              onClick={submitOrder} 
              disabled={isProcessing}
              className={`w-full py-4 font-bold uppercase tracking-[0.2em] rounded-md transition-all duration-300 shadow-xl text-sm ${isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' : paymentMethod === 'MERCADO_PAGO' ? 'bg-[#009EE3] hover:bg-[#0088c4] text-white shadow-[#009EE3]/40 hover:scale-105' : 'bg-brand-dark hover:bg-brand-primary text-white hover:scale-105'}`}
            >
              {isProcessing ? 'Procesando...' : paymentMethod === 'MERCADO_PAGO' ? 'Pagar con Mercado Pago' : 'Confirmar y Ver WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}