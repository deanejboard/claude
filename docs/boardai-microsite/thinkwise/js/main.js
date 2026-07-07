/* Board AI — thinkwise variant
   Motion layer: Lenis smooth scroll + GSAP scroll reveals,
   marquee, count-ups, FAQ accordion, filter tabs, feedback stars. */

(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Smooth scroll ---- */
  if (!prefersReduced && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.11 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---- GSAP reveals ---- */
  if (window.gsap && !prefersReduced) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    /* Staggered word reveal for hero/serif headlines */
    document.querySelectorAll('[data-split]').forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words
        .map((w) => `<span style="display:inline-block;overflow:hidden;vertical-align:top;"><span style="display:inline-block;transform:translateY(110%);">${w}</span></span>`)
        .join(' ');
      gsap.to(el.querySelectorAll('span > span'), {
        y: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.055,
        scrollTrigger: { trigger: el, start: 'top 90%' },
      });
    });

    /* Count-up stats */
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
        onUpdate() {
          const val = target % 1 === 0 ? Math.round(obj.v) : obj.v.toFixed(1);
          el.textContent = prefix + val + suffix;
        },
      });
    });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  /* ---- Marquee (seamless loop) ---- */
  document.querySelectorAll('.marquee-track').forEach((track) => {
    track.innerHTML += track.innerHTML; // duplicate content
    let x = 0;
    const speed = prefersReduced ? 0 : 0.6;
    function tick() {
      x -= speed;
      if (Math.abs(x) >= track.scrollWidth / 2) x = 0;
      track.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(tick);
    }
    if (speed) requestAnimationFrame(tick);
  });

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const open = item.classList.toggle('is-open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : 0;
      q.setAttribute('aria-expanded', open);
    });
  });

  /* ---- FAQ category tabs ---- */
  document.querySelectorAll('.faq-tabs').forEach((tabs) => {
    tabs.querySelectorAll('.faq-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.querySelectorAll('.faq-tab').forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const cat = tab.dataset.cat;
        document.querySelectorAll('.faq-item').forEach((item) => {
          const show = cat === 'all' || item.dataset.cat === cat;
          item.style.display = show ? '' : 'none';
          if (!show) {
            item.classList.remove('is-open');
            item.querySelector('.faq-a').style.maxHeight = 0;
          }
        });
      });
    });
  });

  /* ---- Content filter tabs (Thinking / Sandbox) ---- */
  document.querySelectorAll('[data-filter-tabs]').forEach((tabs) => {
    tabs.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const f = tab.dataset.filter;
        document.querySelectorAll('[data-filter-item]').forEach((item) => {
          item.style.display = f === 'all' || item.dataset.filterItem.includes(f) ? '' : 'none';
        });
      });
    });
  });

  /* ---- Feedback stars ---- */
  document.querySelectorAll('.feedback-card .stars').forEach((wrap) => {
    const stars = [...wrap.querySelectorAll('.star')];
    stars.forEach((star, i) => {
      star.addEventListener('click', () => {
        stars.forEach((s, j) => s.classList.toggle('is-lit', j <= i));
        wrap.dataset.rating = i + 1;
      });
    });
  });

  /* ---- Mobile nav ---- */
  const burger = document.querySelector('.nav-burger');
  if (burger) {
    burger.addEventListener('click', () => {
      document.querySelector('.nav').classList.toggle('is-open');
    });
  }

  /* ---- Demo form handling (static prototype: no backend) ---- */
  document.querySelectorAll('form[data-demo]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-note');
      if (note) note.hidden = false;
    });
  });
})();
