import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="text-[#9A9A9A] sm:py-12 lg:py-16 border-t-2 border-[#141414]">
            <div className="container mx-auto max-w-7xl px-4 sm:px-8 py-8 w-full">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start mb-12">
                    <div className="mb-8 md:mb-0 max-w-xs mx-auto lg:mx-0 text-center lg:text-left flex flex-col items-center lg:items-start">
                        <img src="/assets/LogoRadio2.svg" alt="Columbia" className="w-28 mb-3" />
                        <p className="text-lg leading-tight text-[#FFFFFF]/80 mb-3">
                        La evolución de la radio en Costa Rica. Música, cultura y comunidad que te inspiran.
                        </p>
                        <p className="text-sm text-[#FFFFFF]/50"> © Todos los derechos reservados. 2025 Radio 2 </p >
                    </div>

                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 text-center lg:text-left mx-auto lg:mx-0">
                        <div>
                            <h5 className="text-xl mb-3 flex items-center justify-center lg:justify-start text-[#FFFFFF]/80 font-semibold">
                                INFORMACIÓN
                            </h5>
                            <ul className="space-y-3 text-sm text-[#FFFFFF]/60">
                                <li><Link href="/about-us" className="hover:text-[#DF4B54] transition-colors">Sobre Nosotros</Link></li>
                                <li><Link href="/shows" className="hover:text-[#DF4B54] transition-colors">Shows</Link></li>
                                <li><Link href="/live" className="hover:text-[#DF4B54] transition-colors">En Vivo</Link></li>
                            </ul>
                        </div>

                       <div>
                            <h5 className="text-xl mb-3 flex items-center justify-center lg:justify-start text-[#FFFFFF]/80 font-semibold">
                                REDES SOCIALES
                            </h5>
                            <ul className="space-y-3 text-sm text-[#FFFFFF]/60">
                                <li><a href="https://www.instagram.com/noticiascolumbia/?hl=es" target="_blank" rel="noopener noreferrer" className="hover:text-[#DF4B54] transition-colors">Instagram</a></li>
                                <li><a href="https://www.facebook.com/NoticiasColumbia/?locale2=pt_PT&_rdr" target="_blank" rel="noopener noreferrer" className="hover:text-[#DF4B54] transition-colors">Facebook</a></li>
                                <li><a href="https://x.com/webcolumbia?lang=es" target="_blank" rel="noopener noreferrer" className="hover:text-[#DF4B54] transition-colors">Twitter (X)</a></li>
                            </ul>
                        </div>

                        <div>
                            <h5 className="text-xl mb-3 flex items-center justify-center lg:justify-start text-[#FFFFFF]/80 font-semibold">
                                CONTACTO
                            </h5>
                            <ul className="space-y-3 text-sm text-[#FFFFFF]/80 font-semibold">
                                <li className='flex flex-col'>Teléfono: <a href="tel:+50622240707" className="font-normal hover:text-[#DF4B54] transition-colors text-[#FFFFFF]/60">2224-0707 (8am - 5pm)</a></li>
                                <li className='flex flex-col'>Correo: <a href="mailto:ventas@grupocolumbia.co.cr" className="font-medium text-[#DF4B54]">ventas@grupocolumbia.co.cr</a></li>
                                <li className='flex flex-col font-normal'><Link href="/contact" className="hover:text-[#DF4B54] transition-colors text-[#FFFFFF]/60">Formulario</Link></li>
                            </ul>       
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
