/* ============================================================
   A JOURNEY THROUGH JIMIN — EXPERIENCE LAYER
   ------------------------------------------------------------
   Three related concerns, kept in one file because they share
   init ordering (entrance dismiss -> audio start).

     1. ENTRANCE OVERLAY — the "Enter the Exhibition" gate.
     2. NAV BAR         — scrolled state + hamburger drawer +
                          active-section indicator.
     3. BACKGROUND MUSIC — autoplay with fade-in, custom control,
                           dims during video modal.

   HOW TO SWAP THE MUSIC FILE
   -----------------------------
   Drop your file at:  assets/audio/background.mp3
   Or edit the src="" on the <audio id="bg-audio"> in index.html.

   The <audio> tag is intentionally hidden — this file drives it
   through a custom button in the bottom-right.
   ============================================================ */

(function () {
  'use strict';

  // Broadcast when the visitor has "entered" — the loader in main.js
  // listens for this event before starting its 2.4s countdown.
  const EXPERIENCE_EVENT = 'experience:entered';

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ------------------------------------------------------------
     1. ENTRANCE OVERLAY
     ------------------------------------------------------------ */
  const entranceEl = document.getElementById('entrance');
  const entranceCta = document.getElementById('entrance-cta');

  let entered = false;

  function dispatchEntered() {
    if (entered) return;
    entered = true;
    document.dispatchEvent(new CustomEvent(EXPERIENCE_EVENT));
  }

  function dismissEntrance() {
    if (!entranceEl) {
      dispatchEntered();
      return;
    }
    // Fire the event immediately so the loader countdown + audio fade
    // begin in parallel with the fade-out (feels seamless).
    dispatchEntered();
    entranceEl.classList.add('fade-out');
    document.body.classList.remove('entrance-active');

    // Focus the hero for keyboard users
    const hero = document.getElementById('opening');
    if (hero) hero.setAttribute('tabindex', '-1');

    window.setTimeout(() => {
      entranceEl.setAttribute('hidden', '');
    }, 950);
  }

  if (entranceEl) {
    document.body.classList.add('entrance-active');

    // Any click / tap anywhere on the overlay dismisses it.
    entranceEl.addEventListener('click', dismissEntrance);

    // Enter or Space when CTA is focused (keyboard flow).
    if (entranceCta) {
      entranceCta.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          dismissEntrance();
        }
      });
      // Move focus onto the CTA once the page is ready.
      window.addEventListener('DOMContentLoaded', () => {
        window.setTimeout(() => entranceCta.focus({ preventScroll: true }), 200);
      });
    }
  } else {
    // No entrance overlay in the DOM (someone removed it) — just fire.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', dispatchEntered);
    } else {
      dispatchEntered();
    }
  }


  /* ------------------------------------------------------------
     2. NAV BAR
     ------------------------------------------------------------ */
  const navEl     = document.getElementById('nav');
  const navToggle = navEl && navEl.querySelector('.nav-toggle');
  const navMenu   = document.getElementById('nav-menu');
  const navLinks  = navMenu ? Array.from(navMenu.querySelectorAll('a')) : [];
  const navBackdrop = navEl && navEl.querySelector('.nav-backdrop');

  // 2a. Scrolled state (blur + border after first 40px)
  if (navEl) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        navEl.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 2b. Hamburger open/close
  function openMenu() {
    if (!navEl) return;
    navEl.classList.add('open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
    }
    document.body.classList.add('nav-locked');
    // Focus first link for keyboard users
    if (navLinks[0]) navLinks[0].focus({ preventScroll: true });
  }

  function closeMenu() {
    if (!navEl) return;
    navEl.classList.remove('open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }
    document.body.classList.remove('nav-locked');
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      if (navEl.classList.contains('open')) closeMenu();
      else openMenu();
    });
  }
  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeMenu);
  }
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      // Close the drawer on link click; smooth-scroll then fires naturally.
      closeMenu();
    });
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && navEl && navEl.classList.contains('open')) {
      closeMenu();
      if (navToggle) navToggle.focus();
    }
  });

  // 2c. Active-section indicator (highlight nav link for the section in view)
  if (navLinks.length && 'IntersectionObserver' in window) {
    const sections = navLinks
      .map((link) => {
        const href = link.getAttribute('href') || '';
        if (!href.startsWith('#')) return null;
        const el = document.querySelector(href);
        return el ? { link, el } : null;
      })
      .filter(Boolean);

    if (sections.length) {
      const visible = new Map(); // element -> ratio
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) visible.set(entry.target, entry.intersectionRatio);
            else visible.delete(entry.target);
          });

          // Largest visible ratio wins.
          let bestEl = null;
          let bestRatio = 0;
          visible.forEach((ratio, el) => {
            if (ratio > bestRatio) { bestRatio = ratio; bestEl = el; }
          });

          sections.forEach(({ link, el }) => {
            link.classList.toggle('active', el === bestEl);
          });
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
      );
      sections.forEach(({ el }) => io.observe(el));
    }
  }


  /* ------------------------------------------------------------
     3. BACKGROUND MUSIC
     ------------------------------------------------------------ */
  const audio     = document.getElementById('bg-audio');
  const audioBtn  = document.getElementById('audio-toggle');

  // Volume config
  const TARGET_VOLUME = 0.25;           // ambient level (0-1)
  const FADE_IN_MS    = reducedMotion ? 200 : 2500;
  const FADE_TOGGLE_MS = reducedMotion ? 150 : 350;
  const DIM_LEVEL     = 0.05;           // volume while video modal is open

  let currentVolume = 0;
  let userVolumeBeforeDim = TARGET_VOLUME;
  let fadeRAF = null;
  let wasPlayingBeforeHidden = false;

  function cancelFade() {
    if (fadeRAF) { cancelAnimationFrame(fadeRAF); fadeRAF = null; }
  }

  function fadeVolume(from, to, duration, onDone) {
    if (!audio) return;
    cancelFade();
    if (duration <= 0) {
      audio.volume = clamp01(to);
      currentVolume = audio.volume;
      if (onDone) onDone();
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      const v = clamp01(from + (to - from) * eased);
      audio.volume = v;
      currentVolume = v;
      if (t < 1) {
        fadeRAF = requestAnimationFrame(step);
      } else {
        fadeRAF = null;
        if (onDone) onDone();
      }
    };
    fadeRAF = requestAnimationFrame(step);
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function updateButtonState(playing) {
    if (!audioBtn) return;
    audioBtn.setAttribute('data-playing', playing ? 'true' : 'false');
    audioBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    audioBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }

  function attemptAutoplay() {
    if (!audio) return;
    // Reveal the control regardless of autoplay outcome, so visitors
    // can always start music manually.
    if (audioBtn) audioBtn.classList.add('ready');

    audio.volume = 0;
    const playPromise = audio.play();
    if (!playPromise || typeof playPromise.then !== 'function') {
      updateButtonState(false);
      return;
    }
    playPromise
      .then(() => {
        updateButtonState(true);
        fadeVolume(0, TARGET_VOLUME, FADE_IN_MS);
      })
      .catch(() => {
        // Autoplay blocked (or no audio file present yet).
        updateButtonState(false);
      });
  }

  function togglePlayback() {
    if (!audio) return;
    if (audio.paused) {
      audio.volume = 0;
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          updateButtonState(true);
          fadeVolume(0, userVolumeBeforeDim || TARGET_VOLUME, FADE_TOGGLE_MS);
        }).catch(() => updateButtonState(false));
      } else {
        updateButtonState(true);
        fadeVolume(0, userVolumeBeforeDim || TARGET_VOLUME, FADE_TOGGLE_MS);
      }
    } else {
      const from = audio.volume;
      fadeVolume(from, 0, FADE_TOGGLE_MS, () => {
        audio.pause();
        updateButtonState(false);
      });
    }
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', togglePlayback);
  }

  // Start music once the visitor has entered.
  document.addEventListener(EXPERIENCE_EVENT, attemptAutoplay, { once: true });

  // Also: if the entrance overlay is absent AND autoplay fails silently,
  // the first user gesture anywhere should count as consent. Very light-touch.
  if (!entranceEl) {
    const firstGesture = () => {
      if (audio && audio.paused) {
        audio.play().then(() => {
          updateButtonState(true);
          fadeVolume(0, TARGET_VOLUME, FADE_IN_MS);
        }).catch(() => {});
      }
      document.removeEventListener('click', firstGesture);
      document.removeEventListener('touchstart', firstGesture);
      document.removeEventListener('keydown', firstGesture);
    };
    document.addEventListener('click', firstGesture, { once: true });
    document.addEventListener('touchstart', firstGesture, { once: true });
    document.addEventListener('keydown', firstGesture, { once: true });
  }

  // 3a. Dim music when the video modal is open (audio duel would be jarring).
  const videoModal = document.getElementById('video-modal');
  if (videoModal && audio) {
    const modalObserver = new MutationObserver(() => {
      const open = videoModal.classList.contains('open');
      if (open) {
        if (audio.paused) return; // nothing to dim
        userVolumeBeforeDim = currentVolume || TARGET_VOLUME;
        fadeVolume(currentVolume, DIM_LEVEL, 500);
        if (audioBtn) audioBtn.classList.add('dimmed');
      } else {
        if (audioBtn) audioBtn.classList.remove('dimmed');
        if (!audio.paused) {
          fadeVolume(currentVolume, userVolumeBeforeDim || TARGET_VOLUME, 700);
        }
      }
    });
    modalObserver.observe(videoModal, { attributes: true, attributeFilter: ['class'] });
  }

  // 3b. Pause on tab hidden (be a good citizen).
  document.addEventListener('visibilitychange', () => {
    if (!audio) return;
    if (document.hidden) {
      wasPlayingBeforeHidden = !audio.paused;
      if (wasPlayingBeforeHidden) audio.pause();
    } else if (wasPlayingBeforeHidden) {
      audio.volume = 0;
      audio.play().then(() => {
        fadeVolume(0, userVolumeBeforeDim || TARGET_VOLUME, 500);
      }).catch(() => {});
    }
  });

})();
