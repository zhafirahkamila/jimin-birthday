/* ============================================================
   A JOURNEY THROUGH JIMIN — WISHES WALL
   ------------------------------------------------------------
   A simple digital guestbook. Wishes are saved in the visitor's
   own browser via localStorage — nothing is sent to any server.
   Each visitor sees their own wishes (perfect for a fan tribute
   that runs from a static host like GitHub Pages or Netlify).

   To clear all wishes on this device, open the browser console
   and run:    localStorage.removeItem('jiminWishes')
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'jiminWishes';

  const form         = document.getElementById('wishes-form');
  const nameEl       = document.getElementById('wish-name');
  const textEl       = document.getElementById('wish-text');
  const grid         = document.getElementById('wishes-grid');
  const imageInput   = document.getElementById('wish-image');
  const previewWrap  = document.getElementById('wish-image-preview');
  const previewImg   = document.getElementById('wish-image-preview-img');
  const clearBtn     = document.getElementById('wish-image-clear');

  if (!form || !textEl || !grid) return;

  const MAX_EDGE = 1000;
  const JPEG_Q   = 0.8;

  let pendingImage = null;

  function resizeImageFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload  = function () {
        const img = new Image();
        img.onerror = reject;
        img.onload  = function () {
          const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', JPEG_Q));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', function () {
      const file = imageInput.files && imageInput.files[0];
      if (!file) {
        pendingImage = null;
        if (previewWrap) previewWrap.hidden = true;
        return;
      }
      resizeImageFile(file).then(function (dataUrl) {
        pendingImage = dataUrl;
        if (previewImg)  previewImg.src = dataUrl;
        if (previewWrap) previewWrap.hidden = false;
      }).catch(function () {
        pendingImage = null;
        if (previewWrap) previewWrap.hidden = true;
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      pendingImage = null;
      if (imageInput)  imageInput.value = '';
      if (previewWrap) previewWrap.hidden = true;
      if (previewImg)  previewImg.removeAttribute('src');
    });
  }

  /* ----------------------------------------------------------
     Load + Save
     ---------------------------------------------------------- */
  function loadWishes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveWishes(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (_) {
      /* Storage might be full or disabled — fail silently. */
    }
  }

  /* ----------------------------------------------------------
     Render
     ---------------------------------------------------------- */
  function renderWishes() {
    const wishes = loadWishes();
    grid.innerHTML = '';

    if (wishes.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'wishes-empty';
      empty.textContent = 'Be the first to leave a wish.';
      grid.appendChild(empty);
      return;
    }

    /* Newest first — feels like a fresh top of the wall. */
    wishes.slice().reverse().forEach(function (w) {
      const card = document.createElement('article');
      card.className = 'wish-card';

      if (w.image) {
        const pic = document.createElement('img');
        pic.className = 'wish-image';
        pic.src = w.image;
        pic.alt = '';
        pic.loading = 'lazy';
        card.appendChild(pic);
      }

      const body = document.createElement('div');
      body.className = 'wish-text';
      /* textContent (never innerHTML) — keeps user input XSS-safe. */
      body.textContent = w.wish;
      card.appendChild(body);

      const meta = document.createElement('div');
      meta.className = 'wish-meta';

      const name = document.createElement('span');
      name.textContent = w.name ? '— ' + w.name : '— Anonymous';

      const date = document.createElement('span');
      try {
        const d = new Date(w.ts);
        date.textContent = d.toLocaleDateString(undefined, {
          day: '2-digit', month: 'short', year: 'numeric'
        });
      } catch (_) {
        date.textContent = '';
      }

      meta.appendChild(name);
      meta.appendChild(date);
      card.appendChild(meta);

      grid.appendChild(card);
    });
  }

  /* ----------------------------------------------------------
     Submit
     ---------------------------------------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const text = textEl.value.trim();
    const name = nameEl ? nameEl.value.trim() : '';
    if (!text) return;

    const all = loadWishes();
    const entry = {
      name: name.slice(0, 40),
      wish: text.slice(0, 500),
      ts:   Date.now()
    };
    if (pendingImage) entry.image = pendingImage;
    all.push(entry);
    saveWishes(all);

    textEl.value = '';
    if (nameEl) nameEl.value = '';
    if (imageInput)  imageInput.value = '';
    pendingImage = null;
    if (previewWrap) previewWrap.hidden = true;
    if (previewImg)  previewImg.removeAttribute('src');

    renderWishes();
  });

  /* First render — show whatever is already saved. */
  renderWishes();
})();
