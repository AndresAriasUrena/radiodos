'use client';
import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FBFF] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Número 404 grande */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold text-[#1E305F] leading-none">
            4
            <span className="text-[#D51F2F]">0</span>
            4
          </h1>
        </div>

        {/* Mensaje principal */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1B1B1B] mb-4">
            Página no encontrada
          </h2>
          <p className="text-lg text-[#64748B] leading-relaxed">
            Lo sentimos, la página que buscas no existe o ha sido movida. 
            Puede que el enlace esté roto o que hayas escrito mal la URL.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="flex items-center gap-2 bg-[#1E305F] text-white px-6 py-3 rounded-lg hover:bg-[#D51F2F] transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Home className="w-5 h-5" />
            Ir al inicio
          </Link>
          
          <Link
            href="/news"
            className="flex items-center gap-2 bg-white text-[#1E305F] border-2 border-[#1E305F] px-6 py-3 rounded-lg hover:bg-[#1E305F] hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Search className="w-5 h-5" />
            Ver noticias
          </Link>
        </div>

        {/* Botón de regresar */}
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[#64748B] hover:text-[#1E305F] transition-colors duration-300 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Regresar a la página anterior</span>
          </button>
        </div>
      </div>
    </div>
  );
} 