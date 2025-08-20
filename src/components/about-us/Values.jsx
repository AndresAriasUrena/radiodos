import React from 'react';

const Values = () => {
  return (
    <section className="flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:py-16 bg-[#F8FBFF] mx-2 my-4 rounded-2xl">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center justify-between gap-6 lg:gap-12">
      <div className="w-full flex items-center justify-center">
          <img
            src="/assets/about-us/Mission.avif"
            alt="Banda tocando en vivo"
            className="rounded-xl w-full h-[280px] sm:h-[460px] object-cover shadow-lg"
          />
        </div>

        <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
          
          <div className="w-full">
            <div className="flex flex-col items-center lg:items-start">
              <span className="inline-block px-4 py-2 rounded-full border border-[#01A299] text-[#01A299] text-xs font-medium">
                EXPERIENCIA
              </span>
              <p className="text-lg md:text-xl leading-none font-medium text-[#000000] max-w-xl my-4">
                Nos respaldan más de 50 años de experiencia comunicando con{' '}
                <span className="text-[#01A299] font-semibold">transparencia</span> y <span className="text-[#01A299] font-semibold">solidez</span>.
              </p>
            </div>
            <div className="w-full h-px bg-gray-200"></div>
          </div>


          <div className="w-full">
            <div className="flex flex-col items-center lg:items-start">
              <span className="inline-block px-4 py-2 rounded-full border border-[#01A299] text-[#01A299] text-xs font-medium">
                CONFIANZA
              </span>
              <p className="text-lg md:text-xl leading-none font-medium text-[#000000] max-w-xl my-4">
                Grupo Columbia, uno de los medios de comunicación de mayor alcance y reconocimiento a nivel{' '}
                <span className="text-[#01A299] font-semibold">nacional</span> e <span className="text-[#01A299] font-semibold">internacional</span>.
              </p>
            </div>
            <div className="w-full h-px bg-gray-200"></div>
          </div>

          <div className="w-full">
            <div className="flex flex-col items-center lg:items-start">
              <span className="inline-block px-4 py-2 rounded-full border border-[#01A299] text-[#01A299] text-xs font-medium">
                INNOVACIÓN
              </span>
              <p className="text-lg md:text-xl leading-none font-medium text-[#000000] max-w-xl my-4">
                Los métodos han cambiado. Los resultados siguen siendo los mismos. Somos creadores de tendencias. Somos innovadores.{' '}
                <span className="text-[#01A299] font-semibold">Somos el Grupo Columbia Radio</span>.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Values; 