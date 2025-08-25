'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactForm from '@/components/contact/ContactForm';
import ContactServices from '@/components/contact/ContactServices';

export default function Contact() {
  useEffect(() => {
    document.title = 'Contacto | Radio2 - Ponte en Contacto con Nosotros';
    
          const description = 'Contáctanos en Radio2. Envíanos tus comentarios, sugerencias o consultas. Estamos aquí para atenderte y mejorar tu experiencia en nuestra radio costarricense.';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = description;
      document.head.appendChild(metaDescription);
    }
    
          const keywords = 'radio2 contacto, formulario contacto, comunicarse radio2, sugerencias radio, consultas radio costa rica';
    
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
      <div className="min-h-screen">
        <Navbar />
        <ContactForm />
        <ContactServices />
      </div>
      <Footer />
    </>
  );
}
