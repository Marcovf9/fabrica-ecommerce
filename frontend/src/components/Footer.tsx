import { Mail, MapPin } from 'lucide-react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-brand-panel border-t border-brand-border mt-auto">
      <div className="max-w-[1600px] w-[95%] mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Identidad de Marca */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-light text-brand-text uppercase tracking-widest">
              Ritual <span className="font-bold text-brand-primary">Espacios</span>
            </h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              Diseño y fabricación de mobiliario exterior y parrillas pesadas. Estructuras forjadas en hierro y materiales sustentables, construidas para perdurar.
            </p>
            <div className="flex items-center gap-2 text-brand-muted mt-2">
              <MapPin size={16} className="text-brand-primary" />
              <span className="text-sm">Córdoba, Argentina</span>
            </div>
          </div>

          {/* Enlaces Operativos */}
          <div className="flex flex-col gap-3 lg:items-center">
            <h3 className="text-brand-text font-bold uppercase tracking-wider mb-2">Plataforma</h3>
            <Link to="/" className="text-brand-muted hover:text-brand-primary transition-colors text-sm">Catálogo Activo</Link>
            <Link to="/tracking" className="text-brand-muted hover:text-brand-primary transition-colors text-sm">Rastrear Pedido</Link>
            <Link to="/admin" className="text-brand-muted hover:text-brand-primary transition-colors text-sm">Acceso Administrativo</Link>
          </div>

          {/* Soporte y Legal (Añadido) */}
          <div className="flex flex-col gap-3 lg:items-center">
            <h3 className="text-brand-text font-bold uppercase tracking-wider mb-2">Soporte y Legal</h3>
            <Link to="/faq" className="text-brand-muted hover:text-brand-primary transition-colors text-sm">Preguntas Frecuentes</Link>
            <Link to="/terminos" className="text-brand-muted hover:text-brand-primary transition-colors text-sm">Términos y Condiciones</Link>
            <Link to="/terminos" className="text-brand-muted hover:text-brand-primary transition-colors text-sm">Envíos y Garantías</Link>
          </div>

          {/* Contacto Directo */}
          <div className="flex flex-col gap-4 lg:items-end">
            <h3 className="text-brand-text font-bold uppercase tracking-wider mb-2">Contacto Directo</h3>
            <div className="flex gap-4">
              <a 
                href="https://wa.me/5493517150510" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center text-brand-muted hover:text-[#25D366] hover:border-[#25D366] transition-all duration-300"
                title="WhatsApp Oficial"
              >
                <FaWhatsapp size={20} />
              </a>
              <a 
                href="https://instagram.com/ritual.espacios" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center text-brand-muted hover:text-[#E1306C] hover:border-[#E1306C] transition-all duration-300"
                title="Instagram Oficial"
              >
                <FaInstagram size={20} />
              </a>
              <a 
                href="mailto:ritualparrillas@gmail.com" 
                className="w-10 h-10 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all duration-300"
                title="Correo Electrónico"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

        </div>
        
        <div className="border-t border-brand-border mt-10 pt-6 text-center">
          <p className="text-brand-muted text-xs uppercase tracking-widest">
            © {new Date().getFullYear()} Ritual Espacios. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}