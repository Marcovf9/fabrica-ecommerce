import { useEffect, useState } from 'react'
import { catalogService, orderService } from '../services/api'
import type { Product, CartItem } from '../types'
import Swal from 'sweetalert2';

function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('fabrica_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('fabrica_cart', JSON.stringify(cart));
  }, [cart]);
  
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await catalogService.getCatalog()
        setProducts(data)
      } catch (err) {
        console.error(err)
        setError("Error al cargar el catálogo de productos.")
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  const addToCart = (product: Product) => {
    if (product.availableStock <= 0) {
      return Swal.fire({ icon: 'error', title: 'Agotado', text: `El producto ${product.name} no tiene stock disponible.` });
    }

    setCart((prevCart) => {
      const existing = prevCart.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.availableStock) {
          Swal.fire({ icon: 'warning', title: 'Límite de stock', text: `Solo quedan ${product.availableStock} unidades de ${product.name}.`, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
          return prevCart;
        }
        Swal.fire({ icon: 'success', title: 'Agregado al carrito', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        return prevCart.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      Swal.fire({ icon: 'success', title: 'Agregado al carrito', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const decreaseQuantity = (productId: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prevCart.map(item =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prevCart.filter(item => item.product.id !== productId);
    });
  }

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId))
  }

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value })
  }

  const submitOrder = async () => {
    if (cart.length === 0) return Swal.fire({ icon: 'warning', title: 'Carrito vacío', text: 'Agrega productos antes de generar el pedido.' });
    
    if (!customer.firstName.trim() || !customer.lastName.trim() || !customer.email.trim() || !customer.phone.trim()) {
      return Swal.fire({ icon: 'error', title: 'Datos incompletos', text: 'Todos los campos del cliente son obligatorios.' });
    }
    
    const nameRegex = /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/; 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    const phoneRegex = /^[0-9]+$/; 
    
    if (!nameRegex.test(customer.firstName) || !nameRegex.test(customer.lastName)) {
      return Swal.fire({ icon: 'error', title: 'Formato inválido', text: 'El nombre y apellido solo deben contener letras.' });
    }
    if (!emailRegex.test(customer.email)) {
      return Swal.fire({ icon: 'error', title: 'Correo inválido', text: 'Por favor, ingresa un correo electrónico válido.' });
    }
    if (!phoneRegex.test(customer.phone)) {
      return Swal.fire({ icon: 'error', title: 'Teléfono inválido', text: 'El teléfono solo debe contener números (sin espacios ni guiones).' });
    }

    try {
      const formattedContact = `${customer.lastName}, ${customer.firstName} | ${customer.email} | Tel: ${customer.phone}`;

      const payload = {
        customerContact: formattedContact,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };
      
      const response = await orderService.createPendingOrder(payload);
      
      Swal.fire({
        icon: 'success',
        title: '¡Pedido Confirmado!',
        html: `Tu código de seguimiento es: <b>${response.orderCode}</b><br/><br/>Nos pondremos en contacto a la brevedad.`,
        confirmButtonColor: '#27ae60'
      });
      
      setCart([]);
      localStorage.removeItem('fabrica_cart');
      setCustomer({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error del sistema', text: 'Hubo un problema al generar el pedido. Verifica tu conexión.' });
    }
  };

  if (loading) return <h2 style={{ padding: '20px' }}>Cargando inventario...</h2>
  if (error) return <h2 style={{ padding: '20px', color: '#e74c3c' }}>{error}</h2>

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0)
  const uniqueCategories = Array.from(new Set(products.map(p => p.categoryName)))

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', display: 'flex', gap: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ flex: 2 }}>
        <h1>Catálogo de Productos</h1>
        {uniqueCategories.map(category => (
          <div key={category} style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>{category}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {products.filter(p => p.categoryName === category).map((product) => (
                <div key={product.id} style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{product.name}</h3>
                  <h2 style={{ color: '#27ae60', margin: '15px 0' }}>${product.salePrice.toLocaleString('es-AR')}</h2>
                  <p style={{ color: product.availableStock > 0 ? '#3498db' : '#e74c3c', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {product.availableStock > 0 ? `Stock: ${product.availableStock} unid.` : 'Agotado'}
                  </p>
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.availableStock <= 0}
                    style={{ 
                      padding: '10px', width: '100%', cursor: product.availableStock > 0 ? 'pointer' : 'not-allowed', 
                      backgroundColor: product.availableStock > 0 ? '#3498db' : '#bdc3c7', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' 
                    }}>
                    {product.availableStock > 0 ? 'Agregar al pedido' : 'Sin Stock'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '12px', height: 'fit-content', border: '1px solid #e9ecef' }}>
        <h2 style={{ marginTop: 0 }}>Resumen del Pedido</h2>
        <hr style={{ borderColor: '#dee2e6', marginBottom: '20px' }} />
        
        {cart.length === 0 ? (
          <p style={{ color: '#7f8c8d' }}>No hay productos seleccionados.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
            {cart.map((item) => (
              <li key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', marginBottom: '5px' }}>{item.product.name}</strong>
                  <span style={{ color: '#7f8c8d' }}>${(item.product.salePrice * item.quantity).toLocaleString('es-AR')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => decreaseQuantity(item.product.id)} style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', width: '25px', height: '25px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                  <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => addToCart(item.product)} style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', width: '25px', height: '25px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  <button onClick={() => removeFromCart(item.product.id)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', width: '25px', height: '25px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }} title="Eliminar producto">X</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        <h3 style={{ fontSize: '1.5rem', marginTop: '20px', borderTop: '2px solid #2c3e50', paddingTop: '15px' }}>Total: ${cartTotal.toLocaleString('es-AR')}</h3>
        
        <div style={{ marginTop: '30px' }}>
          <h4 style={{ marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>Datos del Cliente</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' }}>Nombre</label>
              <input type="text" name="firstName" placeholder="Ej: Juan" value={customer.firstName} onChange={handleCustomerChange} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' }}>Apellido</label>
              <input type="text" name="lastName" placeholder="Ej: Pérez" value={customer.lastName} onChange={handleCustomerChange} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' }}>Correo Electrónico</label>
            <input type="email" name="email" placeholder="ejemplo@correo.com" value={customer.email} onChange={handleCustomerChange} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' }}>Teléfono (Solo números)</label>
            <input type="tel" name="phone" placeholder="Ej: 3514445555" value={customer.phone} onChange={handleCustomerChange} style={inputStyle} />
          </div>
          <button onClick={submitOrder} style={{ width: '100%', padding: '15px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>
            Generar Pedido
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px', boxSizing: 'border-box' as const }

export default CatalogPage