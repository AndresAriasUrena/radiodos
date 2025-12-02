'use client';
import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';

const ContactForm = () => {
  const formRef = useRef();
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_phone: '',
    message: '',
    station_name: 'Radio Dos'
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus({ type: '', message: '' });

    try {
      await emailjs.sendForm(
        'template_xncpj4k',
        'service_ba3ue64',
        formRef.current,
        'MFxAFrK4GqfW_l4gZ'
      );

      setStatus({
        type: 'success',
        message: '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.'
      });

      setFormData({
        user_name: '',
        user_email: '',
        user_phone: '',
        message: '',
        station_name: 'Radio Dos'
      });
    } catch (error) {
      console.error('Error:', error);
      setStatus({
        type: 'error',
        message: 'Hubo un error al enviar el mensaje. Por favor intenta de nuevo.'
      });
    } finally {
      setSending(false);
    }
  };

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
        <div className="w-full lg:border-l-2 border-[#141414] px-6 py-4 lg:py-12">
          <form ref={formRef} onSubmit={handleSubmit} className="w-full space-y-6">
            <input type="hidden" name="station_name" value={formData.station_name} />

            <div>
              <label htmlFor="user_name" className="block text-[#FFFFFF]/80 text-sm mb-2">
                Nombre
              </label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                placeholder="Ej. John Doe"
                required
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#DF4B54] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="user_email" className="block text-[#FFFFFF]/80 text-sm mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                id="user_email"
                name="user_email"
                value={formData.user_email}
                onChange={handleChange}
                placeholder="Ej. john.doe@example.com"
                required
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#DF4B54] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="user_phone" className="block text-[#FFFFFF]/80 text-sm mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="user_phone"
                name="user_phone"
                value={formData.user_phone}
                onChange={handleChange}
                placeholder="Ej. 5555-5555"
                required
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#DF4B54] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-[#FFFFFF]/80 text-sm mb-2">
                Mensaje
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Escribe tu mensaje aquí..."
                required
                rows="5"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#DF4B54] transition-colors resize-none"
              />
            </div>

            {status.message && (
              <div className={`p-4 rounded-lg ${
                status.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-500'
                  : 'bg-red-500/10 border border-[#D51F2F] text-[#D51F2F]'
              }`}>
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-[#D51F2F] hover:bg-[#c9434c] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
