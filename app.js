const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const menu = document.querySelector('[data-menu]');
const cursor = document.querySelector('.cursor');

const setHeaderState = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 18);
};

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

menu?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  document.body.classList.toggle('menu-open', isOpen);
  menu.setAttribute('aria-expanded', String(isOpen));
  menu.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Open menu');
  });
});

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}

if (cursor && !matchMedia('(hover: none)').matches && !prefersReducedMotion) {
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let cursorX = pointerX;
  let cursorY = pointerY;

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursor.style.opacity = '1';
  }, { passive: true });

  document.querySelectorAll('a, button, .tilt-card').forEach((item) => {
    item.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
    item.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
  });

  const renderCursor = () => {
    cursorX += (pointerX - cursorX) * 0.18;
    cursorY += (pointerY - cursorY) * 0.18;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    requestAnimationFrame(renderCursor);
  };
  renderCursor();
}

const animateCount = (element) => {
  const target = Number(element.dataset.count || 0);
  const duration = 1100;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.55 });

document.querySelectorAll('[data-count]').forEach((stat) => statsObserver.observe(stat));

if (!prefersReducedMotion && !matchMedia('(hover: none)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    const maxTilt = 7;
    const originalTransform = getComputedStyle(card).transform === 'none' ? '' : getComputedStyle(card).transform;

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateX = (-y * maxTilt).toFixed(2);
      const rotateY = (x * maxTilt).toFixed(2);
      card.style.transform = `${originalTransform} perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = originalTransform;
    });
  });
}

const canvas = document.getElementById('atmosphere');
const ctx = canvas?.getContext('2d', { alpha: true });

if (canvas && ctx && !prefersReducedMotion) {
  let width = 0;
  let height = 0;
  let dpr = 1;
  const pointer = { x: 0.78, y: 0.22 };
  const particles = [];

  const resizeCanvas = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.length = 0;
    const particleCount = Math.min(80, Math.max(38, Math.floor(width / 18)));
    for (let i = 0; i < particleCount; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        alpha: Math.random() * 0.45 + 0.12,
      });
    }
  };

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX / window.innerWidth;
    pointer.y = event.clientY / window.innerHeight;
  }, { passive: true });

  const draw = (time) => {
    ctx.clearRect(0, 0, width, height);

    const mainX = width * (0.25 + pointer.x * 0.5);
    const mainY = height * (0.16 + pointer.y * 0.45);
    const gradient = ctx.createRadialGradient(mainX, mainY, 0, mainX, mainY, Math.max(width, height) * 0.58);
    gradient.addColorStop(0, 'rgba(215,255,114,0.12)');
    gradient.addColorStop(0.38, 'rgba(158,248,255,0.06)');
    gradient.addColorStop(0.78, 'rgba(255,142,197,0.035)');
    gradient.addColorStop(1, 'rgba(9,9,15,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    particles.forEach((particle, index) => {
      const wave = Math.sin(time * 0.00035 + index) * 0.14;
      particle.x += particle.vx + wave;
      particle.y += particle.vy + Math.cos(time * 0.00028 + index) * 0.12;

      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(247,243,234,${particle.alpha})`;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 118) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(158,248,255,${(1 - distance / 118) * 0.08})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  };

  resizeCanvas();
  requestAnimationFrame(draw);
}
