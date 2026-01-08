'use client';

import { useEffect } from 'react';

export default function WordPressLinkPreview() {
  useEffect(() => {
    // Esperar un poco para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      // Buscar todos los bloques de preview de links
      const linkPreviews = document.querySelectorAll('.wp-block-visual-link-preview-link');

      console.log('Found link previews:', linkPreviews.length);

      linkPreviews.forEach((preview, index) => {
        const previewEl = preview as HTMLElement;
        console.log(`Processing preview ${index}:`, previewEl);
        console.log(`Preview ${index} classes:`, previewEl.className);
        console.log(`Preview ${index} innerHTML sample:`, previewEl.innerHTML.substring(0, 200));

      // Aplicar estilos inline al contenedor con responsive
      const isMobile = window.innerWidth < 768;

      previewEl.style.cssText = `
        display: grid !important;
        grid-template-columns: ${isMobile ? '1fr' : '200px 1fr'} !important;
        grid-template-rows: auto !important;
        background: #252525 !important;
        border-radius: 1rem !important;
        margin: 1.5rem 0 !important;
        padding: 1rem !important;
        cursor: pointer !important;
        transition: transform 0.2s ease !important;
        align-items: ${isMobile ? 'stretch' : 'center'} !important;
      `;

      // Buscar el enlace para obtener la URL - intentar varias estrategias
      let linkEl = preview.querySelector('a.vlp-link') as HTMLAnchorElement;
      if (!linkEl) {
        linkEl = preview.querySelector('a[href]') as HTMLAnchorElement;
      }
      const url = linkEl?.href;
      const target = linkEl?.target;

      console.log(`Preview ${index} - Link element:`, linkEl);
      console.log(`Preview ${index} - URL:`, url, 'Target:', target);

      // Aplicar estilos al contenedor de imagen
      const imgContainer = preview.querySelector('.vlp-link-image-container') as HTMLElement;
      console.log(`Preview ${index} - Image container:`, imgContainer);

      if (imgContainer) {
        imgContainer.style.cssText = `
          grid-column: 1 !important;
          grid-row: 1 !important;
          width: 100% !important;
          height: ${isMobile ? 'auto' : '160px'} !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        `;

        // Aplicar estilos a la imagen dentro del contenedor
        const img = imgContainer.querySelector('img') as HTMLElement;
        console.log(`Preview ${index} - Image element:`, img);

        if (img) {
          img.style.cssText = `
            width: 100% !important;
            height: ${isMobile ? 'auto' : '160px'} !important;
            max-width: ${isMobile ? '100%' : '200px'} !important;
            object-fit: cover !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0.75rem !important;
            display: block !important;
          `;
        }
      } else {
        // Si no hay contenedor, buscar imagen directamente
        const img = preview.querySelector('img.vlp-image') as HTMLElement;
        console.log(`Preview ${index} - Direct image:`, img);
        if (img) {
          img.style.cssText = `
            grid-column: 1 !important;
            grid-row: 1 !important;
            width: 100% !important;
            height: ${isMobile ? 'auto' : '160px'} !important;
            max-width: ${isMobile ? '100%' : '200px'} !important;
            object-fit: cover !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0.75rem !important;
            display: block !important;
            align-self: center !important;
          `;
        }
      }

      // Aplicar estilos al contenedor de texto
      const textContainer = preview.querySelector('.vlp-link-text-container') as HTMLElement;
      console.log(`Preview ${index} - Text container:`, textContainer);

      if (textContainer) {
        console.log(`Preview ${index} - Text container innerHTML:`, textContainer.innerHTML);
        console.log(`Preview ${index} - Text container children:`, textContainer.children);

        textContainer.style.cssText = `
          grid-column: ${isMobile ? '1' : '2'} !important;
          grid-row: ${isMobile ? '2' : '1'} !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          padding: 0 !important;
          padding-top: ${isMobile ? '1rem' : '0'} !important;
        `;

        // Aplicar estilos al título
        const title = textContainer.querySelector('.vlp-link-title') as HTMLElement;
        console.log(`Preview ${index} - Title element:`, title);

        if (title) {
          title.style.cssText = `
            font-size: 1.125rem !important;
            font-weight: 700 !important;
            color: #FFFFFF !important;
            margin: 0 0 0.5rem 0 !important;
            padding: 0 !important;
            line-height: 1.3 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          `;
        }

        // Buscar el elemento de descripción con múltiples selectores
        let summary = textContainer.querySelector('.vlp-link-excerpt') as HTMLElement;
        if (!summary) {
          summary = textContainer.querySelector('.vlp-link-description') as HTMLElement;
        }
        if (!summary) {
          summary = textContainer.querySelector('p') as HTMLElement;
        }
        if (!summary) {
          summary = textContainer.querySelector('div:not(.vlp-link-title)') as HTMLElement;
        }
        console.log(`Preview ${index} - Summary element:`, summary);

        if (summary) {
          summary.style.cssText = `
            font-size: 0.875rem !important;
            color: #FFFFFF !important;
            opacity: 0.7 !important;
            line-height: 1.4 !important;
            margin: 0 !important;
            padding: 0 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          `;
        }
      } else {
        // Si no hay contenedor de texto, buscar título y descripción directamente
        const title = preview.querySelector('h3') as HTMLElement;
        const summary = preview.querySelector('.summary') as HTMLElement;
        console.log(`Preview ${index} - Direct title:`, title);
        console.log(`Preview ${index} - Direct summary:`, summary);

        if (title) {
          title.style.cssText = `
            grid-column: ${isMobile ? '1' : '2'} !important;
            grid-row: ${isMobile ? '2' : '1'} !important;
            align-self: center !important;
            font-size: 1.125rem !important;
            font-weight: 700 !important;
            color: #FFFFFF !important;
            margin: 0 0 0.5rem 0 !important;
            padding: 0 !important;
            padding-top: ${isMobile ? '1rem' : '0'} !important;
            line-height: 1.3 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          `;
        }

        if (summary) {
          summary.style.cssText = `
            grid-column: ${isMobile ? '1' : '2'} !important;
            grid-row: ${isMobile ? '3' : '1'} !important;
            align-self: center !important;
            font-size: 0.875rem !important;
            color: #FFFFFF !important;
            opacity: 0.7 !important;
            line-height: 1.4 !important;
            margin: 0.5rem 0 0 0 !important;
            padding: 0 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          `;
        }
      }

      // Hacer el div clickeable
      if (url) {
        console.log(`Preview ${index} - Setting up click handler for URL:`, url);

        // Remover el href del link para evitar conflictos, y usar solo nuestro handler
        if (linkEl) {
          linkEl.style.pointerEvents = 'none';
          linkEl.style.textDecoration = 'none';
          linkEl.style.color = 'inherit';
        }

        previewEl.style.cursor = 'pointer';

        previewEl.onclick = (e) => {
          console.log('=== CLICK DETECTED ON PREVIEW ===');
          console.log('URL to navigate:', url);
          console.log('Target:', target);

          if (target === '_blank') {
            window.open(url, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = url;
          }
        };

        previewEl.onmouseenter = () => {
          previewEl.style.transform = 'translateY(-2px)';
        };

        previewEl.onmouseleave = () => {
          previewEl.style.transform = 'translateY(0)';
        };

        console.log(`Preview ${index} - Click handler setup complete`);
      } else {
        console.log(`Preview ${index} - NO URL FOUND, cannot set up click handler`);
      }

      console.log(`Preview ${index} - Styling complete`);
    });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
