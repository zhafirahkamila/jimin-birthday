/* ============================================================
   A JOURNEY THROUGH JIMIN — MOMENTS THROUGH TIME
   ------------------------------------------------------------
   The horizontal timeline of ten eras and its fullscreen
   museum-style modal. Click a card → the modal cross-fades in
   with a featured image, era number, period, description, and
   two supporting images. Inside the modal, ◂ / ▸ buttons and
   the arrow keys walk through every era in order — like moving
   from room to room in an exhibition.

   To edit an era's text or images, change the entry in ERAS
   below. Images live in assets/images/. Filenames are case-
   sensitive on most hosts; keep the .JPG / .jpg as written.
   ============================================================ */

(function () {
  'use strict';

  const ERAS = [
    {
      key: 'childhood', num: 'I', title: 'Childhood', period: '1995 – 2012',
      feature: 'assets/images/childhood1.JPG',
      images:  ['assets/images/childhood2.JPG', 'assets/images/childhood3.JPG'],
      desc: 'Busan, sea air, and a boy whose smile arrived long before the world was watching. A childhood measured in tide lines and quiet wonder — the first soft pages of a story still being written.'
    },
    {
      key: 'trainee', num: 'II', title: 'Trainee Days', period: '2012 – 2013',
      feature: 'assets/images/trainee1.jpg',
      images:  ['assets/images/trainee2.jpg', 'assets/images/trainee3.jpg'],
      desc: 'Long mirrors. Late nights. The quiet discipline of becoming — measured in mirrored steps, unbroken silences, and the steady weight of an unannounced future leaning gently against his shoulder.'
    },
    {
      key: 'debut', num: 'III', title: 'Debut', period: '2013 – 2014',
      feature: 'assets/images/debut1.JPG',
      images:  ['assets/images/debut2.JPG', 'assets/images/debut3.JPG'],
      desc: 'The stage lit, the lights raised, the first held breath released into music. Seven boys stepped into the world together, and the world — slowly, then all at once — learned their names.'
    },
    {
      key: 'hyyh', num: 'IV', title: 'HYYH', period: '2015 – 2016',
      feature: 'assets/images/hyyh1.jpg',
      images:  ['assets/images/hyyh2.jpg', 'assets/images/hyyh3.jpg'],
      desc: 'The most beautiful moment in life — youth caught mid-breath. Wildflowers, train windows, the soft ache of a season that knows it is already passing. He danced like he was trying to remember it.'
    },
    {
      key: 'bst', num: 'V', title: 'Blood Sweat & Tears', period: '2016 – 2017',
      feature: 'assets/images/bst1.jpg',
      images:  ['assets/images/bst2.jpg', 'assets/images/bst3.jpg'],
      desc: 'Velvet and renaissance light. A surrender — to art, to longing, to the irreversible thing a body becomes when it has finally found its language. He held the camera’s gaze and did not look away.'
    },
    {
      key: 'serendipity', num: 'VI', title: 'Serendipity', period: '2017 – 2018',
      feature: 'assets/images/serendipity1.jpg',
      images:  ['assets/images/serendipity2.jpg', 'assets/images/serendipity3.jpg'],
      desc: 'You and I — the calm cosmos meeting in a single, weightless line. His first solo verse, sung as if to no one in particular and to every one of us at once. Soft, certain, ineffably his.'
    },
    {
      key: 'face', num: 'VII', title: 'FACE', period: '2023',
      feature: 'assets/images/face1.jpg',
      images:  ['assets/images/face2.jpg', 'assets/images/face3.jpg'],
      desc: 'A reckoning written in his own hand. He turned the mirror toward himself — toward every fracture, every quiet survival — and named what he found there. The bravest thing an artist can do, done gently.'
    },
    {
      key: 'muse', num: 'VIII', title: 'MUSE', period: '2024',
      feature: 'assets/images/muse1.jpg',
      images:  ['assets/images/muse2.jpg', 'assets/images/muse3.jpg'],
      desc: 'A return to lightness, to love as a subject and not a wound. Summer-warm, unhurried, written by someone who has remembered how to keep some joy for himself. The chorus of a man at ease.'
    },
    {
      key: 'arirang', num: 'IX', title: 'ARIRANG Era', period: '2024 – 2025',
      feature: 'assets/images/arirang1.JPG',
      images:  ['assets/images/arirang2.JPG', 'assets/images/arirang3.JPG'],
      desc: 'An old song carried into a new century — every step rooted, every gesture a quiet thread of memory. He honored the country that raised him by reminding the world how beautifully it could move.'
    },
    {
      key: 'brothers', num: 'X', title: 'Brothers', period: '2013 – present',
      feature: 'assets/images/bts1.jpg',
      images:  ['assets/images/bts2.jpg', 'assets/images/bts3.jpg'],
      desc: 'Six men. One chosen family. Through every stage and every silence between them, they have remained the room he can always return to. Whatever chapter comes next, he does not walk it alone.'
    }
  ];

  /* DOM references — bail if the modal isn't on this page. */
  const cards    = document.querySelectorAll('.timeline-card');
  const modal    = document.getElementById('moment-modal');
  const frame    = modal && modal.querySelector('.moment-modal-frame');
  const closeBtn = modal && modal.querySelector('.moment-modal-close');
  const prevBtn  = modal && modal.querySelector('.moment-modal-prev');
  const nextBtn  = modal && modal.querySelector('.moment-modal-next');

  const featureImg = document.getElementById('moment-feature-img');
  const eraLabel   = document.getElementById('moment-era');
  const titleEl    = document.getElementById('moment-title');
  const periodEl   = document.getElementById('moment-period');
  const descEl     = document.getElementById('moment-desc');
  const thumbsEl   = document.getElementById('moment-thumbs');
  const counterEl  = document.getElementById('moment-counter');

  if (!modal || !featureImg || !titleEl || !cards.length) return;

  let activeIdx = -1;
  let lastTrigger = null;

  /* Replay the CSS cross-fade on an <img> by removing + reattaching it
     to the DOM. (Toggling animationName via JS also works, but a node
     swap is the most reliable cross-browser way to restart a keyframe.) */
  function restartFade(img) {
    img.style.animation = 'none';
    /* Force layout, then clear so the keyframe runs again. */
    void img.offsetWidth;
    img.style.animation = '';
  }

  function renderEra(idx) {
    const era = ERAS[idx];
    if (!era) return;
    activeIdx = idx;

    featureImg.src = era.feature;
    featureImg.alt = era.title + ' — featured image';
    restartFade(featureImg);

    eraLabel.textContent = 'Era ' + era.num;
    titleEl.textContent  = era.title;
    periodEl.textContent = era.period;
    descEl.textContent   = era.desc;
    counterEl.textContent = era.num + ' / X';

    /* Rebuild thumbs each time so the fade animation restarts. */
    thumbsEl.innerHTML = '';
    era.images.forEach(function (src, i) {
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      img.src = src;
      img.alt = era.title + ' — moment ' + (i + 2);
      img.loading = 'lazy';
      fig.appendChild(img);
      thumbsEl.appendChild(fig);
    });

    /* Scroll the modal back to the top whenever we change eras. */
    modal.scrollTop = 0;
  }

  function openModal(idx, trigger) {
    lastTrigger = trigger || null;
    renderEra(idx);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    /* Defer focus until the fade-in has begun, so screen readers
       announce the dialog with its current title. */
    if (closeBtn) {
      window.requestAnimationFrame(function () { closeBtn.focus(); });
    }
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus();
    }
  }

  function goTo(delta) {
    if (activeIdx < 0) return;
    const next = (activeIdx + delta + ERAS.length) % ERAS.length;
    renderEra(next);
  }

  /* Wire each timeline card to open its era. */
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      const key = card.getAttribute('data-era');
      const idx = ERAS.findIndex(function (e) { return e.key === key; });
      if (idx >= 0) openModal(idx, card);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (prevBtn)  prevBtn.addEventListener('click', function () { goTo(-1); });
  if (nextBtn)  nextBtn.addEventListener('click', function () { goTo( 1); });

  /* Backdrop click closes — only when the click lands on the overlay,
     not on the inner frame. */
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  /* Keyboard: Escape closes, ←/→ walk eras. */
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo( 1); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(-1); }
  });
})();
