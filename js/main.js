/* ============================================================
   A JOURNEY THROUGH JIMIN — MAIN BEHAVIOR
   ------------------------------------------------------------
   This file runs three small effects:
     1. LOADER FADE         — hides the opening curtain on load
     2. REVEAL ON SCROLL    — fades sections in as you scroll
     3. DUST PARTICLES      — the floating cinematic dust canvas
     4. LIGHTBOX            — click any photo to zoom in
     5. FINAL FADE          — dims the page once you reach the end

   Each block is independent — delete one and the rest still work.
   ============================================================ */

(function () {
  'use strict';

  /* Honor the OS-level "Reduce Motion" preference. */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ----------------------------------------------------------
     1. LOADER — fade out shortly after the visitor "enters".
        The countdown starts when js/experience.js dispatches the
        `experience:entered` event (right when the entrance overlay
        begins fading). If the entrance overlay is missing from the
        DOM, experience.js dispatches the event immediately on
        DOMContentLoaded, so behavior stays the same.
        2400ms lets the 5 moon phases complete their fade-in
        (last one lands at ~1.0s, +1.2s breathing room).
     ---------------------------------------------------------- */
  let loaderStarted = false;
  function startLoaderCountdown() {
    if (loaderStarted) return;
    loaderStarted = true;
    setTimeout(function () {
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('fade');
    }, prefersReduced ? 200 : 2400);
  }
  document.addEventListener('experience:entered', startLoaderCountdown, { once: true });
  // Safety net: if experience.js is missing, kick off after `load`.
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (!loaderStarted) startLoaderCountdown();
    }, 100);
  });


  /* ----------------------------------------------------------
     2. REVEAL ON SCROLL — every element with class="reveal"
        fades up the first time it enters the viewport.
     ---------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    /* Old browsers — just show everything. */
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }


  /* ----------------------------------------------------------
     3. DUST PARTICLES — drawn on a fixed full-screen canvas.
        Soft white dots drifting upward, like film dust.
     ---------------------------------------------------------- */
  const canvas = document.getElementById('dust');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let rafId = null;

    function sizeCanvas() {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }

    function makeParticles() {
      const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 28000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: (Math.random() * 1.6 + 0.4) * dpr,
          vy: -(Math.random() * 0.15 + 0.05) * dpr,
          vx: (Math.random() - 0.5) * 0.1 * dpr,
          a:  Math.random() * 0.5 + 0.2,
          drift: Math.random() * Math.PI * 2
        });
      }
    }

    function drawDust() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.drift += 0.004;
        p.x += p.vx + Math.sin(p.drift) * 0.1 * dpr;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,243,238,' + p.a + ')';
        ctx.fill();
      }
      rafId = requestAnimationFrame(drawDust);
    }

    sizeCanvas();
    makeParticles();
    drawDust();

    window.addEventListener('resize', function () {
      sizeCanvas();
      makeParticles();
    });

    /* Pause the animation when the tab is hidden — saves battery. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!document.hidden && !rafId) {
        drawDust();
      }
    });
  }


  /* ----------------------------------------------------------
     4. LIGHTBOX — click a polaroid or film frame to view full size.
     ---------------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lightbox-img');
  if (lightbox && lbImg) {
    document.querySelectorAll('.polaroid img, .moment-frame img').forEach(function (img) {
      img.addEventListener('click', function () {
        lbImg.src = img.src;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
      });
    });
    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      lbImg.src = '';
    }
    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }


  /* ----------------------------------------------------------
     5. CINEMATIC ENDING SEQUENCE
        ------------------------------------------------------------
        When the moon-phase row enters the viewport, play the
        staggered phase fade-in (CSS-driven via .playing) and then
        cascade the verse / birthday / sign-off in turn.
     ---------------------------------------------------------- */
  const phaseRow = document.querySelector('[data-final-seq]');
  const finalSteps = document.querySelectorAll('.final-step');
  let phasesDone = false; /* parallax waits for this so it doesn't overwrite the stagger transform */
  if (phaseRow && 'IntersectionObserver' in window) {
    const finalIO = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        phaseRow.classList.add('playing');
        /* Cascade timings line up with the plan:
           phases finish at ~4.8s; verse 4.5s, birthday 5.2s, sign-off 5.9s.
           In reduced motion, snap everything in immediately. */
        const stepDelays = prefersReduced ? [0, 0, 0] : [4500, 5200, 5900];
        finalSteps.forEach(function (el, i) {
          setTimeout(function () { el.classList.add('in'); }, stepDelays[i] || 0);
        });
        /* Let parallax take over only after the phase stagger finishes. */
        setTimeout(function () { phasesDone = true; }, prefersReduced ? 0 : 5200);
        observer.unobserve(phaseRow);
      });
    }, { threshold: 0.35 });
    finalIO.observe(phaseRow);
  } else if (phaseRow) {
    /* No IntersectionObserver — show everything immediately. */
    phaseRow.classList.add('playing');
    finalSteps.forEach(function (el) { el.classList.add('in'); });
    phasesDone = true;
  }


  /* ----------------------------------------------------------
     6. FINAL PARALLAX
        ------------------------------------------------------------
        While the final section is in view, gently translate the
        outer phases relative to the center on scroll. rAF-throttled.
     ---------------------------------------------------------- */
  const finalSection = document.getElementById('final');
  if (finalSection && phaseRow && !prefersReduced) {
    const phases = phaseRow.querySelectorAll('.phase');
    const factors = [-6, -3, 0, 3, 6]; /* per-phase parallax depth in px */
    let inView = false;
    let ticking = false;

    function applyParallax() {
      const rect = finalSection.getBoundingClientRect();
      const viewH = window.innerHeight;
      /* progress: 0 when section bottom hits viewport bottom, 1 when section top hits viewport top */
      const progress = Math.max(0, Math.min(1,
        (viewH - rect.top) / (viewH + rect.height)
      ));
      const centered = (progress - 0.5) * 2; /* -1 .. +1 */
      for (let i = 0; i < phases.length; i++) {
        phases[i].style.setProperty('--py', (centered * factors[i]) + 'px');
        phases[i].style.transform = 'translateY(var(--py, 0))';
      }
      ticking = false;
    }

    /* Only run when in view (saves work on long scrolls). */
    if ('IntersectionObserver' in window) {
      const vIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { inView = e.isIntersecting; });
      }, { threshold: [0, 0.01] });
      vIO.observe(finalSection);
    } else {
      inView = true;
    }

    window.addEventListener('scroll', function () {
      if (!inView || !phasesDone || ticking) return;
      ticking = true;
      requestAnimationFrame(applyParallax);
    }, { passive: true });
  }


  /* ----------------------------------------------------------
     7. MOON-PHASE CURSOR TRAIL
        ------------------------------------------------------------
        A very subtle trail of tiny moon phases that follow the
        cursor and fade out. Disabled on touch and reduced motion.
     ---------------------------------------------------------- */
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (!prefersReduced && !isTouch) {
    let last = 0;
    let phaseN = 1;
    const MAX_LIVE = 12;
    const live = new Set();

    window.addEventListener('mousemove', function (e) {
      const now = performance.now();
      if (now - last < 65) return; /* ~15 spawns/sec max */
      last = now;
      if (live.size >= MAX_LIVE) return;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'cursor-phase');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#phase-' + phaseN);
      svg.appendChild(use);
      svg.style.left = e.clientX + 'px';
      svg.style.top  = e.clientY + 'px';

      phaseN = phaseN === 5 ? 1 : phaseN + 1;

      document.body.appendChild(svg);
      live.add(svg);
      svg.addEventListener('animationend', function () {
        svg.remove();
        live.delete(svg);
      });
    }, { passive: true });
  }
})();
