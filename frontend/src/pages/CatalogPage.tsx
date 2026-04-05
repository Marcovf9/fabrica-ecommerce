import { useEffect, useState } from 'react'
import { catalogService, orderService } from '../services/api'
import type { Product, CartItem } from '../types'
import Swal from 'sweetalert2';
import { optimizeCloudinaryUrl } from '../utils/imageUtils';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('fabrica_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [customer, setCustomer] = useState({ firstName: '', lastName: '', email: '', phone: '', street: '', number: '', zip: '', city: '' })
  const [formErrors, setFormErrors] = useState({ firstName: '', lastName: '', email: '', phone: '', street: '', number: '', zip: '', city: '' })
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await catalogService.getCatalog()
        setProducts(data)
      } catch (err) {
        setError("Error al cargar el catálogo de productos.")
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  useEffect(() => {
    localStorage.setItem('fabrica_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    if (product.availableStock <= 0) {
      return Swal.fire({ icon: 'error', title: 'Agotado', background: '#3A322D', color: '#F5EFE6', text: `El producto ${product.name} no tiene stock disponible.` });
    }

    setCart((prevCart) => {
      const existing = prevCart.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.availableStock) {
          Swal.fire({ icon: 'warning', title: 'Límite de stock', background: '#3A322D', color: '#F5EFE6', text: `Solo quedan ${product.availableStock} unidades.`, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
          return prevCart;
        }
        Swal.fire({ icon: 'success', title: 'Agregado al carrito', background: '#3A322D', color: '#F5EFE6', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        return prevCart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      Swal.fire({ icon: 'success', title: 'Agregado al carrito', background: '#3A322D', color: '#F5EFE6', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const decreaseQuantity = (productId: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prevCart.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item );
      }
      return prevCart.filter(item => item.product.id !== productId);
    });
  }

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId))
  }

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });

    let errorMsg = '';
    if ((name === 'firstName' || name === 'lastName') && value && !/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(value)) {
      errorMsg = 'Solo debe contener letras.';
    } else if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errorMsg = 'Formato de correo inválido.';
    } else if (name === 'phone' && value && !/^[0-9]+$/.test(value)) {
      errorMsg = 'Solo debe contener números.';
    }
    setFormErrors(prev => ({ ...prev, [name]: errorMsg }));
  }

  const submitOrder = async () => {
    if (cart.length === 0) return Swal.fire({ icon: 'warning', title: 'Carrito vacío', background: '#3A322D', color: '#F5EFE6' });
    
    if (!customer.firstName.trim() || !customer.lastName.trim() || !customer.email.trim() || !customer.phone.trim() || !customer.street.trim() || !customer.number.trim() || !customer.zip.trim() || !customer.city.trim()) {
      return Swal.fire({ icon: 'error', title: 'Datos incompletos', text: 'Todos los campos son obligatorios.', background: '#3A322D', color: '#F5EFE6' });
    }
    if (formErrors.firstName || formErrors.lastName || formErrors.email || formErrors.phone) {
      return Swal.fire({ icon: 'error', title: 'Formato inválido', text: 'Corrige los errores marcados en rojo.', background: '#3A322D', color: '#F5EFE6' });
    }
    
    try {
      const formattedContact = `${customer.lastName}, ${customer.firstName} | ${customer.email} | Tel: ${customer.phone}`;
      const formattedAddress = `${customer.street} ${customer.number}, CP: ${customer.zip}, ${customer.city}`;
      
      const payload = { 
        customerContact: formattedContact, 
        deliveryAddress: formattedAddress, 
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })) 
      };
      
      const response = await orderService.createPendingOrder(payload);
      const cartTotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
      
      const waMessage = `Hola Ritual Espacios, soy ${customer.firstName} ${customer.lastName}. Generé el pedido #${response.orderCode} por $${cartTotal.toLocaleString('es-AR')}. Mi dirección de envío es ${formattedAddress}. Quiero coordinar el pago.`;
      const waUrl = `https://wa.me/5493517150510?text=${encodeURIComponent(waMessage)}`;

      Swal.fire({
        icon: 'success',
        title: '¡Pedido Registrado!',
        html: `Tu código de seguimiento: <b style="color:#D67026">${response.orderCode}</b><br/><br/>El stock ha sido reservado. Escríbenos por WhatsApp para coordinar el pago.`,
        background: '#2B2522',
        color: '#F5EFE6',
        confirmButtonColor: '#27ae60',
        confirmButtonText: 'Coordinar Pago (WhatsApp)'
      }).then((result) => {
        if (result.isConfirmed) window.open(waUrl, '_blank');
      });
      
      setCart([]);
      setCustomer({ firstName: '', lastName: '', email: '', phone: '', street: '', number: '', zip: '', city: '' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al generar el pedido.', background: '#3A322D', color: '#F5EFE6' });
    }
  };

  if (loading) return <div style={{ height: '100vh', backgroundColor: '#2B2522', color: '#F5EFE6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2>Cargando Catálogo...</h2></div>
  if (error) return <div style={{ height: '100vh', backgroundColor: '#2B2522', color: '#e74c3c', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2>{error}</h2></div>

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0)
  const allCategories = ['Todas', ...Array.from(new Set(products.map(p => p.categoryName)))];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const displayCategories = Array.from(new Set(filteredProducts.map(p => p.categoryName)));

  return (
    <>
      <Helmet>
        <title>Ritual Espacios | Parrillas Pesadas y Mobiliario de Exterior</title>
        <meta name="description" content="Fabricación de mobiliario exterior y parrillas pesadas. Diseños en hierro y plástico reciclado construidos para perdurar." />
        <meta property="og:title" content="Ritual Espacios | Fuego & Diseño" />
        <meta property="og:description" content="Catálogo oficial de Ritual Espacios. Fogoneros, parrillas y muebles sustentables." />
        <meta property="og:image" content="https://res.cloudinary.com/dq5bau3ky/image/upload/v1/ritual_espacios/logo.jpeg" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div style={{ padding: '40px 20px', display: 'flex', gap: '40px', maxWidth: '1400px', margin: '0 auto', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 800px' }}>
          <div style={{ marginBottom: '30px', backgroundColor: '#3A322D', padding: '20px', borderRadius: '4px', border: '1px solid #51433A' }}>
            <input 
              type="search" 
              placeholder="🔍 Buscar modelo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #68594D', backgroundColor: '#2B2522', color: '#F5EFE6', fontSize: '1.05rem', marginBottom: '15px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {allCategories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  style={{ 
                    padding: '8px 16px', borderRadius: '2px', border: `1px solid ${selectedCategory === cat ? '#D67026' : '#68594D'}`, 
                    cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem',
                    backgroundColor: selectedCategory === cat ? '#D67026' : 'transparent',
                    color: selectedCategory === cat ? '#F5EFE6' : '#B8B0A3',
                    transition: 'all 0.2s'
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <p style={{ textAlign: 'center', marginTop: '50px', color: '#B8B0A3' }}>No hay inventario que coincida con la búsqueda.</p>
          ) : (
            displayCategories.map(category => (
              <div key={category} style={{ marginBottom: '50px' }}>
                <h2 style={{ color: '#F5EFE6', borderBottom: '1px solid #51433A', paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{category}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                  {filteredProducts.filter(p => p.categoryName === category).map((product) => (
                    <div key={product.id} style={{ backgroundColor: '#3A322D', border: '1px solid #51433A', borderRadius: '4px', overflow: 'hidden' }}>
                      <Link 
                        to={`/producto/${product.sku}`}
                        style={{ height: '280px', backgroundColor: '#1A1816', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', textDecoration: 'none' }}
                      >
                        {product.imageUrls && product.imageUrls.length > 0 ? (
                          <img src={optimizeCloudinaryUrl(product.imageUrls[0], 400)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#68594D', fontSize: '3rem' }}>📷</span>
                        )}
                      </Link>
                      <div style={{ padding: '20px' }}>
                        <Link to={`/producto/${product.sku}`} style={{ textDecoration: 'none' }}>
                          <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: '#F5EFE6' }}>{product.name}</h3>
                        </Link>
                        <p style={{ margin: '0 0 15px 0', color: '#B8B0A3', fontSize: '0.85rem' }}>Stock disponible: {product.availableStock} unid.</p>
                        <h2 style={{ color: '#D67026', margin: '0 0 15px 0' }}>${product.salePrice.toLocaleString('es-AR')}</h2>
                        <button 
                          onClick={() => addToCart(product)}
                          disabled={product.availableStock <= 0}
                          style={{ 
                            padding: '12px', width: '100%', cursor: product.availableStock > 0 ? 'pointer' : 'not-allowed', 
                            backgroundColor: product.availableStock > 0 ? '#D67026' : '#51433A', color: product.availableStock > 0 ? '#F5EFE6' : '#B8B0A3', 
                            border: 'none', borderRadius: '2px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'
                          }}>
                          {product.availableStock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* SIDEBAR CARRITO INTACTO */}
        <div style={{ flex: '1 1 350px', backgroundColor: '#3A322D', padding: '25px', borderRadius: '4px', border: '1px solid #51433A', position: 'sticky', top: '100px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
          <h2 style={{ marginTop: 0, textTransform: 'uppercase', color: '#F5EFE6', letterSpacing: '1px' }}>Tu Pedido</h2>
          <hr style={{ borderColor: '#51433A', marginBottom: '20px' }} />
          
          {cart.length === 0 ? (
            <p style={{ color: '#B8B0A3' }}>El carrito está vacío.</p>
          ) : (
            <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
              {cart.map((item) => (
                <li key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #51433A' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', marginBottom: '5px', color: '#F5EFE6' }}>{item.product.name}</strong>
                    <span style={{ color: '#D67026', fontWeight: 'bold' }}>${(item.product.salePrice * item.quantity).toLocaleString('es-AR')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => decreaseQuantity(item.product.id)} style={{ backgroundColor: '#51433A', color: '#F5EFE6', border: 'none', borderRadius: '2px', width: '28px', height: '28px', cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center', color: '#F5EFE6' }}>{item.quantity}</span>
                    <button onClick={() => addToCart(item.product)} style={{ backgroundColor: '#51433A', color: '#F5EFE6', border: 'none', borderRadius: '2px', width: '28px', height: '28px', cursor: 'pointer' }}>+</button>
                    <button onClick={() => removeFromCart(item.product.id)} style={{ backgroundColor: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer', marginLeft: '5px' }}>✕</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          <h3 style={{ fontSize: '1.5rem', marginTop: '20px', borderTop: '1px solid #51433A', paddingTop: '15px', color: '#F5EFE6' }}>Total: ${cartTotal.toLocaleString('es-AR')}</h3>
          
          <div style={{ marginTop: '30px' }}>
            <h4 style={{ color: '#B8B0A3', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '15px' }}>Datos de Contacto</h4>
            
            <label style={labelStyleDark}>Nombre</label>
            <input type="text" name="firstName" value={customer.firstName} onChange={handleCustomerChange} style={inputStyleDark} />
            {formErrors.firstName && <span style={errorStyle}>{formErrors.firstName}</span>}

            <label style={labelStyleDark}>Apellido</label>
            <input type="text" name="lastName" value={customer.lastName} onChange={handleCustomerChange} style={inputStyleDark} />
            {formErrors.lastName && <span style={errorStyle}>{formErrors.lastName}</span>}

            <label style={labelStyleDark}>Correo Electrónico</label>
            <input type="email" name="email" value={customer.email} onChange={handleCustomerChange} style={inputStyleDark} />
            {formErrors.email && <span style={errorStyle}>{formErrors.email}</span>}

            <label style={labelStyleDark}>Teléfono (Sin guiones)</label>
            <input type="tel" name="phone" value={customer.phone} onChange={handleCustomerChange} style={inputStyleDark} />
            {formErrors.phone && <span style={errorStyle}>{formErrors.phone}</span>}

            <h4 style={{ color: '#B8B0A3', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '15px', marginTop: '20px' }}>Dirección de Envío</h4>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyleDark}>Calle</label>
                <input type="text" name="street" value={customer.street} onChange={handleCustomerChange} style={inputStyleDark} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyleDark}>Número</label>
                <input type="text" name="number" value={customer.number} onChange={handleCustomerChange} style={inputStyleDark} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyleDark}>C. Postal</label>
                <input type="text" name="zip" value={customer.zip} onChange={handleCustomerChange} style={inputStyleDark} />
              </div>
              <div style={{ flex: 2 }}>
                <label style={labelStyleDark}>Localidad</label>
                <input type="text" name="city" value={customer.city} onChange={handleCustomerChange} style={inputStyleDark} />
              </div>
            </div>
            
            <button onClick={submitOrder} style={{ width: '100%', padding: '15px', backgroundColor: '#D67026', color: '#F5EFE6', border: 'none', borderRadius: '2px', fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', marginTop: '20px', letterSpacing: '1px' }}>
              Confirmar Pedido
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const inputStyleDark = { 
  width: '100%', padding: '12px', marginBottom: '5px', borderRadius: '2px', 
  border: '1px solid #68594D', backgroundColor: '#2B2522', color: '#F5EFE6', boxSizing: 'border-box' as const 
};
const labelStyleDark = { display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#B8B0A3', textTransform: 'uppercase' as const };
const errorStyle = { color: '#e74c3c', fontSize: '0.8rem', display: 'block', marginBottom: '15px' };

export default CatalogPage