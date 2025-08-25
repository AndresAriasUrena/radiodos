'use client';
import Link from 'next/link';
import { Home, ArrowLeft, Radio } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4 text-white">
      <div className="text-center max-w-2xl mx-auto relative">
        {/* Efecto de fondo */}
        <div className="absolute inset-0 bg-[#141414] opacity-5 rounded-3xl filter blur-xl"></div>

        {/* Contenido principal */}
        <div className="relative z-10">
          {/* Número 404 con efecto de radio */}
          <div className="mb-8 relative">
            <h1 className="text-9xl md:text-[12rem] font-bold leading-none">
              <span className="text-white">4</span>
              <span className="relative inline-block">
                <span className="text-[#D51F2F] animate-pulse">0</span>
                <Radio className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-[#D51F2F] opacity-20" />
              </span>
              <span className="text-white">4</span>
            </h1>
          </div>

          {/* Mensaje principal */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-[#D51F2F] bg-clip-text text-transparent">
              Señal no encontrada
            </h2>
            <p className="text-lg text-[#FFFFFF]/60 leading-relaxed">
              Parece que has sintonizado una frecuencia que no existe. 
              Ajustemos la señal para llevarte de vuelta a la programación.
            </p>
          </div>

          {/* Separador con gradiente */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#141414] to-transparent mb-12"></div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="flex items-center gap-2 bg-[#D51F2F] text-white px-6 py-3 rounded-lg hover:bg-[#b71724] transition-all duration-300 w-full sm:w-auto justify-center group"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Volver al inicio
            </Link>
            
            <Link
              href="/news"
              className="flex items-center gap-2 bg-transparent text-white border border-[#141414] px-6 py-3 rounded-lg hover:bg-[#141414] transition-all duration-300 w-full sm:w-auto justify-center group"
            >
              <Radio className="w-5 h-5 group-hover:animate-spin" />
              Ver noticias
            </Link>
          </div>

          {/* Botón de regresar */}
          <div className="mt-8">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-[#FFFFFF]/40 hover:text-[#D51F2F] transition-colors duration-300 mx-auto group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Regresar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 