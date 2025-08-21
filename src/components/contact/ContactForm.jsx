import React from 'react';

const ContactForm = () => {
  return (
    <section className="flex flex-col items-center justify-center bg-[#000000] border-t border-b border-[#141414]">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center justify-between">
        <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-left mb-8 lg:mb-0 px-4 sm:px-8 py-8">
          <h2 className="text-5xl lg:text-7xl font-semibold text-[#FFFFFF]/80 leading-none uppercase">
            Ponte<br />en contacto<br />con nosotros
          </h2>
          <p className="text-[#FFFFFF]/60 text-lg my-6 max-w-lg">
            Puede comunicarse con nosotros por los diferentes medios disponibles. También puedes llenar el formulario y pronto un asesor se comunicará con tu petición.
          </p>
          <div className="flex flex-col lg:flex-row gap-4 w-full items-center lg:items-start">
            <div className="text-center lg:text-left">
              <p className="font-semibold text-[#FFFFFF]/80 mb-1">Centro de llamadas</p>
              <p className="text-[#FFFFFF]/50 text-md">Comunícate en el horario de<br />
                <a href="tel:+50622240707" className="text-[#DF4B54] hover:underline font-bold">
                  (506+) 2224 - 0707
                </a>
              </p>
            </div>
            <div className="text-center lg:text-left">
              <p className="font-semibold text-[#FFFFFF]/80 mb-1">Correo electrónico</p>
              <p className="text-[#FFFFFF]/50 text-md">Correo especializado:<br />
                <a href="mailto:ventas@grupocolumbia.co.cr" className="text-[#DF4B54] hover:underline font-bold">
                  ventas@grupocolumbia.co.cr
                </a>
              </p>
            </div>
          </div>
        </div>
        <div className="w-full lg:border-l-2 border-[#141414] px-4 py-4 lg:py-12 overflow-hidden">
          <script src="https://static.elfsight.com/platform/platform.js" async></script>
          <div className="elfsight-app-bfe684e8-5909-480e-a7c1-ec995daafc23" data-elfsight-app-lazy></div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm; 