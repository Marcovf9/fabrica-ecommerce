import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderService } from '../services/api';
import type { OrderDetail } from '../types';
import Swal from 'sweetalert2';
import { Search, MapPin, PackageOpen, Truck, XCircle, Clock } from 'lucide-react';

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [orderCode, setOrderCode] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) { setOrderCode(codeFromUrl); fetchOrder(codeFromUrl); }
  }, [searchParams]);

  const fetchOrder = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setLoading(true); setOrder(null);
    try {
      const formattedCode = codeToSearch.trim().toUpperCase();
      const data = await orderService.getOrderDetails(formattedCode);
      setOrder(data);
    } catch (error: any) { Swal.fire({ icon: 'error', title: 'No encontrado', text: 'No existe un pedido con ese código o hubo un error.' }); } 
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchOrder(orderCode); };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PENDING': return { icon: <Clock size={20} className="md:w-6 md:h-6"/>, bg: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'PENDIENTE', desc: 'Recibimos tu pedido. Estamos verificando el stock antes de procesar el cobro.' };
      case 'PAID': return { icon: <PackageOpen size={20} className="md:w-6 md:h-6"/>, bg: 'bg-green-100 text-green-700 border-green-300', label: 'PAGADO', desc: '¡Pago aprobado! Tu pedido está siendo preparado en el galpón para su despacho.' };
      case 'SHIPPED': return { icon: <Truck size={20} className="md:w-6 md:h-6"/>, bg: 'bg-blue-100 text-blue-700 border-blue-300', label: 'ENVIADO', desc: '¡Tu pedido está en camino! Ha salido de nuestras instalaciones.' };
      case 'CANCELLED': return { icon: <XCircle size={20} className="md:w-6 md:h-6"/>, bg: 'bg-red-100 text-red-700 border-red-300', label: 'CANCELADO', desc: 'El pedido fue cancelado.' };
      default: return { icon: <Clock size={20} className="md:w-6 md:h-6"/>, bg: 'bg-gray-100 text-gray-600 border-gray-300', label: status, desc: 'Estado no reconocido.' };
    }
  };

  return (
    <div className="p-4 md:p-12 max-w-3xl mx-auto min-h-[70vh]">
      <div className="text-center mb-8 md:mb-10">
        <MapPin className="mx-auto text-brand-primary mb-3 md:mb-4 w-10 h-10 md:w-12 md:h-12" />
        <h1 className="text-xl md:text-3xl text-brand-dark font-light uppercase tracking-widest mb-2">Seguimiento de Pedido</h1>
        <p className="text-brand-muted text-sm md:text-base">Ingresa el código que te proporcionamos al finalizar tu compra</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 md:top-4 text-brand-muted w-4 h-4 md:w-5 md:h-5" />
          <input 
            type="text" placeholder="PED-XXXXXX" value={orderCode} onChange={(e) => setOrderCode(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-4 text-sm md:text-lg bg-white border border-brand-border rounded-lg text-brand-dark text-center uppercase focus:ring-2 focus:ring-brand-primary/20 outline-none shadow-sm"
          />
        </div>
        <button 
          type="submit" disabled={loading}
          className={`py-3 md:py-4 px-6 md:px-8 text-sm md:text-base font-bold uppercase tracking-widest rounded-lg transition-all ${loading ? 'bg-brand-border text-brand-muted cursor-not-allowed' : 'bg-brand-primary hover:bg-orange-600 text-white shadow-md'}`}
        >
          {loading ? 'Buscando...' : 'Rastrear'}
        </button>
      </form>

      {order && (
        <div className="bg-white border border-brand-border rounded-xl p-4 md:p-10 shadow-lg animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-brand-border pb-4 md:pb-6 mb-4 md:mb-6 gap-3 md:gap-4">
            <div>
              <h2 className="text-lg md:text-2xl text-brand-dark font-light uppercase tracking-widest m-0">Pedido: <span className="font-bold">{order.orderCode}</span></h2>
              <p className="text-brand-muted text-xs md:text-base mt-1">A nombre de: <strong className="text-brand-dark">{order.customerContact.split('|')[0]}</strong></p>
            </div>
            
            <div className={`flex items-center gap-2 px-3 md:px-5 py-1.5 md:py-2.5 rounded-full border ${getStatusConfig(order.status).bg}`}>
              {getStatusConfig(order.status).icon}
              <span className="font-bold tracking-widest uppercase text-[10px] md:text-sm">{getStatusConfig(order.status).label}</span>
            </div>
          </div>

          <div className="bg-brand-gray p-4 md:p-6 rounded-lg border border-brand-border mb-6 md:mb-8">
            <p className="text-sm md:text-lg text-brand-dark m-0 leading-relaxed font-medium">
              {getStatusConfig(order.status).desc}
            </p>
          </div>

          <h3 className="text-brand-primary text-sm md:text-base font-bold uppercase tracking-widest mb-3 md:mb-4">Detalle de la compra</h3>
          <ul className="list-none p-0 m-0 border border-brand-border rounded-lg overflow-hidden bg-white">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center p-3 md:p-4 border-b border-brand-border last:border-b-0">
                <span className="text-brand-dark text-xs md:text-base"><strong className="text-brand-primary mr-1 md:mr-2">{item.quantity}x</strong> {item.productName}</span>
                <span className="text-brand-muted text-xs md:text-base font-mono font-bold">${item.subTotal.toLocaleString('es-AR')}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-brand-border text-right">
            <h2 className="text-xl md:text-3xl text-brand-dark font-light tracking-wider m-0">
              Total: <span className="font-black text-brand-primary">${order.totalSaleAmount.toLocaleString('es-AR')}</span>
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}