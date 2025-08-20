import React from 'react';
import Link from 'next/link';
import { usePlayer } from '@/lib/PlayerContext';

const Hero = () => {
  const { playRadio } = usePlayer();

  return (
    <section className="flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:py-16 bg-[#F8FBFF] mx-2 my-4 rounded-2xl">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <img
            src="/assets/about-us/Mission.avif"
            alt="Banda tocando en vivo"
            className="rounded-xl w-full h-[280px] sm:h-[340px] lg:h-[440px] object-cover shadow-lg"
          />
        </div>
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#000000] leading-tight mb-4 lg:mb-6">
            Líderes <br className="hidden sm:block" />
            en contenido,<br className="hidden sm:block" />
            deportivo y nacional
          </h2>
          <p className="text-sm md:text-md leading-none text-[#000000]/60 mb-6 lg:mb-8 max-w-xl">
            Fundada en 1947, ‘La Mundialista’ es la radio número uno en deportes
            en el país. También destaca por la generación de reportajes exclusivos, programas de opinión de corte político y un noticiero que abarca la información más relevante para la ciudadanía. Somos un grupo de
            medios de comunicación líder, con la experiencia y el alcance de los
            medios tradicionales combinados con la transformación digital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={playRadio} className="bg-[#1E305F] text-[#F8FBFF] px-6 py-2.5 sm:px-8 sm:py-3 rounded-md font-medium text-sm sm:text-base hover:scale-105 transition-all duration-300">
            Escuchar ahora
          </button>
          <Link href="/news" className="border border-[#D4D5DD] text-[#696A78] px-6 py-2.5 sm:px-8 sm:py-3 rounded-md font-medium text-sm sm:text-base hover:scale-105 transition-all duration-300">
            Ver noticias
          </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 