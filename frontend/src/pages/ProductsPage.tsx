import { useEffect, useState } from 'react';
import { catalogService, orderService, leadService } from '../services/api';
import type { Product, CartItem } from '../types';
import Swal from 'sweetalert2';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Trash2, Plus, Minus, PackageOpen, Eye, LayoutGrid, CreditCard, Truck, Landmark, X } from 'lucide-react';

export default function ProductsPage() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('fabrica_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [customer, setCustomer] = useState(() => {
    const savedCustomer = localStorage.getItem('fabrica_customer');
    return savedCustomer ? JSON.parse(savedCustomer) : { firstName: '', lastName: '', email: '', phone: '', street: '', number: '', zip: '', city: '' };
  });

  const [formErrors, setFormErrors] = useState({ firstName: '', lastName: '', email: '', phone: '', street: '', number: '', zip: '', city: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState(location.state?.category || 'Todas');
  
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'MERCADO_PAGO'>('TRANSFER');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (location.state?.category) {
      setSelectedCategory(location.state.category);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
  useEffect(() => { localStorage.setItem('fabrica_customer', JSON.stringify(customer)); }, [customer]);

  // VALIDACIONES DEL FORMULARIO
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });

    let errorMsg = '';
    if ((name === 'firstName' || name === 'lastName' || name === 'city') && value && !/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(value)) {
      errorMsg = 'Solo debe contener letras.';
    } else if ((name === 'phone' || name === 'number' || name === 'zip') && value && !/^[0-9]+$/.test(value)) {
      errorMsg = 'Solo debe contener números.';
    }

    if (name !== 'email') setFormErrors(prev => ({ ...prev, [name]: errorMsg }));
    else setFormErrors(prev => ({ ...prev, email: '' }));
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFormErrors(prev => ({ ...prev, email: 'Formato de correo inválido.' }));
    }
    if (name === 'email' || name === 'phone') handleSilentCapture();
  };

  const handleSilentCapture = async () => {
    if (cart.length === 0 || (!customer.email.trim() && !customer.phone.trim())) return;
    const cartContent = cart.map(item => `${item.quantity}x ${item.product.name} (${item.size})`).join(' | ');
    try { await leadService.captureLead({ email: customer.email, phone: customer.phone, cartContent }); } catch (error) {}
  };

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
    if (cart.length === 1) setIsMobileCartOpen(false);
  };

  const quickAddToCart = (product: Product, sizeName: string) => {
    const currentSizeData = product.sizes?.find(s => s.size === sizeName);
    const availableStock = currentSizeData ? currentSizeData.stock : 0;
    if (availableStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id && item.size === sizeName);
      if (existing) {
        if (existing.quantity >= availableStock) {
          Swal.fire({ icon: 'warning', title: 'Límite de stock', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
          return prev;
        }
        return prev.map(item => (item.product.id === product.id && item.size === sizeName) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, size: sizeName }];
    });
    Swal.fire({ icon: 'success', title: 'Agregado al pedido', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
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

      if (paymentMethod === 'TRANSFER') {
        setCart([]);
        setIsMobileCartOpen(false);
        localStorage.removeItem('fabrica_cart');
        localStorage.removeItem('fabrica_customer');

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
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchLower || p.name.toLowerCase().includes(searchLower) || p.sku.toLowerCase().includes(searchLower);
    if (selectedCategory === 'Todas') return matchesSearch;
    const normalize = (text?: string) => (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const prodCat = normalize(p.categoryName);
    const selCat = normalize(selectedCategory);
    return matchesSearch && prodCat === selCat;
  });
  
  const displayCategories = selectedCategory === 'Todas' 
    ? Array.from(new Set(filteredProducts.map(p => p.categoryName || 'Otros')))
    : [selectedCategory];

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  const discountAmount = paymentMethod === 'TRANSFER' ? cartSubtotal * 0.15 : 0;
  const finalTotal = cartSubtotal - discountAmount;

  return (
    <>
      <Helmet><title>Productos | Ritual Espacios</title></Helmet>

      <button 
        onClick={() => setIsMobileCartOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 bg-brand-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all border-2 border-white"
      >
        <ShoppingCart size={24} />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-brand-dark text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
            {cart.reduce((a, b) => a + b.quantity, 0)}
          </span>
        )}
      </button>

      {/* CATEGORÍAS FLUIDAS: Se eliminó el z-index para que fluyan con la página y no tapen el carrito. */}
      <div id="catalogo" className="bg-white border-b border-brand-border shadow-sm">
        <div className="max-w-[1600px] w-[95%] mx-auto py-4 md:py-6 flex gap-3 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth items-start justify-start lg:justify-center bg-white">
          {categoryFilters.map(cat => (
            <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className="flex flex-col items-center gap-2 group flex-shrink-0 w-[76px] md:w-[100px]">
              <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full p-1 transition-all duration-300 border-2 ${selectedCategory === cat.name ? 'border-brand-primary' : 'border-transparent group-hover:border-gray-200'}`}>
                <div className="w-full h-full rounded-full overflow-hidden shadow-inner bg-brand-dark flex items-center justify-center">
                  {cat.image ? <img src={cat.image} alt={cat.name} className={`w-full h-full object-cover transition-transform duration-700 ${selectedCategory === cat.name ? 'scale-110' : 'group-hover:scale-110'}`} /> : <div className={`transition-transform duration-700 ${selectedCategory === cat.name ? 'scale-110' : 'group-hover:scale-110'}`}>{cat.icon}</div>}
                </div>
              </div>
              {/* TRUNCADO REMOVIDO (se quitó line-clamp-2) */}
              <span className={`text-[9px] md:text-xs font-bold uppercase tracking-wider text-center leading-tight px-1 ${selectedCategory === cat.name ? 'text-brand-primary' : 'text-brand-muted group-hover:text-brand-dark'}`}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] w-[95%] mx-auto py-8 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-screen relative z-10">
        
        <div className="flex-1">
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-4 top-3.5 text-brand-muted" size={18} />
            <input type="search" placeholder="Buscar por producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-brand-border rounded-md text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm shadow-sm" />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-brand-muted flex flex-col items-center bg-white rounded-xl border border-brand-border"><PackageOpen size={48} className="mb-4 opacity-50" /><p className="text-lg">No hay productos en esta categoría.</p><button onClick={() => setSelectedCategory('Todas')} className="mt-4 text-brand-primary font-bold underline">Ver todo el catálogo</button></div>
          ) : (
            displayCategories.map(categoryTitle => (
              <div key={categoryTitle} className="mb-12">
                <h2 className="text-lg md:text-2xl text-brand-dark font-light uppercase tracking-[0.15em] border-b border-brand-border pb-3 mb-6">{categoryTitle}</h2>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts
                    .filter(p => selectedCategory === 'Todas' ? (p.categoryName || 'Otros') === categoryTitle : true)
                    .map((product) => {
                    const totalStock = product.sizes ? product.sizes.reduce((acc, s) => acc + (s.stock || 0), 0) : 0;
                    return (
                      <div key={product.id} className="bg-white border border-brand-border rounded-lg md:rounded-xl flex flex-col group hover:shadow-lg transition-all duration-300 relative">
                        <div className="absolute top-3 right-3 bg-brand-dark text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-md z-10 flex items-center gap-1"><Truck size={12}/> Envío Gratis</div>
                        <Link to={`/producto/${product.sku}`} className="h-40 md:h-64 bg-brand-gray overflow-hidden relative block rounded-t-lg md:rounded-t-xl">
                          {product.imageUrls && product.imageUrls.length > 0 ? <img src={optimizeCloudinaryUrl(product.imageUrls[0], 500)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-brand-muted"><PackageOpen size={32} className="md:w-16 md:h-16" /></div>}
                        </Link>
                        <div className="p-4 md:p-6 flex flex-col flex-1">
                          <Link to={`/producto/${product.sku}`} className="hover:text-brand-primary transition-colors"><h3 className="text-sm md:text-lg font-bold text-brand-dark mb-1 line-clamp-2">{product.name}</h3></Link>
                          <div className="mt-auto pt-4 flex flex-col h-full justify-end">
                            <div className="flex flex-col gap-0.5 mb-4">
                              {product.originalPrice && product.originalPrice > product.salePrice && (<span className="text-[10px] md:text-sm text-brand-muted line-through font-medium">${product.originalPrice.toLocaleString('es-AR')}</span>)}
                              <div className="flex items-center gap-2">
                                <span className="text-xl md:text-2xl font-black text-brand-dark">${product.salePrice.toLocaleString('es-AR')}</span>
                                {product.originalPrice && product.originalPrice > product.salePrice && (<span className="text-[10px] md:text-xs font-bold text-brand-primary bg-orange-50 px-1.5 py-0.5 rounded">{Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)}% OFF</span>)}
                              </div>
                              <span className="text-[11px] md:text-sm font-black text-brand-primary uppercase tracking-tighter opacity-90">${(product.salePrice * 0.85).toLocaleString('es-AR')} con TRANSFERENCIA</span>
                            </div>
                            <div className="flex gap-2 h-10 md:h-12 mt-auto">
                              <Link to={`/producto/${product.sku}`} className="flex-1 text-[10px] md:text-sm font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-primary text-white">
                                <Eye size={16} /> Detalles
                              </Link>
                              {totalStock > 0 && (
                                <div className="relative group/menu flex">
                                  <button className="h-full px-3 md:px-4 bg-white border border-brand-border rounded text-brand-dark group-hover:bg-brand-primary group-hover:text-white transition-colors flex items-center justify-center shadow-sm"><ShoppingCart size={18} /></button>
                                  <div className="absolute bottom-full mb-2 right-0 w-48 bg-white border border-brand-border rounded-lg shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-50 flex flex-col overflow-hidden pb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-center py-2 bg-brand-gray text-brand-muted border-b border-brand-border mb-1">Agregar al carrito</span>
                                    {product.sizes?.map(s => (
                                      <button key={s.size} disabled={s.stock <= 0} onClick={(e) => { e.preventDefault(); quickAddToCart(product, s.size); }} className="px-4 py-3 text-xs font-bold text-brand-dark hover:bg-brand-gray disabled:opacity-50 transition-colors text-left flex justify-between items-center border-b border-gray-50 last:border-0">
                                        <span>{s.size}</span>
                                        {s.stock > 0 ? <Plus size={14} className="text-brand-primary"/> : <span className="text-[9px] uppercase">Agotado</span>}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
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

        {/* MODAL DEL CARRITO: Z-INDEX 100 absoluto para sobreponerse a todo */}
        <div className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-300 ${isMobileCartOpen ? 'opacity-100 visible' : 'opacity-0 invisible lg:static lg:opacity-100 lg:visible lg:block lg:w-[450px]'}`}>
          
          <div className="absolute inset-0 bg-black/60 lg:hidden" onClick={() => setIsMobileCartOpen(false)}></div>
          
          <div className={`relative bg-white w-[85%] max-w-[400px] h-full p-5 md:p-6 overflow-y-auto flex flex-col shadow-2xl transition-transform duration-300 ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:rounded-xl lg:border lg:border-brand-border lg:shadow-xl lg:max-h-[calc(100vh-10rem)] lg:sticky lg:top-36 lg:w-[450px] lg:max-w-none'}`}>
            
            <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-brand-primary" size={20} />
                <h2 className="text-sm md:text-lg font-bold uppercase tracking-widest text-brand-dark m-0">Tu Pedido</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-brand-gray text-brand-dark text-[10px] font-bold px-2 py-1 rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)} ítems</span>
                <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2 bg-gray-100 rounded-full text-brand-dark hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                  <X size={18}/>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50 py-10"><ShoppingCart size={40} className="mb-4" /><p className="font-bold uppercase text-xs md:text-sm">Tu carrito está vacío</p></div>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map((item, idx) => (
                    <div key={`${item.product.id}-${idx}`} className="flex justify-between items-center bg-brand-gray p-3 rounded-lg border border-brand-border">
                      <div className="flex-1 pr-2">
                        <p className="text-brand-dark font-bold text-xs md:text-sm leading-tight mb-1">{item.product.name}</p>
                        <p className="text-brand-primary font-black text-[9px] md:text-[10px] uppercase">Medida: {item.size}</p>
                        <p className="text-brand-muted font-bold text-xs md:text-sm">${(item.product.salePrice * item.quantity).toLocaleString('es-AR')}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-brand-border shadow-sm">
                        <button onClick={() => decreaseQuantity(item.product.id, item.size)} className="text-brand-muted hover:text-brand-primary"><Minus size={12} /></button>
                        <span className="text-brand-dark font-bold w-4 text-center text-xs md:text-sm">{item.quantity}</span>
                        <button onClick={() => addQuantity(item.product.id, item.size)} className="text-brand-muted hover:text-brand-primary"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id, item.size)} className="ml-3 text-red-500 p-2 bg-white rounded border border-red-100"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="space-y-4 pb-4">
                  <h4 className="text-brand-primary text-[10px] md:text-xs uppercase font-bold border-b pb-1 pt-4 tracking-widest">Datos de Destino</h4>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="flex flex-col">
                      <input type="text" name="firstName" placeholder="Nombre" value={customer.firstName} onChange={handleCustomerChange} className={`p-2.5 text-xs md:text-sm bg-brand-gray border rounded outline-none ${formErrors.firstName ? 'border-red-500' : 'border-brand-border'}`} />
                      {formErrors.firstName && <span className="text-[9px] md:text-[10px] text-red-500 mt-1">{formErrors.firstName}</span>}
                    </div>
                    <div className="flex flex-col">
                      <input type="text" name="lastName" placeholder="Apellido" value={customer.lastName} onChange={handleCustomerChange} className={`p-2.5 text-xs md:text-sm bg-brand-gray border rounded outline-none ${formErrors.lastName ? 'border-red-500' : 'border-brand-border'}`} />
                      {formErrors.lastName && <span className="text-[9px] md:text-[10px] text-red-500 mt-1">{formErrors.lastName}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <input type="email" name="email" placeholder="Correo Electrónico" value={customer.email} onChange={handleCustomerChange} onBlur={handleInputBlur} className={`w-full p-2.5 text-xs md:text-sm bg-brand-gray border rounded outline-none ${formErrors.email ? 'border-red-500' : 'border-brand-border'}`} />
                    {formErrors.email && <span className="text-[9px] md:text-[10px] text-red-500 mt-1">{formErrors.email}</span>}
                  </div>
                  <div className="flex flex-col">
                    <input type="tel" name="phone" placeholder="Celular (Cód. Área sin 0 ni 15)" value={customer.phone} onChange={handleCustomerChange} onBlur={handleInputBlur} className={`w-full p-2.5 text-xs md:text-sm bg-brand-gray border rounded outline-none ${formErrors.phone ? 'border-red-500' : 'border-brand-border'}`} />
                    {formErrors.phone && <span className="text-[9px] md:text-[10px] text-red-500 mt-1">{formErrors.phone}</span>}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <input type="text" name="street" placeholder="Calle" value={customer.street} onChange={handleCustomerChange} className="col-span-2 p-2.5 text-xs md:text-sm bg-brand-gray border border-brand-border rounded outline-none" />
                    <div className="flex flex-col">
                      <input type="text" name="number" placeholder="Nro" value={customer.number} onChange={handleCustomerChange} className={`p-2.5 text-xs md:text-sm bg-brand-gray border rounded outline-none ${formErrors.number ? 'border-red-500' : 'border-brand-border'}`} />
                      {formErrors.number && <span className="text-[9px] md:text-[10px] text-red-500 mt-1">{formErrors.number}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <div className="flex flex-col">
                      <input type="text" name="zip" placeholder="C.P." value={customer.zip} onChange={handleCustomerChange} className={`p-2.5 text-xs md:text-sm bg-brand-gray border rounded outline-none ${formErrors.zip ? 'border-red-500' : 'border-brand-border'}`} />
                      {formErrors.zip && <span className="text-[9px] md:text-[10px] text-red-500 mt-1">{formErrors.zip}</span>}
                    </div>
                    <div className="flex flex-col col-span-2">
                      <input type="text" name="city" placeholder="Localidad" value={customer.city} onChange={handleCustomerChange} className={`p-2.5 text-xs md:text-sm bg-brand-gray border rounded outline-none ${formErrors.city ? 'border-red-500' : 'border-brand-border'}`} />
                      {formErrors.city && <span className="text-[9px] md:text-[10px] text-red-500 mt-1">{formErrors.city}</span>}
                    </div>
                  </div>

                  <h4 className="text-brand-primary text-[10px] md:text-xs uppercase font-bold border-b pb-1 pt-4 tracking-widest">Método de Pago</h4>
                  <div className="flex flex-col gap-2 md:gap-3">
                    <label className={`border p-3 md:p-4 rounded-lg cursor-pointer transition-all ${paymentMethod === 'TRANSFER' ? 'border-brand-primary bg-orange-50 shadow-sm' : 'bg-white border-brand-border'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="payment" value="TRANSFER" checked={paymentMethod === 'TRANSFER'} onChange={() => setPaymentMethod('TRANSFER')} className="accent-brand-primary w-4 h-4" />
                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between">
                          <p className="font-bold text-[11px] md:text-sm flex items-center gap-2"><Landmark size={16}/> Transferencia</p>
                          <p className="text-[10px] md:text-xs text-brand-primary font-black mt-1 md:mt-0 uppercase tracking-tighter">🔥 15% OFF INMEDIATO</p>
                        </div>
                      </div>
                    </label>
                    <label className={`border p-3 md:p-4 rounded-lg cursor-pointer transition-all ${paymentMethod === 'MERCADO_PAGO' ? 'border-[#009EE3] bg-blue-50 shadow-sm' : 'bg-white border-brand-border'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="payment" value="MERCADO_PAGO" checked={paymentMethod === 'MERCADO_PAGO'} onChange={() => setPaymentMethod('MERCADO_PAGO')} className="accent-[#009EE3] w-4 h-4" />
                        <div className="flex-1 flex items-center justify-between">
                          <p className="font-bold text-[11px] md:text-sm flex items-center gap-2"><CreditCard size={16}/> Tarjetas / Mercado Pago</p>
                          <img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadopago/logo__small.png" alt="MP" className="h-3 md:h-4 object-contain" />
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="bg-brand-gray p-4 rounded-lg border border-brand-border space-y-1 mt-4">
                    <div className="flex justify-between text-xs md:text-sm mb-1"><span>Subtotal:</span><span>${cartSubtotal.toLocaleString('es-AR')}</span></div>
                    {paymentMethod === 'TRANSFER' && <div className="flex justify-between text-green-600 text-xs md:text-sm font-bold"><span>Descuento (15%):</span><span>-${discountAmount.toLocaleString('es-AR')}</span></div>}
                    <div className="flex justify-between text-green-600 text-xs md:text-sm font-bold"><span>Envío:</span><span>GRATIS</span></div>
                    <div className="flex justify-between font-black text-sm md:text-base border-t pt-3 mt-2 uppercase tracking-wider"><span>Total:</span><span className="text-brand-primary text-xl md:text-2xl">${finalTotal.toLocaleString('es-AR')}</span></div>
                  </div>
                  
                  <button onClick={submitOrder} disabled={isProcessing} className={`w-full py-4 font-bold uppercase tracking-widest rounded-lg shadow-xl text-xs md:text-sm text-white transition-all mt-4 ${isProcessing ? 'bg-gray-400' : paymentMethod === 'MERCADO_PAGO' ? 'bg-[#009EE3] hover:bg-[#0088c4]' : 'bg-brand-dark hover:bg-brand-primary'}`}>{isProcessing ? 'Procesando...' : paymentMethod === 'MERCADO_PAGO' ? 'Pagar con Mercado Pago' : 'Confirmar Pedido'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}