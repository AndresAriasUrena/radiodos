'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSearch } from '@/lib/SearchContext';
import { usePlayer } from '@/lib/PlayerContext';
import Link from 'next/link';
import { IoRadio } from 'react-icons/io5';

interface NavLink {
  href: string;
  label: string;
}

interface MenuItem {
  key: string;
  href: string;
  isButton?: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const { searchTerm, setSearchTerm } = useSearch();
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
    { key: 'Quienes somos', href: '/about-us' },
    { key: 'Noticias', href: '/news' },
    { key: 'Contacto', href: '/contact' },
    { key: 'En vivo', href: '#', isButton: true },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent, searchValue: string) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSearchTerm(searchValue.trim());
      setLocalSearchTerm('');
      closeMenu();

      const params = new URLSearchParams();
      params.set('search', searchValue.trim());
      const newURL = `/news?${params.toString()}`;

      if (window.location.pathname === '/news') {
        router.replace(newURL, { scroll: false });
      } else {
        router.push(newURL);
      }
    }
  };

  const handleSearchInputChange = (value: string) => {
    setLocalSearchTerm(value);
  };

  const handleEnVivoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    playRadio();
    closeMenu();
  };

  return (
    <>
      <nav className="w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <img src="/assets/LogoRadio2.svg" alt="Radio 2" className='mr-5 h-20 w-18'/>

          <div className="hidden lg:flex items-center space-x-6">
            {menuItems.map((item) => {
              if (item.isButton) {
                return (
                  <button
                    key={item.key}
                    onClick={handleEnVivoClick}
                    className="text-[#D92A34] hover:text-[#D92A34]/80 transition-colors flex items-center font-medium font-archivo"
                  >
                    <span className="w-2 h-2 bg-[#D92A34] rounded-full mr-2 animate-pulse"></span>
                    {item.key.charAt(0).toUpperCase() + item.key.slice(1).replace('-', ' ')}
                  </button>
                );
              }
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => handleLinkClick(item.key)}
                  className={`text-[#FFFFFF]/60 hover:text-[#D92A34] transition-colors font-medium font-archivo  ${
                    pathname === item.href ? 'text-[#D92A34]' : ''
                  }`}
                >
                  {item.key.charAt(0).toUpperCase() + item.key.slice(1)}
                </Link>
              );
            })}
          </div>
          </div>


          <div className="hidden lg:block relative">
            <form onSubmit={(e) => handleSearch(e, localSearchTerm)}>
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-[#FFFFFF]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar"
                  value={localSearchTerm}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  className="bg-transparent text-white pr-10 py-1.5 focus:border-b focus:border-[#D92A34] text-sm w-44 focus:outline-none placeholder-[#FFFFFF]/40 placeholder:font-semibold transition-colors duration-700"
                />
              </div>
            </form>
          </div>

          {/* Mobile Hamburger Button - Only visible on mobile */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-[#FFFFFF]/60 hover:text-[#D92A34] transition-colors p-2"
              aria-label="Abrir menú"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-80 bg-[#000000] border-l border-[#141414] shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-[#141414]">
            <div className="flex items-center justify-between">
              <img src="/assets/LogoRadio2.svg" alt="Radio 2" className="h-20 w-18" />
              <button
                onClick={closeMenu}
                className="text-[#FFFFFF]/60 hover:text-[#D92A34] transition-colors p-2"
                aria-label="Cerrar menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="relative">
              <form onSubmit={(e) => handleSearch(e, localSearchTerm)}>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-[#FFFFFF]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar"
                    value={localSearchTerm}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    className="w-full bg-transparent text-white pr-10 py-1.5 focus:border-b focus:border-[#D92A34] text-sm focus:outline-none placeholder-[#FFFFFF]/40 placeholder:font-semibold transition-colors duration-700"
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
                    <button
                      key={item.key}
                      onClick={handleEnVivoClick}
                      className="flex items-center px-6 py-3 text-lg transition-colors text-[#D92A34] hover:text-[#D92A34]/80 font-medium font-archivo w-full text-left"
                    >
                      <span className="w-3 h-3 bg-[#D92A34] rounded-full mr-3 animate-pulse"></span>
                      {item.key.charAt(0).toUpperCase() + item.key.slice(1).replace('-', ' ')}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => {
                      handleLinkClick(item.key);
                      closeMenu();
                    }}
                    className={`flex items-center px-6 py-3 text-lg transition-colors font-medium font-archivo ${
                      isActive
                        ? 'text-[#D92A34]'
                        : 'text-[#FFFFFF]/60 hover:text-[#D92A34]'
                    }`}
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