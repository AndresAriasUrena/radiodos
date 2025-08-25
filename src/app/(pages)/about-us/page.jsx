'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/about-us/Hero';
import CategoryNewsGrid from '@/components/home/CategoryNewsGrid';

export default function AboutUs() {
  useEffect(() => {
    document.title = 'Sobre Nosotros | Radio2 - Conoce Nuestra Historia';
    
          const description = 'Conoce la historia de Radio2, tu estación de radio costarricense. Descubre nuestra misión, valores y el equipo que hace posible la mejor música y noticias de Costa Rica las 24 horas.';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = description;
      document.head.appendChild(metaDescription);
    }
    
          const keywords = 'radio2 historia, sobre nosotros, equipo radio, misión radio costa rica, valores radio2';
    
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      metaKeywords.content = keywords;
      document.head.appendChild(metaKeywords);
    }
  }, []);

  return (
    <>
      <div className="min-h-screen  ">
        <Navbar />
        <Hero />
        <CategoryNewsGrid
              title="Noticias"
            />
      </div>
      <Footer />
    </>
  );
}
