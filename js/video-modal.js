/* ============================================================
   A JOURNEY THROUGH JIMIN — VIDEO MODAL
   ------------------------------------------------------------
   Plays the "Watch The Journey" YouTube video INSIDE the page,
   in a cinematic full-screen overlay. The visitor never leaves
   the website.

   How it works:
     - The iframe has NO src in the HTML. We only set it when
       the modal opens — so YouTube doesn't preload, and we
       can fully stop the player by clearing the src on close.
     - Opens with smooth scale-in animation (see .video-modal
       and .video-modal-frame in css/style.css).
     - Closes via ✕ button, the Escape key, or clicking the
       backdrop. Closing clears src to stop the audio.

   To change the video:
     - In index.html, edit the data-youtube-id="..." attribute
       on the .video-poster element. That's it.
   ============================================================ */

(function () {
  'use strict';

  const poster = document.querySelector('.video-poster');
  const modal  = document.getElementById('video-modal');
  const iframe = document.getElementById('video-iframe');
  const closeBtn = document.querySelector('.video-modal-close');

  /* If the page doesn't have these elements, do nothing. */
  if (!poster || !modal || !iframe) return;

  function openVideo() {
    const id = poster.getAttribute('data-youtube-id') || 'hoUkD2jxZhk';
    /* autoplay=1: start immediately. rel=0: no related videos.
       modestbranding=1: minimal YouTube branding.
       playsinline=1: stay inline on iOS. */
    iframe.src = 'https://www.youtube.com/embed/' + id +
                 '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeVideo() {
    /* Clearing src is what actually stops playback (and audio). */
    iframe.src = '';
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* Open on poster click or keyboard activation. */
  poster.addEventListener('click', openVideo);
  poster.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openVideo();
    }
  });

  /* Close on ✕ button. */
  if (closeBtn) closeBtn.addEventListener('click', closeVideo);

  /* Close on backdrop click (but not when clicking the video frame itself). */
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeVideo();
  });

  /* Close on Escape. */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeVideo();
  });
})();
