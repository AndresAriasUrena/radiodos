import React from 'react';
import Link from 'next/link';
import { usePlayer } from '@/lib/PlayerContext';

const Hero = () => {
  const { playRadio } = usePlayer();

  return (
    <section className="flex flex-col items-center justify-center bg-[#000000] border-t border-b border-[#141414]">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between">
        <div className="w-full lg:w-[60%] flex flex-col items-center lg:items-start text-center lg:text-left mb-8 lg:mb-0 px-4 sm:px-8 py-8">
          <div className="w-full h-[280px] sm:h-[340px] lg:h-[440px] bg-[#FFFFFF]/5 rounded-xl mb-6 lg:mb-0"></div>
        </div>

        <div className="w-full lg:w-[40%] flex flex-col items-center lg:items-start text-center lg:text-left mb-8 lg:mb-0 px-4 sm:px-8 py-8">
          <h2 className="text-5xl font-semibold text-[#FFFFFF]/80 leading-none uppercase mb-6">
            SOMOS PIONEROS DE <br /> LA RADIO COSTARRICENSE
          </h2>
          <p className="text-[#FFFFFF]/50 text-md mb-8 max-w-lg">
            Con <span className='text-[#FFFFFF]/70 font-semibold'>más de 30 años de historia en la radio</span> costarricense, sintonizar Radio Dos es sumergirse en una experiencia musical única, donde encontrarás los éxitos más grandes desde el inicio del Rock and Roll hasta el presente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full items-center lg:items-start">
            <button
              onClick={playRadio}
              className="bg-[#D51F2F] border border-[#D51F2F] text-white px-4 py-2 rounded-md font-medium text-base sm:text-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              Escuchar ahora
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <Link
              href="/news"
              className="hover:border-[#D92A34] hover:text-[#FFFFFF]/80 text-[#FFFFFF]/60 bg-[#FFFFFF]/5 border border-[#FFFFFF]/15 rounded-md px-4 py-2 hover:bg-[#D92A34] font-medium text-base sm:text-lg flex items-center transition-all duration-300"
            >
              Ver noticias
            </Link>
          </div>
        </div>
      </div>

      <div className='w-full h-[2px] bg-[#141414]'/>

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between">
        <div className="w-full lg:w-[40%] flex flex-col items-center lg:items-start text-center lg:text-left mb-8 lg:mb-0 px-4 sm:px-8 py-8 order-2 lg:order-1">
          <h2 className="text-5xl font-semibold text-[#FFFFFF]/80 leading-none uppercase mb-6">
            LAS VOCES<br />ICÓNICAS DE LA RADIO
          </h2>
          <p className="text-[#FFFFFF]/50 text-md mb-8 max-w-lg">
            Miguel, Stella, Sammy, Danilo y Mr. Rasta nos acompañan en diferentes momentos del día con su especial matiz musical.
            Sintonizá <span className='text-[#FFFFFF]/70 font-semibold'>99.5 FM Radio Dos</span> y unite a nosotros en esta celebración de la música y la historia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full items-center lg:items-start">
            <Link
              href="/shows"
              className="bg-[#D51F2F] text-white px-4 py-2 rounded-md font-medium text-base sm:text-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              Ver shows
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-[60%] flex flex-col items-center lg:items-start text-center lg:text-left mb-8 lg:mb-0 px-4 sm:px-8 py-8 order-1 lg:order-2">
          <div className="w-full h-[280px] sm:h-[340px] lg:h-[440px] bg-[#FFFFFF]/5 rounded-xl mb-6 lg:mb-0"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 