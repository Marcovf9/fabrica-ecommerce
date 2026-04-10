import { useEffect, useState } from 'react';
import { catalogService, orderService, leadService, shippingService } from '../services/api';
import type { Product, CartItem } from '../types';
import Swal from 'sweetalert2';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Trash2, Plus, Minus, PackageOpen, Eye } from 'lucide-react';

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

  // Validaciones en tiempo real mientras el usuario escribe
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });

    let errorMsg = '';
    // Validación de solo letras
    if ((name === 'firstName' || name === 'lastName' || name === 'city') && value && !/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(value)) {
      errorMsg = 'Solo debe contener letras.';
    } 
    // Validación de solo números
    else if ((name === 'phone' || name === 'number' || name === 'zip') && value && !/^[0-9]+$/.test(value)) {
      errorMsg = 'Solo debe contener números.';
    }

    // El email limpia su error al escribir, se valida al salir del campo
    if (name !== 'email') {
      setFormErrors(prev => ({ ...prev, [name]: errorMsg }));
    } else {
      setFormErrors(prev => ({ ...prev, email: '' }));
    }
  };

  // Validación al quitar el foco del input
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Validación de email solo cuando termina de escribir
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFormErrors(prev => ({ ...prev, email: 'Formato de correo inválido.' }));
    }

    // Captura silenciosa para carritos abandonados
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

  const allCategories = ['Todas', ...Array.from(new Set(products.map(p => p.categoryName)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (selectedCategory === 'Todas' || p.categoryName === selectedCategory);
  });
  const displayCategories = Array.from(new Set(filteredProducts.map(p => p.categoryName)));

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  const finalTotal = cartSubtotal + shippingCost;

  return (
    <>
      <Helmet><title>Ritual Espacios | Parrillas y Mobiliario de Diseño</title></Helmet>

      <div className="max-w-[1600px] w-[95%] mx-auto py-4 md:py-8 flex flex-col lg:flex-row gap-4 md:gap-8">
        
        {/* CATÁLOGO PRINCIPAL */}
        <div className="flex-1">
          <div className="bg-white p-4 md:p-6 rounded-xl border border-brand-border mb-4 md:mb-8 shadow-sm">
            <div className="relative mb-3 md:mb-6">
              <Search className="absolute left-3 md:left-4 top-3 md:top-3.5 text-brand-muted" size={18} />
              <input 
                type="search" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 bg-brand-gray border border-brand-border rounded-md text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-xs md:text-base"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {allCategories.map(cat => (
                <button 
                  key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-3 md:px-5 py-1.5 md:py-2 text-[10px] md:text-sm font-bold uppercase tracking-wider rounded-md transition-all duration-200 border ${selectedCategory === cat ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-muted border-brand-border hover:border-brand-primary hover:text-brand-primary'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 md:py-20 text-brand-muted flex flex-col items-center">
              <PackageOpen size={32} className="mb-4 opacity-50 md:w-12 md:h-12" />
              <p className="text-sm md:text-lg">No hay inventario que coincida con la búsqueda.</p>
            </div>
          ) : (
            displayCategories.map(category => (
              <div key={category} className="mb-8 md:mb-12">
                <h2 className="text-sm md:text-2xl text-brand-dark font-light uppercase tracking-widest border-b border-brand-border pb-2 md:pb-3 mb-4 md:mb-6">{category}</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-6">
                  {filteredProducts.filter(p => p.categoryName === category).map((product) => {
                    const totalStock = product.sizes ? product.sizes.reduce((acc, s) => acc + (s.stock || 0), 0) : 0;
                    return (
                      <div key={product.id} className="bg-white border border-brand-border rounded-lg md:rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300">
                        <Link to={`/producto/${product.sku}`} className="h-32 md:h-64 bg-brand-gray overflow-hidden relative block">
                          {product.imageUrls && product.imageUrls.length > 0 ? (
                            <img src={optimizeCloudinaryUrl(product.imageUrls[0], 500)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-muted"><PackageOpen size={32} className="md:w-16 md:h-16" /></div>
                          )}
                        </Link>
                        <div className="p-3 md:p-6 flex flex-col flex-1">
                          <Link to={`/producto/${product.sku}`} className="hover:text-brand-primary transition-colors">
                            <h3 className="text-xs md:text-xl font-bold text-brand-dark mb-1 line-clamp-2 md:line-clamp-none">{product.name}</h3>
                          </Link>
                          
                          <div className="mt-auto pt-2 md:pt-4">
                            <p className="text-sm md:text-2xl font-black text-brand-primary mb-2 md:mb-4">${product.salePrice.toLocaleString('es-AR')}</p>
                            <Link 
                              to={`/producto/${product.sku}`}
                              className={`w-full py-1.5 md:py-3 px-2 md:px-4 text-[10px] md:text-base font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1 md:gap-2 ${totalStock > 0 ? 'bg-brand-dark hover:bg-brand-primary text-white' : 'bg-brand-border text-brand-muted cursor-not-allowed pointer-events-none'}`}
                            >
                              <Eye size={12} className="md:w-4 md:h-4" /> {totalStock > 0 ? 'Ver' : 'Agotado'}
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

        {/* SIDEBAR DEL CARRITO */}
        <div className="w-full lg:w-96 lg:sticky lg:top-28 self-start bg-white p-4 md:p-6 rounded-xl border border-brand-border shadow-lg lg:max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 border-b border-brand-border pb-3 md:pb-4">
            <ShoppingCart className="text-brand-primary" size={20} />
            <h2 className="text-base md:text-xl font-bold uppercase tracking-widest text-brand-dark m-0">Tu Pedido</h2>
          </div>
          
          {cart.length === 0 ? (
            <p className="text-brand-muted text-xs md:text-base text-center py-4 md:py-8">Tu carrito está vacío.</p>
          ) : (
            <div className="space-y-2 md:space-y-4 mb-4 md:mb-6">
              {cart.map((item, idx) => (
                <div key={`${item.product.id}-${idx}`} className="flex justify-between items-center bg-brand-gray p-2 md:p-3 rounded border border-brand-border">
                  <div className="flex-1">
                    <p className="text-brand-dark font-bold text-[10px] md:text-sm">{item.product.name} <span className="text-brand-primary font-black ml-1">[{item.size}]</span></p>
                    <p className="text-brand-muted font-bold text-[10px] md:text-sm">${(item.product.salePrice * item.quantity).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 bg-white rounded px-1.5 md:px-2 py-0.5 md:py-1 border border-brand-border shadow-sm">
                    <button onClick={() => decreaseQuantity(item.product.id, item.size)} className="text-brand-muted hover:text-brand-primary p-0.5 md:p-1"><Minus size={10} className="md:w-3 md:h-3" /></button>
                    <span className="text-brand-dark font-bold w-3 md:w-4 text-center text-[10px] md:text-sm">{item.quantity}</span>
                    <button onClick={() => addQuantity(item.product.id, item.size)} className="text-brand-muted hover:text-brand-primary p-0.5 md:p-1"><Plus size={10} className="md:w-3 md:h-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id, item.size)} className="ml-2 text-red-500 hover:text-red-600 transition-colors p-1"><Trash2 size={14} className="md:w-4 md:h-4" /></button>
                </div>
              ))}
            </div>
          )}
          
          <div className="border-t border-brand-border pt-3 md:pt-4 mb-4 md:mb-6">
            <div className="flex justify-between text-brand-dark mb-1 md:mb-2 text-[10px] md:text-sm font-bold">
              <span>Subtotal:</span> <span>${cartSubtotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-brand-muted mb-2 md:mb-4 text-[10px] md:text-sm">
              <span>Envío (Est.):</span> <span>{shippingCost > 0 ? `$${shippingCost.toLocaleString('es-AR')}` : 'Ingresa C.P.'}</span>
            </div>
            <h3 className="text-lg md:text-2xl font-black text-brand-dark flex justify-between border-t border-brand-border pt-2 md:pt-4">
              <span>Total:</span> <span>${finalTotal.toLocaleString('es-AR')}</span>
            </h3>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <h4 className="text-brand-primary text-[9px] md:text-xs uppercase tracking-widest font-bold border-b border-brand-border pb-1 md:pb-2">Contacto</h4>
            
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div>
                <label className="block text-[9px] md:text-xs uppercase text-brand-muted font-bold mb-1">Nombre</label>
                <input type="text" name="firstName" value={customer.firstName} onChange={handleCustomerChange} className="w-full p-1.5 md:p-2.5 text-xs md:text-sm bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                {formErrors.firstName && <span className="text-red-500 text-[9px] md:text-xs mt-1 block">{formErrors.firstName}</span>}
              </div>
              <div>
                <label className="block text-[9px] md:text-xs uppercase text-brand-muted font-bold mb-1">Apellido</label>
                <input type="text" name="lastName" value={customer.lastName} onChange={handleCustomerChange} className="w-full p-1.5 md:p-2.5 text-xs md:text-sm bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                {formErrors.lastName && <span className="text-red-500 text-[9px] md:text-xs mt-1 block">{formErrors.lastName}</span>}
              </div>
            </div>

            <div>
              <label className="block text-[9px] md:text-xs uppercase text-brand-muted font-bold mb-1">Correo Electrónico</label>
              <input type="email" name="email" value={customer.email} onChange={handleCustomerChange} onBlur={handleInputBlur} className="w-full p-1.5 md:p-2.5 text-xs md:text-sm bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
              {formErrors.email && <span className="text-red-500 text-[9px] md:text-xs mt-1 block">{formErrors.email}</span>}
            </div>

            <div>
              <label className="block text-[9px] md:text-xs uppercase text-brand-muted font-bold mb-1">Teléfono (Sin guiones)</label>
              <input type="tel" name="phone" value={customer.phone} onChange={handleCustomerChange} onBlur={handleInputBlur} className="w-full p-1.5 md:p-2.5 text-xs md:text-sm bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
              {formErrors.phone && <span className="text-red-500 text-[9px] md:text-xs mt-1 block">{formErrors.phone}</span>}
            </div>

            <h4 className="text-brand-primary text-[9px] md:text-xs uppercase tracking-widest font-bold border-b border-brand-border pb-1 md:pb-2 pt-2 md:pt-4">Destino Logístico</h4>
            
            <div className="flex gap-2 md:gap-3">
              <div className="flex-[2]">
                <label className="block text-[9px] md:text-xs uppercase text-brand-muted font-bold mb-1">Calle</label>
                <input type="text" name="street" value={customer.street} onChange={handleCustomerChange} className="w-full p-1.5 md:p-2.5 text-xs md:text-sm bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-[9px] md:text-xs uppercase text-brand-muted font-bold mb-1">Núm.</label>
                <input type="text" name="number" value={customer.number} onChange={handleCustomerChange} className="w-full p-1.5 md:p-2.5 text-xs md:text-sm bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                {formErrors.number && <span className="text-red-500 text-[9px] md:text-xs mt-1 block">{formErrors.number}</span>}
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-3">
              <div className="flex-1">
                <label className="block text-[9px] md:text-xs uppercase text-brand-muted font-bold mb-1">C.P.</label>
                <input type="text" name="zip" value={customer.zip} onChange={handleCustomerChange} className="w-full p-1.5 md:p-2.5 text-xs md:text-sm bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                {formErrors.zip && <span className="text-red-500 text-[9px] md:text-xs mt-1 block">{formErrors.zip}</span>}
              </div>
              <div className="flex-[2]">
                <label className="block text-[9px] md:text-xs uppercase text-brand-muted font-bold mb-1">Localidad</label>
                <input type="text" name="city" value={customer.city} onChange={handleCustomerChange} className="w-full p-1.5 md:p-2.5 text-xs md:text-sm bg-white border border-brand-border rounded text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none" />
                {formErrors.city && <span className="text-red-500 text-[9px] md:text-xs mt-1 block">{formErrors.city}</span>}
              </div>
            </div>
            
            <button 
              onClick={submitOrder} 
              className="w-full mt-4 md:mt-6 py-3 md:py-4 bg-brand-primary hover:bg-orange-600 text-white font-bold uppercase tracking-widest rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}