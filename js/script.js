(function () {
  'use strict';

  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  const waFloat = document.getElementById('waFloat');
  const yearEl = document.getElementById('year');
  const parallaxEl = document.querySelector('[data-parallax]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header scroll + WhatsApp flutuante + parallax do mosaico
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (waFloat) waFloat.classList.toggle('visible', y > 200);
    if (parallaxEl && !reducedMotion && y < 900) {
      parallaxEl.style.transform = `translateY(${y * 0.08}px)`;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobile
  if (navToggle && navList) {
    const closeMenu = () => {
      navList.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menu');
      document.body.style.overflow = '';
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navList.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('open')) closeMenu();
    });
  }

  // Animações de entrada (Intersection Observer)
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  // Contadores animados
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const countIO = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const duration = 1600;
        const start = performance.now();
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(target * eased).toString();
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target.toString();
        };
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => countIO.observe(el));
  }

  // FAQ — fechar outros quando um for aberto
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });

  // Carousel de depoimentos
  const carousel = document.getElementById('carousel');
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const dotsContainer = document.getElementById('carouselDots');

  if (carousel && track && prevBtn && nextBtn) {
    const slides = track.querySelectorAll('.testimonial');
    const slideCount = slides.length;

    const getVisibleCount = () => {
      const w = window.innerWidth;
      if (w >= 768) return 2;
      return 1;
    };

    // Criar dots
    const buildDots = () => {
      const visible = getVisibleCount();
      const pages = Math.max(1, slideCount - visible + 1);
      dotsContainer.innerHTML = '';
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Ir para depoimento ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
    };

    let currentIndex = 0;

    const updateDots = () => {
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    };

    const goToSlide = (index) => {
      const visible = getVisibleCount();
      const maxIndex = Math.max(0, slideCount - visible);
      currentIndex = Math.max(0, Math.min(index, maxIndex));
      const slide = slides[currentIndex];
      if (!slide) return;
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: reducedMotion ? 'auto' : 'smooth' });
      updateDots();
    };

    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    // Sync dots quando usuário faz scroll manual no track
    let scrollTimer;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const scrollLeft = track.scrollLeft;
        let closest = 0;
        let minDist = Infinity;
        slides.forEach((s, i) => {
          const dist = Math.abs(s.offsetLeft - track.offsetLeft - scrollLeft);
          if (dist < minDist) { minDist = dist; closest = i; }
        });
        currentIndex = closest;
        updateDots();
      }, 100);
    }, { passive: true });

    buildDots();
    window.addEventListener('resize', () => { buildDots(); goToSlide(0); }, { passive: true });

    // Auto-play suave (pausa ao interagir)
    let autoplay = setInterval(() => {
      const visible = getVisibleCount();
      const maxIndex = Math.max(0, slideCount - visible);
      goToSlide(currentIndex >= maxIndex ? 0 : currentIndex + 1);
    }, 6000);
    const stopAutoplay = () => { clearInterval(autoplay); autoplay = null; };
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('touchstart', stopAutoplay, { passive: true });
    carousel.addEventListener('focusin', stopAutoplay);
  }
  // ============================================
  // Carrinho de Orçamento
  // ============================================
  const cartFloat = document.getElementById('cartFloat');
  const cartCount = document.getElementById('cartCount');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');
  const cartItems = document.getElementById('cartItems');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartName = document.getElementById('cartName');
  const cartObs = document.getElementById('cartObs');
  const cartSubmit = document.getElementById('cartSubmit');
  const WA_NUMBER = '5519982471706';
  const STORAGE_KEY = 'alfermaq-cart';

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) { cart = []; }

  const saveCart = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch(e) {}
  };

  const renderCart = () => {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    if (cartCount) {
      cartCount.textContent = total;
      cartCount.classList.toggle('has-items', total > 0);
    }
    if (!cartItems || !cartEmpty) return;
    if (cart.length === 0) {
      cartItems.innerHTML = '';
      cartEmpty.classList.remove('hidden');
    } else {
      cartEmpty.classList.add('hidden');
      cartItems.innerHTML = cart.map(i => `
        <li class="cart-item">
          <span class="cart-item-name">${i.name.replace(/</g,'&lt;')}</span>
          <div class="cart-item-actions">
            <button type="button" class="cart-qty-btn" data-action="decrement" data-name="${i.name.replace(/"/g,'&quot;')}" aria-label="Diminuir quantidade">−</button>
            <span class="cart-qty">${i.qty}</span>
            <button type="button" class="cart-qty-btn" data-action="increment" data-name="${i.name.replace(/"/g,'&quot;')}" aria-label="Aumentar quantidade">+</button>
            <button type="button" class="cart-remove" data-action="remove" data-name="${i.name.replace(/"/g,'&quot;')}" aria-label="Remover item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </li>
      `).join('');
    }
  };

  const openCart = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => cartName && cartName.focus(), 300);
  };

  const closeCart = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const addToCart = (name) => {
    const existing = cart.find(i => i.name === name);
    if (existing) existing.qty += 1;
    else cart.push({ name, qty: 1 });
    saveCart();
    renderCart();
    if (cartFloat) {
      cartFloat.classList.remove('bump');
      void cartFloat.offsetWidth;
      cartFloat.classList.add('bump');
    }
    openCart();
  };

  const updateQty = (name, delta) => {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    saveCart();
    renderCart();
  };

  const removeFromCart = (name) => {
    cart = cart.filter(i => i.name !== name);
    saveCart();
    renderCart();
  };

  // Botões "Solicitar Orçamento" dos cards
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.equip-card');
      if (!card) return;
      const h3 = card.querySelector('h3');
      if (!h3) return;
      addToCart(h3.textContent.trim());
    });
  });

  // Abrir/fechar carrinho
  if (cartFloat) cartFloat.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('open')) closeCart();
  });

  // Ações dentro dos itens (delegação)
  if (cartItems) {
    cartItems.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const name = btn.dataset.name;
      if (action === 'increment') updateQty(name, 1);
      else if (action === 'decrement') updateQty(name, -1);
      else if (action === 'remove') removeFromCart(name);
    });
  }

  // Finalizar no WhatsApp
  if (cartSubmit) {
    cartSubmit.addEventListener('click', () => {
      const nome = (cartName && cartName.value || '').trim();
      if (!nome) {
        alert('Por favor, informe seu nome.');
        cartName && cartName.focus();
        return;
      }
      if (cart.length === 0) {
        alert('Adicione ao menos um equipamento ao orçamento.');
        return;
      }
      const obs = (cartObs && cartObs.value || '').trim();
      const lista = cart.map(i => `• ${i.name} x ${i.qty}`).join('\n');
      let msg = `Olá! Meu nome é ${nome}. Quero orçamento para:\n${lista}`;
      if (obs) msg += `\n\nObservações: ${obs}`;
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener');
    });
  }

  renderCart();
})();
