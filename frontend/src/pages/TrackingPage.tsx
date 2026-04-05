import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderService } from '../services/api';
import type { OrderDetail } from '../types';
import Swal from 'sweetalert2';
import { Search, MapPin, CheckCircle, PackageOpen, Truck, XCircle, Clock } from 'lucide-react';

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [orderCode, setOrderCode] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

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
      Swal.fire({ icon: 'error', title: 'No encontrado', text: 'No existe un pedido con ese código o hubo un error de conexión.', background: '#3A322D', color: '#F5EFE6' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderCode);
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PENDING': return { icon: <Clock size={24}/>, bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'PENDIENTE', desc: 'Recibimos tu pedido. Estamos verificando el stock antes de procesar el cobro.' };
      case 'PAID': return { icon: <PackageOpen size={24}/>, bg: 'bg-green-500/20', text: 'text-green-400', label: 'PAGADO', desc: '¡Pago aprobado! Tu pedido está siendo preparado en el galpón para su despacho.' };
      case 'SHIPPED': return { icon: <Truck size={24}/>, bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'ENVIADO', desc: '¡Tu pedido está en camino! Ha salido de nuestras instalaciones.' };
      case 'CANCELLED': return { icon: <XCircle size={24}/>, bg: 'bg-red-500/20', text: 'text-red-500', label: 'CANCELADO', desc: 'El pedido fue cancelado. Si ya habías pagado, el reembolso está en proceso.' };
      default: return { icon: <Clock size={24}/>, bg: 'bg-gray-600/20', text: 'text-gray-400', label: status, desc: 'Estado no reconocido.' };
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto min-h-screen">
      <div className="text-center mb-10">
        <MapPin className="mx-auto text-brand-primary mb-4" size={48} />
        <h1 className="text-3xl text-brand-text font-light uppercase tracking-widest mb-2">Seguimiento de Pedido</h1>
        <p className="text-brand-muted">Ingresa el código que te proporcionamos al finalizar tu compra</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 justify-center mb-12">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-4 text-brand-muted" size={20} />
          <input 
            type="text" 
            placeholder="PED-XXXXXX" 
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg bg-brand-dark border border-brand-border rounded-lg text-brand-text text-center uppercase focus:border-brand-primary outline-none transition-colors shadow-inner"
          />
        </div>
        <button 
          type="submit" disabled={loading}
          className={`py-4 px-8 font-bold uppercase tracking-widest rounded-lg transition-all ${loading ? 'bg-brand-border text-brand-muted cursor-not-allowed' : 'bg-brand-primary hover:bg-orange-600 text-white shadow-lg hover:shadow-xl'}`}
        >
          {loading ? 'Buscando...' : 'Rastrear'}
        </button>
      </form>

      {order && (
        <div className="bg-brand-panel border border-brand-border rounded-xl p-6 md:p-10 shadow-2xl animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-brand-border pb-6 mb-6 gap-4">
            <div>
              <h2 className="text-2xl text-brand-text font-light uppercase tracking-widest m-0">Pedido: <span className="font-bold">{order.orderCode}</span></h2>
              <p className="text-brand-muted mt-1">A nombre de: <strong className="text-brand-text">{order.customerContact.split('|')[0]}</strong></p>
            </div>
            
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full border ${getStatusConfig(order.status).bg} ${getStatusConfig(order.status).text} border-current`}>
              {getStatusConfig(order.status).icon}
              <span className="font-bold tracking-widest uppercase text-sm">{getStatusConfig(order.status).label}</span>
            </div>
          </div>

          <div className="bg-brand-dark p-6 rounded-lg border border-brand-border mb-8">
            <p className="text-lg text-brand-text m-0 leading-relaxed">
              {getStatusConfig(order.status).desc}
            </p>
          </div>

          <h3 className="text-brand-primary font-bold uppercase tracking-widest mb-4">Detalle de la compra</h3>
          <ul className="list-none p-0 m-0 border border-brand-border rounded-lg overflow-hidden">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center p-4 bg-brand-dark border-b border-brand-border last:border-b-0">
                <span className="text-brand-text"><strong className="text-brand-primary mr-2">{item.quantity}x</strong> {item.productName}</span>
                <span className="text-brand-muted font-mono">${item.subTotal.toLocaleString('es-AR')}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 pt-6 border-t border-brand-border text-right">
            <h2 className="text-3xl text-brand-text font-light tracking-wider m-0">
              Total: <span className="font-bold text-brand-primary">${order.totalSaleAmount.toLocaleString('es-AR')}</span>
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}