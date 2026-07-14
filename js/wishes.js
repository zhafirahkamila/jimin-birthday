/* ============================================================
   A JOURNEY THROUGH JIMIN — WISHES WALL
   ------------------------------------------------------------
   Wishes live in the shared Firestore collection `letters` and
   stream in live via onSnapshot, so every visitor sees the same
   wall. The only local state is `jiminWishOwners` — a list of
   doc IDs this browser posted, used to show the Delete button
   only on the author's own wishes.
   ============================================================ */

import { db } from "./firebase.js";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

(function () {
  'use strict';

  const OWNER_KEY = 'jiminWishOwners';

  const form   = document.getElementById('wishes-form');
  const nameEl = document.getElementById('wish-name');
  const textEl = document.getElementById('wish-text');
  const grid   = document.getElementById('wishes-grid');

  if (!form || !textEl || !grid) return;

  /* ----------------------------------------------------------
     Owner tracking (per-browser, so only the author sees Delete)
     ---------------------------------------------------------- */
  function loadOwners() {
    try {
      const raw = localStorage.getItem(OWNER_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveOwner(id) {
    const owners = loadOwners();
    if (!owners.includes(id)) owners.push(id);
    try { localStorage.setItem(OWNER_KEY, JSON.stringify(owners)); } catch (_) {}
  }

  function removeOwner(id) {
    const owners = loadOwners().filter(function (x) { return x !== id; });
    try { localStorage.setItem(OWNER_KEY, JSON.stringify(owners)); } catch (_) {}
  }

  function isOwner(id) {
    return loadOwners().indexOf(id) !== -1;
  }

  /* ----------------------------------------------------------
     Render
     ---------------------------------------------------------- */
  function renderWishes(wishes) {
    grid.innerHTML = '';

    if (wishes.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'wishes-empty';
      empty.textContent = 'Be the first to leave a wish.';
      grid.appendChild(empty);
      return;
    }

    wishes.forEach(function (w) {
      const card = document.createElement('article');
      card.className = 'wish-card';

      const body = document.createElement('div');
      body.className = 'wish-text';
      /* textContent (never innerHTML) — keeps user input XSS-safe. */
      body.textContent = w.message || w.wish || '';
      card.appendChild(body);

      const meta = document.createElement('div');
      meta.className = 'wish-meta';

      const name = document.createElement('span');
      const who = w.name ? '— ' + w.name : '— Anonymous';
      name.textContent = w.country ? who + ' · ' + w.country : who;

      const date = document.createElement('span');
      const raw = w.createdAt || w.ts;
      let d = null;
      if (raw && typeof raw.toDate === 'function') d = raw.toDate();
      else if (raw) d = new Date(raw);
      if (d && !isNaN(d.getTime())) {
        date.textContent = d.toLocaleDateString(undefined, {
          day: '2-digit', month: 'short', year: 'numeric'
        });
      } else {
        date.textContent = '';
      }

      meta.appendChild(name);
      meta.appendChild(date);
      card.appendChild(meta);

      if (isOwner(w.id)) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'wish-delete';
        del.textContent = 'Delete';
        del.addEventListener('click', function () {
          del.disabled = true;
          deleteDoc(doc(db, 'letters', w.id))
            .then(function () { removeOwner(w.id); })
            .catch(function () { del.disabled = false; });
        });
        card.appendChild(del);
      }

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

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    addDoc(collection(db, 'letters'), {
      name:      name.slice(0, 40),
      message:   text.slice(0, 500),
      createdAt: serverTimestamp()
    }).then(function (ref) {
      saveOwner(ref.id);
      textEl.value = '';
      if (nameEl) nameEl.value = '';
    }).catch(function (err) {
      console.error('Failed to send wish:', err);
    }).finally(function () {
      if (submitBtn) submitBtn.disabled = false;
    });
  });

  /* ----------------------------------------------------------
     Live subscription — newest first
     ---------------------------------------------------------- */
  const q = query(collection(db, 'letters'), orderBy('createdAt', 'desc'));
  onSnapshot(q, function (snap) {
    const wishes = snap.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data());
    });
    renderWishes(wishes);
  }, function (err) {
    console.error('Wishes subscription failed:', err);
  });
})();
