import React from 'react';
import { RiUserVoiceLine } from "react-icons/ri";
import { MdDevices } from "react-icons/md";
import { LuHandshake } from "react-icons/lu";
import { FaArrowRight } from "react-icons/fa";

const ContactServices = () => {
  const features = [
    {
      icon: <RiUserVoiceLine className="w-12 h-12 text-black" />,
      title: "MENCIONA A TU NEGOCIO",
      description: "Impulsamos la visibilidad de tu marca a través de menciones estratégicas que llegan a un público relevante y potencialmente interesado en tus servicios."
    },
    {
      icon: <MdDevices className="w-12 h-12 text-black" />,
      title: "FACILIDAD EL ACCESO",
      description: "Tu negocio estará al alcance de todos. Brindamos una plataforma simple y accesible para que los usuarios te encuentren y conecten contigo fácilmente."
    },
    {
      icon: <LuHandshake className="w-12 h-12 text-black" />,
      title: "COMUNICACION CON NUESTROS CLIENTES",
      description: "Creamos puentes entre tu negocio y nuestra comunidad. Facilitamos el contacto directo con clientes reales que buscan soluciones como las que ofreces."
    }
  ];

  return (
    <section className="flex flex-col items-center justify-center bg-[#000000] border-t border-[#141414]">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center justify-between">
        <div className="w-full h-full grid grid-rows-3">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col lg:flex-row text-center lg:text-left items-center gap-4 px-4 sm:px-8 py-8 border-b border-[#141414] pb-8">
              <div className="w-24 h-24 bg-[#D51F2F] rounded-full flex items-center justify-center flex-shrink-0 border-2 border-black">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-[#FFFFFF]/80 uppercase font-bebas text-2xl mb-1">{feature.title}</h3>
                <p className="text-[#FFFFFF]/50 text-md leading-tight font-archivo max-w-[30rem]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full lg:border-l-2 border-[#141414] px-4 sm:px-8 py-8 h-full flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
          <h2 className="text-5xl lg:text-7xl font-semibold text-[#FFFFFF]/80 leading-none uppercase">
            PAUTE<br />CON NOSOTROS
          </h2>
          <p className="text-[#FFFFFF]/50 text-lg mb-8 max-w-lg">
            Convierte tu emprendimiento en grande y llévalo a todas partes del territorio Nacional y además de grandes radioescuchas alrededor del mundo.
          </p>
          <button className="bg-[#D51F2F] text-white font-semibold px-5 py-4 w-44 rounded-lg transition-colors duration-200 flex items-center gap-2">
            Contáctanos
            <FaArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ContactServices; 