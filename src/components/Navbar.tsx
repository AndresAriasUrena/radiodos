'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSearch } from '@/lib/SearchContext';
import { usePlayer } from '@/lib/PlayerContext';
import Link from 'next/link';
import { IoRadio, IoAlertCircleOutline, IoTrophyOutline, IoMegaphoneOutline, IoLogoFacebook, IoLogoInstagram, IoLogoTwitter, IoLogoYoutube } from 'react-icons/io5';
import WordPressService from '@/lib/wordpressService';

interface MenuItem {
  key: string;
  href: string;
  isButton?: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const { setSearchTerm } = useSearch();
  const { playRadio } = usePlayer();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [activeLink, setActiveLink] = useState('services');

  const router = useRouter();

  const handleLinkClick = (link: string) => {
    setActiveLink(link);
    setIsMenuOpen(false);
  };

  const menuItems: MenuItem[] = [
    { key: 'inicio', href: '/' },
    { key: 'noticias', href: '/news' },
    { key: 'deportes', href: '/sports' },
    { key: 'podcasts', href: '/podcasts' },
    { key: 'radionovelas', href: '/podcasts#radionovelas' },
    { key: 'contacto', href: '/contact' },
    { key: 'nosotros', href: '/about-us' },
    { key: 'en-vivo', href: '#', isButton: true },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleSearch = (e: React.FormEvent, searchValue: string) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSearchTerm(searchValue.trim());
      setLocalSearchTerm('');
      closeMenu();
      const params = new URLSearchParams();
      params.set('search', searchValue.trim());
      const newURL = `/news?${params.toString()}`;
      if (window.location.pathname === '/news') router.replace(newURL, { scroll: false });
      else router.push(newURL);
    }
  };

  const handleEnVivoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    playRadio();
    closeMenu();
  };

  // Helpers
  const formatColonesFull = (value: any): string => {
    if (value === null || value === undefined) return '—';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value);
    if (!isFinite(num)) return '—';
    return num.toLocaleString('es-CR');
  };

  const parseRsnDateToCR = (text: string): Date | null => {
    if (!text) return null;
    const meses: Record<string, number> = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };
    const m = text.toLowerCase().replace(/\./g, '').match(/(\d{1,2})\s+de\s+([a-zñ]+)\s+del\s+(\d{4}),\s*(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = meses[m[2]] ?? null;
    const year = parseInt(m[3], 10);
    let hour = parseInt(m[4], 10);
    const minute = parseInt(m[5], 10);
    const ampm = m[6];
    if (month === null) return null;
    if (ampm === 'pm' && hour !== 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    const iso = `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00-06:00`;
    return new Date(iso);
  };

  const isWithinLastHoursCR = (date: Date, hours: number): boolean => {
    const now = new Date();
    const nowCR = new Date(now.toISOString().replace('Z', '-06:00'));
    const diff = nowCR.getTime() - date.getTime();
    return diff >= 0 && diff <= hours * 3600 * 1000;
  };

  const getCRDay = (): number => {
    const now = new Date();
    const cr = new Date(now.getTime() - 6 * 3600 * 1000);
    return cr.getDay(); // 0=Dom..6=Sab
  };

  const formatNowCR = (): string => {
    const now = new Date();
    const cr = new Date(now.getTime() - 6 * 3600 * 1000);
    const dia = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long' }).format(cr);
    const horas = cr.getUTCHours();
    const minutos = cr.getUTCMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'pm' : 'am';
    const h12 = ((horas + 11) % 12) + 1;
    return `${dia.charAt(0).toUpperCase() + dia.slice(1)} | ${h12}:${minutos}${ampm}`;
  };

  // Data state
  const [latestPost, setLatestPost] = useState<{ title: string; slug: string } | null>(null);
  const [quakeAlert, setQuakeAlert] = useState<{ text: string } | null>(null);
  const [lottery, setLottery] = useState<{ kind: 'chances' | 'loteria'; numero: string; serie: string; premio: any } | null>(null);

  useEffect(() => {
    const fetchLatestPost = async () => {
      try {
        const result = await WordPressService.getPosts({ page: 1, perPage: 1, orderBy: 'date' });
        const post = result.posts?.[0];
        if (post) setLatestPost({ title: WordPressService.cleanHtml(post.title.rendered), slug: post.slug });
      } catch { }
    };

    const fetchQuakeAlert = async () => {
      try {
        const response = await fetch('/api/earthquakes');
        if (response.ok) {
          const data = await response.json();
          if (data.quakes && data.quakes.length > 0) {
            const latestQuake = data.quakes[0];
            const quakeDate = parseRsnDateToCR(latestQuake.date);
            if (quakeDate) {
              const now = new Date();
              const diffHours = (now.getTime() - quakeDate.getTime()) / (1000 * 60 * 60);
              
              if (diffHours <= 5) {
                setQuakeAlert({
                  text: `${latestQuake.title} | ${latestQuake.date}`
                });
              }
            }
          }
        }
      } catch { }
    };

    const fetchLotteryAlert = async () => {
      try {
        const crDay = getCRDay();
        
        if (crDay === 2 || crDay === 5) {
          const response = await fetch('/api/jps/chances/last');
          if (response.ok) {
            const data = await response.json();
            if (data.premios && data.premios.length > 0) {
              const p = data.premios.find((it: any) => it.tipo === 1);
              if (p) {
                setLottery({ kind: 'chances', numero: String(p.numero), serie: String(p.serie), premio: p.premio });
              }
            }
          }
        } else if (crDay === 0) {
          const response = await fetch('/api/jps/loteria/last');
          if (response.ok) {
            const data = await response.json();
            if (data.premios && data.premios.length > 0) {
              const p = data.premios.find((it: any) => it.tipo === 1);
              if (p) {
                setLottery({ kind: 'loteria', numero: String(p.numero), serie: String(p.serie), premio: p.premio });
              } else {
                const firstPrize = data.premios[0];
                if (firstPrize) {
                  setLottery({ kind: 'loteria', numero: String(firstPrize.numero), serie: String(firstPrize.serie), premio: firstPrize.premio });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener lotería:', error);
      }
    };

    fetchLatestPost();
    fetchQuakeAlert();
    fetchLotteryAlert();
  }, []);

  return (
    <>
      {/* Barra superior: fecha/hora y titular */}
      <div className="mx-2 mt-2">
        <div className="w-full mx-auto rounded-xl bg-[#1E305F] text-white px-3 sm:px-4 py-2 text-[10px] sm:text-xs flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2">
          <div className="whitespace-nowrap">{formatNowCR()}</div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-center justify-center w-full sm:w-auto">
            <IoMegaphoneOutline className="w-4 h-4" />
            <span className="uppercase opacity-80 whitespace-nowrap">Noticias de última hora</span>
            <span className="truncate max-w-full sm:max-w-[60vw]">
              {latestPost ? (
                <Link href={`/news/${latestPost.slug}`} className="hover:underline">{latestPost.title}</Link>
              ) : '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-center justify-center w-full sm:w-auto hidden sm:flex">
            <a href="https://www.instagram.com/noticiascolumbia/?hl=es" target="_blank" rel="noopener noreferrer" className="hover:text-[#1E305F] transition-colors">            <IoLogoInstagram className="w-4 h-4" />
            </a>
            <a href="https://www.youtube.com/channel/UCo2Fr8GUPmevyi7uih-0oTg/featured?view_as=subscriber" target="_blank" rel="noopener noreferrer" className="hover:text-[#1E305F] transition-colors">
              <IoLogoYoutube className="w-4 h-4" />
            </a>
            <a href="https://www.facebook.com/NoticiasColumbia/?locale2=pt_PT&_rdr" target="_blank" rel="noopener noreferrer" className="hover:text-[#1E305F] transition-colors">
              <IoLogoFacebook className="w-4 h-4" />
            </a>
            <a href="https://www.facebook.com/ColumbiaDigitalcr/?locale=es_LA" target="_blank" rel="noopener noreferrer" className="hover:text-[#1E305F] transition-colors">
              <IoLogoFacebook className="w-4 h-4" />
            </a>
            <a href="https://x.com/webcolumbia?lang=es" target="_blank" rel="noopener noreferrer" className="hover:text-[#1E305F] transition-colors">
              <IoLogoTwitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <nav className="flex items-center px-4 sm:px-6 py-4 bg-[#F8FBFF] mx-2 my-4 rounded-2xl">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/assets/LogoColumbia.svg" alt="Columbia" width={120} height={80} className='mr-5 h-20 w-20 md:h-[60px] md:w-[120px]' />
          </div>

          <div className="hidden lg:flex items-center space-x-6">
            {menuItems.map((item) => {
              if (item.isButton) {
                return (
                  <button
                    key={item.key}
                    onClick={handleEnVivoClick}
                    className="text-[#2F3037] hover:text-[#D51F2F] transition-colors rounded-full flex items-center gap-2"
                  >
                    <div className='bg-[#D51F2F] rounded-full p-1' />
                    {item.key.charAt(0).toUpperCase() + item.key.slice(1).replace('-', ' ')}
                  </button>
                );
              }
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => handleLinkClick(item.key)}
                  className={`text-[#2F3037] hover:text-[#D51F2F] transition-colors rounded-full ${pathname === item.href ? 'text-[#D51F2F] font-semibold' : ''}`}
                >
                  {item.key.charAt(0).toUpperCase() + item.key.slice(1)}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:block relative">
            <form onSubmit={(e) => handleSearch(e, localSearchTerm)}>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-[#000000]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="¿Qué estás buscando hoy?"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="border border-[#000000]/30 bg-transparent text-black rounded-md pl-10 pr-4 py-1.5 text-sm w-64 focus:outline-none placeholder-[#000000]/20"
                />
              </div>
            </form>
          </div>

          <div className="lg:hidden">
            <button onClick={toggleMenu} className="text-[#2F3037] hover:text-[#D51F2F] transition-colors p-2" aria-label="Abrir menú">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Barras informativas bajo el navbar */}
      <div className="mx-2">
        <div className="w-full mx-auto space-y-2 mb-5">
          {quakeAlert && (
            <div className="rounded-xl bg-[#D51F2F] text-white py-2 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-sm">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-center">
                <IoAlertCircleOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="uppercase tracking-wide">Alerta de sismo</span>
                <span className="opacity-90 break-words">{quakeAlert.text}</span>
              </div>
            </div>
          )}

          {lottery && (
            <div className="rounded-xl bg-[#01A299] text-white py-2 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-sm">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-center">
                <IoTrophyOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="uppercase tracking-wide">Ganador</span>
                <span className="opacity-90 break-words">1er Lugar - {lottery.numero} | serie {lottery.serie} | {formatColonesFull(lottery.premio)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={closeMenu} />
      )}

      <div className={`fixed top-0 right-0 h-full w-80 bg-[#F8FBFF] shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-[#D4D5DD]">
            <div className="flex items-center justify-between">
              <img src="/assets/LogoColumbia.svg" alt="Columbia" width={80} height={60} />
              <button onClick={closeMenu} className="text-[#2F3037] hover:text-[#D51F2F] transition-colors p-2" aria-label="Cerrar menú">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 border-b border-[#D4D5DD]">
            <div className="relative">
              <form onSubmit={(e) => handleSearch(e, localSearchTerm)}>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-[#000000]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="¿Qué estás buscando hoy?"
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="w-full bg-transparent border border-[#000000]/30 text-black rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none placeholder-[#000000]/20"
                  />
                </div>
              </form>
            </div>
          </div>

          <div className="flex-1 py-6">
            <nav className="space-y-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                if (item.isButton) {
                  return (
                    <button key={item.key} onClick={handleEnVivoClick} className="flex items-center px-6 py-3 text-lg transition-colors text-[#2F3037] font-medium w-full text-left hover:text-[#D51F2F]">
                      <IoRadio className="w-5 h-5 mr-2 text-[#D51F2F]" />
                      {item.key.charAt(0).toUpperCase() + item.key.slice(1).replace('-', ' ')}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => { handleLinkClick(item.key); closeMenu(); }}
                    className={`flex items-center px-6 text-lg transition-colors ${isActive ? 'text-[#D51F2F] font-semibold' : 'text-[#2F3037] hover:text-[#D51F2F]'}`}
                  >
                    {item.key.charAt(0).toUpperCase() + item.key.slice(1)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
} 