import { Helmet } from 'react-helmet-async';
import { HelpCircle, Truck, Clock, ShieldCheck, CreditCard } from 'lucide-react';

export default function FaqPage() {
  const faqs = [
    { icon: <CreditCard className="text-brand-primary mt-1 w-6 h-6 md:w-8 md:h-8" />, question: "¿Cómo es el proceso de compra y pago?", answer: "Armas tu pedido en la web y el sistema reserva tu stock. Al finalizar, te redirigiremos a nuestro WhatsApp oficial con el detalle de tu compra para coordinar el pago mediante transferencia bancaria o efectivo." },
    { icon: <Truck className="text-brand-primary mt-1 w-6 h-6 md:w-8 md:h-8" />, question: "¿Hacen envíos a todo el país? ¿Cuál es el costo?", answer: "Sí, despachamos a toda Argentina desde nuestra planta en Córdoba. El costo de envío corre por cuenta del cliente y se abona en destino. Trabajamos con transportes de carga pesada (Vía Cargo, Andreani, o fletes particulares para zonas aledañas) garantizando el cuidado de las estructuras." },
    { icon: <Clock className="text-brand-primary mt-1 w-6 h-6 md:w-8 md:h-8" />, question: "¿Cuáles son los tiempos de entrega?", answer: "Si el producto figura con stock disponible en la web, se despacha en un plazo de 48 a 72 horas hábiles tras la confirmación del pago. Para pedidos mayoristas o productos sin stock físico, el tiempo de fabricación oscila entre 15 y 20 días." },
    { icon: <ShieldCheck className="text-brand-primary mt-1 w-6 h-6 md:w-8 md:h-8" />, question: "¿Qué garantía tienen los fogoneros y el mobiliario?", answer: "Garantía estructural de fábrica. Nuestras parrillas y fogoneros están forjados en hierro de alto espesor y el mobiliario en plástico reciclado de alta densidad. Cubrimos cualquier defecto de fundición, soldadura o fatiga prematura del material bajo condiciones de uso normal." }
  ];

  return (
    <>
      <Helmet><title>Preguntas Frecuentes | Ritual Espacios</title></Helmet>
      <div className="max-w-4xl mx-auto py-8 md:py-16 px-4 md:px-8">
        <div className="text-center mb-8 md:mb-12">
          <HelpCircle className="mx-auto text-brand-primary mb-3 md:mb-4 w-10 h-10 md:w-12 md:h-12" />
          <h1 className="text-2xl md:text-3xl text-brand-dark font-light uppercase tracking-widest mb-2 md:mb-4">Preguntas Frecuentes</h1>
          <p className="text-brand-muted text-sm md:text-base">Todo lo que necesitas saber antes de encargar tu estructura.</p>
        </div>
        <div className="space-y-4 md:space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-5 md:p-8 rounded-xl border border-brand-border shadow-sm flex flex-col sm:flex-row gap-3 md:gap-4 items-start">
              <div className="flex-shrink-0">{faq.icon}</div>
              <div>
                <h3 className="text-base md:text-xl font-bold text-brand-dark mb-1.5 md:mb-2">{faq.question}</h3>
                <p className="text-brand-muted text-sm md:text-base leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}