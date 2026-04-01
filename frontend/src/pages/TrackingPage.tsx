import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // NUEVA IMPORTACIÓN
import { orderService } from '../services/api';
import type { OrderDetail } from '../types';
import Swal from 'sweetalert2';

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [orderCode, setOrderCode] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-cargar si la URL trae el parámetro
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setOrderCode(codeFromUrl);
      fetchOrder(codeFromUrl);
    }
  }, [searchParams]);

  const fetchOrder = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setLoading(true);
    setOrder(null);
    try {
      const formattedCode = codeToSearch.trim().toUpperCase();
      const data = await orderService.getOrderDetails(formattedCode);
      setOrder(data);
    } catch (error: any) {
      Swal.fire({ 
        icon: 'error', 
        title: 'No encontrado', 
        text: 'No existe un pedido con ese código o hubo un error de conexión.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderCode);
  };

  // ESTADOS ALINEADOS ESTRICTAMENTE CON EL BACKEND (Order.OrderStatus)
  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PENDING': return { color: '#f1c40f', text: 'PENDIENTE', desc: 'Recibimos tu pedido. Estamos verificando el stock antes de procesar el cobro.' };
      case 'PAID': return { color: '#27ae60', text: 'PAGADO', desc: '¡Pago aprobado! Tu pedido está siendo preparado en el galpón para su despacho.' };
      case 'SHIPPED': return { color: '#2980b9', text: 'ENVIADO', desc: '¡Tu pedido está en camino! Ha salido de nuestras instalaciones.' };
      case 'CANCELLED': return { color: '#e74c3c', text: 'CANCELADO', desc: 'El pedido fue cancelado. Si ya habías pagado, el reembolso está en proceso.' };
      default: return { color: '#95a5a6', text: status, desc: 'Estado no reconocido.' };
    }
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#2c3e50', textAlign: 'center' }}>📍 Seguimiento de Pedido</h1>
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '40px' }}>
        Ingresa el código que te proporcionamos al finalizar tu compra (Ej: PED-123456)
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '40px' }}>
        <input 
          type="text" 
          placeholder="PED-XXXXXX" 
          value={orderCode}
          onChange={(e) => setOrderCode(e.target.value)}
          style={{ padding: '15px', fontSize: '1.2rem', width: '300px', border: '2px solid #bdc3c7', borderRadius: '6px', textAlign: 'center', textTransform: 'uppercase' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '15px 30px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Buscando...' : 'Rastrear'}
        </button>
      </form>

      {order && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #ecf0f1', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#2c3e50' }}>Pedido: {order.orderCode}</h2>
              <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>A nombre de: <strong>{order.customerContact.split('|')[0]}</strong></p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span style={{ 
                display: 'inline-block',
                padding: '8px 16px', 
                backgroundColor: getStatusConfig(order.status).color, 
                color: 'white', 
                borderRadius: '20px', 
                fontWeight: 'bold', 
                fontSize: '1.1rem' 
              }}>
                {getStatusConfig(order.status).text}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '1.1rem', color: '#34495e', marginBottom: '30px', lineHeight: '1.5' }}>
            {getStatusConfig(order.status).desc}
          </p>

          <h3 style={{ color: '#2c3e50' }}>Detalle de la compra:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {order.items.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f2f6' }}>
                <span><strong>{item.quantity}x</strong> {item.productName}</span>
                <span style={{ color: '#7f8c8d' }}>${item.subTotal.toLocaleString('es-AR')}</span>
              </li>
            ))}
          </ul>
          
          <h2 style={{ textAlign: 'right', marginTop: '20px', color: '#2c3e50' }}>
            Total: ${order.totalSaleAmount.toLocaleString('es-AR')}
          </h2>
        </div>
      )}
    </div>
  );
}