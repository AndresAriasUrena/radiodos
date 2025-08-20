import React from 'react';

const Radios = () => {
    const emisoras = [
        {
            id: 1,
            logo: "/assets/LogoRadio2.svg",
            nombre: "Radio 2",
        },
        {
            id: 2,
            logo: "/assets/LogoColumbia.svg",
            nombre: "Columbia",
        },
        {
            id: 3,
            logo: "/assets/LogoColumbiaEstereo.svg",
            nombre: "Columbia Estéreo",
        },
        {
            id: 4,
            logo: "/assets/LogoColumbiaNoticias.svg",
            nombre: "Columbia Noticias",
        },
        {
            id: 5,
            logo: "/assets/LogoAmplify.svg",
            nombre: "Amplify",
        },
        {
            id: 6,
            logo: "/assets/LogoColumbiaDeportes.svg",
            nombre: "Columbia Deportes",
        },
        {
            id: 7,
            logo: "/assets/LogoGrupoColumbia.svg",
            nombre: "Grupo Columbia",
        }
    ];

    return (
        <div className="px-4 sm:px-6 py-8 sm:py-12 lg:py-16 mx-2 my-4 rounded-2xl">
            <div className="w-full max-w-7xl mx-auto relative">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-16 w-full">
                    <div className="flex-1 items-center justify-center text-center max-w-md mx-auto">
                        <span className="inline-block px-4 py-2 rounded-full border border-[#D51F2F] text-[#D51F2F] text-xs font-medium">
                            NUESTRAS EMISORAS
                        </span>
                        <h2 className="text-xl md:text-[2.1rem] leading-none font-semibold text-[#000000] my-4">
                            Somos más que solo noticias, somos el futuro de la radio
                        </h2>
                        <div className="mb-6 text-[#000000]/60 text-sm md:text-md leading-none max-w-[26rem] mx-auto">
                            Conoce más sobre nuestras emisoras y descubre otras radios que complementan esta experiencia con contenidos únicos, música variada y propuestas que te inspiran cada día.
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-6 mt-12 justify-center">
                    {emisoras.map((emisora) => (
                        <div 
                            key={emisora.id}
                            className="bg-white rounded-xl px-14 py-3 hover:shadow-xl transition-all duration-300 hover:scale-105 w-full md:w-auto"
                        >
                            <div className="flex flex-col items-center text-center">
                                <img 
                                    src={emisora.logo} 
                                    alt={`Logo ${emisora.nombre}`} 
                                    className="w-40 h-32 md:w-32 md:h-32 object-contain"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Radios; 