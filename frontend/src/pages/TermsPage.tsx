import { Helmet } from 'react-helmet-async';
import { Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Términos y Condiciones | Ritual Espacios</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-4xl mx-auto py-16 px-4 md:px-8">
        <div className="text-center mb-12">
          <Scale className="mx-auto text-brand-primary mb-4" size={48} />
          <h1 className="text-3xl text-brand-text font-light uppercase tracking-widest mb-4">Términos y Condiciones</h1>
          <p className="text-brand-muted">Políticas comerciales y marco legal de operación.</p>
        </div>

        <div className="bg-brand-panel p-8 md:p-12 rounded-lg border border-brand-border shadow-md text-brand-muted space-y-8 leading-relaxed">
          
          <section>
            <h2 className="text-xl font-bold text-brand-text uppercase tracking-wider mb-4">1. Validez de Cotizaciones y Precios</h2>
            <p>Los precios publicados en el catálogo web están expresados en Pesos Argentinos (ARS). Debido a la naturaleza de los costos de los insumos metalúrgicos, los precios están sujetos a modificaciones sin previo aviso. La confirmación de un pedido en la web "congela" el stock, pero el precio final se asegura únicamente al momento de acreditarse el pago mediante los canales oficiales.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-text uppercase tracking-wider mb-4">2. Responsabilidad Logística</h2>
            <p>Ritual Espacios se compromete a embalar y acondicionar las estructuras de hierro y mobiliario para soportar las exigencias del transporte de carga. Sin embargo, la responsabilidad de la empresa finaliza al momento de entregar la mercadería a la empresa de transporte o comisionista. Cualquier daño, abolladura, raya o pérdida ocasionada durante el traslado deberá ser reclamada por el cliente directamente a la empresa transportista.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-text uppercase tracking-wider mb-4">3. Políticas de Devolución</h2>
            <p>Por tratarse de manufactura pesada y, en muchos casos, productos despachados a medida, no se aceptan devoluciones por "arrepentimiento de compra" una vez que el producto ha salido de la fábrica. Los cambios únicamente se procesarán si se comprueba un defecto de fabricación o soldadura previo al uso, en cuyo caso Ritual Espacios asumirá la reparación o el reemplazo de la pieza defectuosa.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-text uppercase tracking-wider mb-4">4. Propiedad Intelectual</h2>
            <p>Los diseños, fotografías, planos y estética de los productos comercializados bajo la marca Ritual Espacios son propiedad exclusiva de la fábrica. Queda prohibida su reproducción comercial por terceros sin autorización explícita.</p>
          </section>

        </div>
      </div>
    </>
  );
}