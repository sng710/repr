document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImg = document.querySelector('[data-lightbox-img]');
  const lightboxClose = document.querySelector('[data-lightbox-close]');
  const backToTop = document.querySelector('[data-back-to-top]');

  let lastModalTrigger = null;
  let lastLightboxTrigger = null;
  let modalCloseTimer = null;
  let lightboxCloseTimer = null;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const getFocusable = (container) => {
    if (!container) return [];
    return Array.from(container.querySelectorAll(focusableSelector)).filter((el) => {
      return !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true';
    });
  };

  const trapFocus = (event, container) => {
    if (event.key !== 'Tab') return;

    const focusable = getFocusable(container);
    if (!focusable.length) {
      event.preventDefault();
      container.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  // 1. Scroll Fade-in Observer
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('fade-in-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.memory-item, .gallery-card').forEach((item) => observer.observe(item));
  } else {
    document.querySelectorAll('.memory-item, .gallery-card').forEach((item) => item.classList.add('fade-in-visible'));
  }

  const setExpanded = (trigger, expanded) => {
    if (trigger?.hasAttribute('aria-expanded')) {
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  };

  // 2. Dialog / Modal Actions with Class Syncing
  const openDialog = (dialog, trigger) => {
    if (!dialog) return;

    if (modalCloseTimer) {
      clearTimeout(modalCloseTimer);
      modalCloseTimer = null;
    }

    lastModalTrigger = trigger || null;
    setExpanded(lastModalTrigger, true);

    dialog.classList.add('is-open');
    document.body.classList.add('has-memory-modal');

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    const closeButton = dialog.querySelector('[data-modal-close]');
    const heading = dialog.querySelector('h2, h3');
    const focusTarget = closeButton || heading || getFocusable(dialog)[0] || dialog;

    if (focusTarget === heading && !focusTarget.hasAttribute('tabindex')) {
      focusTarget.setAttribute('tabindex', '-1');
    }
    focusTarget.focus({ preventScroll: true });
  };

  const closeDialog = (dialog) => {
    if (!dialog) return;

    dialog.classList.remove('is-open');
    document.body.classList.remove('has-memory-modal');
    setExpanded(lastModalTrigger, false);

    const triggerToReturn = lastModalTrigger;
    const delay = reduceMotion ? 0 : 250;

    modalCloseTimer = setTimeout(() => {
      if (dialog.open && typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }

      triggerToReturn?.focus({ preventScroll: true });
      if (lastModalTrigger === triggerToReturn) lastModalTrigger = null;
      modalCloseTimer = null;
    }, delay);
  };

  // 3. Lightbox Engine with Animation Syncing
  const openLightbox = (card) => {
    if (!lightbox || !lightboxImg) return;

    if (lightboxCloseTimer) {
      clearTimeout(lightboxCloseTimer);
      lightboxCloseTimer = null;
    }

    const src = card.getAttribute('data-full');
    if (!src) return;

    const thumbnailAlt = card.querySelector('img')?.getAttribute('alt') || '';
    const captionText = card.querySelector('figcaption')?.textContent?.replace(/\s+/g, ' ').trim() || '';

    lightboxImg.src = src;
    lightboxImg.alt = thumbnailAlt || captionText || 'תמונה מוגדלת';

    lastLightboxTrigger = card;
    lightbox.classList.add('is-open');
    document.documentElement.classList.add('has-lightbox');

    if (typeof lightbox.showModal === 'function') {
      if (!lightbox.open) lightbox.showModal();
    } else {
      lightbox.setAttribute('open', '');
    }

    lightboxClose?.focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImg) return;

    lightbox.classList.remove('is-open');
    document.documentElement.classList.remove('has-lightbox');

    const triggerToReturn = lastLightboxTrigger;
    const delay = reduceMotion ? 0 : 320;

    lightboxCloseTimer = setTimeout(() => {
      if (lightbox.open && typeof lightbox.close === 'function') {
        lightbox.close();
      } else {
        lightbox.removeAttribute('open');
      }

      lightboxImg.removeAttribute('src');
      triggerToReturn?.focus?.({ preventScroll: true });
      if (lastLightboxTrigger === triggerToReturn) lastLightboxTrigger = null;
      lightboxCloseTimer = null;
    }, delay);
  };

  // 4. Global Refactored Event Listeners
  document.addEventListener('click', (event) => {
    const transcriptToggle = event.target.closest('[data-transcript-toggle]');
    if (transcriptToggle) {
      event.preventDefault();
      const panel = document.getElementById(transcriptToggle.getAttribute('aria-controls'));
      const shouldOpen = panel?.hidden;
      if (panel) panel.hidden = !shouldOpen;
      transcriptToggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      transcriptToggle.textContent = shouldOpen ? 'הסתר טקסט מוקלד' : 'הצג טקסט מוקלד';
      return;
    }

    const modalTrigger = event.target.closest('[data-modal-target]');
    if (modalTrigger) {
      event.preventDefault();
      openDialog(document.getElementById(modalTrigger.dataset.modalTarget), modalTrigger);
      return;
    }

    const modalClose = event.target.closest('[data-modal-close]');
    if (modalClose) {
      event.preventDefault();
      closeDialog(modalClose.closest('dialog'));
      return;
    }

    const imageTrigger = event.target.closest('[data-full]');
    if (imageTrigger) {
      event.preventDefault();
      openLightbox(imageTrigger);
      return;
    }

    if (event.target.closest('[data-back-to-top]')) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  });

  // Keyboard support for focusable figure/lightbox triggers
  document.addEventListener('keydown', (event) => {
    const openMemoryModal = document.querySelector('dialog.memory-modal[open]');
    if (openMemoryModal) {
      trapFocus(event, openMemoryModal);
      return;
    }

    if (lightbox?.open) {
      trapFocus(event, lightbox);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;
    const imageTrigger = event.target.closest?.('[data-full]');
    if (!imageTrigger) return;
    event.preventDefault();
    openLightbox(imageTrigger);
  });

  // Native Escape key and Backdrop clicks handling
  document.querySelectorAll('dialog.memory-modal').forEach((dialog) => {
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });

    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
                     event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) closeDialog(dialog);
    });
  });

  if (lightbox) {
    lightbox.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeLightbox();
    });

    lightbox.addEventListener('click', (event) => {
      const rect = lightbox.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
                     event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) closeLightbox();
    });
  }

  lightboxClose?.addEventListener('click', (event) => {
    event.preventDefault();
    closeLightbox();
  });

  if (backToTop) {
    const toggleBackToTop = () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 640);
    };
    toggleBackToTop();
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
  }
});