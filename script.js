const body = document.body;
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navPanel = document.querySelector('.nav-panel');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-icon');
const navLinks = [...document.querySelectorAll('.nav-panel a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// Page loader: fast enough to avoid blocking, long enough to make the entry feel intentional.
const pageLoader = document.getElementById('pageLoader');
const loaderLabel = document.getElementById('loaderLabel');
const loaderStartedAt = performance.now();
const loaderMessages = [
  'Connecting strategy to delivery',
  'Mapping complex requirements',
  'Shaping valuable product outcomes'
];
let loaderMessageIndex = 0;
let loaderMessageTimer = null;
let loaderFinished = false;

function rotateLoaderMessage() {
  if (!loaderLabel || loaderFinished) return;
  loaderLabel.classList.add('is-changing');
  window.setTimeout(() => {
    loaderMessageIndex = (loaderMessageIndex + 1) % loaderMessages.length;
    loaderLabel.textContent = loaderMessages[loaderMessageIndex];
    loaderLabel.classList.remove('is-changing');
  }, 170);
}

if (pageLoader && !reduceMotion) {
  loaderMessageTimer = window.setInterval(rotateLoaderMessage, 520);
}

function finishPageLoader() {
  if (loaderFinished) return;
  loaderFinished = true;

  const minimumDisplay = reduceMotion ? 0 : 760;
  const elapsed = performance.now() - loaderStartedAt;
  const remaining = Math.max(0, minimumDisplay - elapsed);

  window.setTimeout(() => {
    if (loaderMessageTimer) window.clearInterval(loaderMessageTimer);
    body.classList.add('is-loaded');

    if (!pageLoader || reduceMotion) {
      pageLoader?.remove();
      return;
    }

    pageLoader.classList.add('is-hidden');
    window.setTimeout(() => pageLoader.remove(), 620);
  }, remaining);
}

if (document.readyState === 'complete') {
  finishPageLoader();
} else {
  window.addEventListener('load', finishPageLoader, { once: true });
  window.setTimeout(finishPageLoader, 2800);
}

// Accessible mobile navigation.
function closeNavigation() {
  if (!navPanel || !navToggle) return;
  navPanel.classList.remove('open');
  navToggle.classList.remove('active');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open navigation');
}

navToggle?.addEventListener('click', () => {
  if (!navPanel) return;
  const isOpen = navPanel.classList.toggle('open');
  navToggle.classList.toggle('active', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});

navLinks.forEach((link) => link.addEventListener('click', closeNavigation));

// A flowing indicator glides between navigation links and follows hover intent.
const navWaterIndicator = document.querySelector('.nav-water-indicator');
let activeNavLink = navLinks.find((link) => link.classList.contains('active')) || navLinks[0] || null;

function moveNavWaterIndicator(link, immediate = false) {
  if (!navWaterIndicator || !navPanel || !link || window.innerWidth <= 820) return;
  const panelRect = navPanel.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const width = Math.max(42, linkRect.width + 18);
  const x = linkRect.left - panelRect.left - 9;
  if (immediate) navWaterIndicator.style.transition = 'none';
  navWaterIndicator.style.setProperty('--nav-water-width', `${width}px`);
  navWaterIndicator.style.setProperty('--nav-water-x', `${x}px`);
  navWaterIndicator.classList.add('is-visible');
  if (immediate) window.requestAnimationFrame(() => {
    navWaterIndicator.getBoundingClientRect();
    navWaterIndicator.style.removeProperty('transition');
  });
}

navLinks.forEach((link) => {
  link.addEventListener('mouseenter', () => moveNavWaterIndicator(link));
  link.addEventListener('focus', () => moveNavWaterIndicator(link));
});
navPanel?.addEventListener('mouseleave', () => moveNavWaterIndicator(activeNavLink));
navPanel?.addEventListener('focusout', (event) => {
  if (!navPanel.contains(event.relatedTarget)) moveNavWaterIndicator(activeNavLink);
});
window.addEventListener('load', () => moveNavWaterIndicator(activeNavLink, true), { once: true });
window.addEventListener('resize', () => moveNavWaterIndicator(activeNavLink, true), { passive: true });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navPanel?.classList.contains('open')) {
    closeNavigation();
    navToggle?.focus();
  }
});

// Theme handling. Storage access is guarded for local previews and privacy modes.
let savedTheme = null;
try {
  savedTheme = window.localStorage.getItem('portfolio-theme');
} catch (error) {
  savedTheme = null;
}

if (savedTheme === 'light') body.classList.add('light');

function updateThemeControl() {
  const isLight = body.classList.contains('light');
  if (themeIcon) themeIcon.textContent = isLight ? '☾' : '☼';
  themeToggle?.setAttribute('aria-pressed', String(isLight));
  themeToggle?.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
}

updateThemeControl();

themeToggle?.addEventListener('click', () => {
  body.classList.toggle('light');
  try {
    window.localStorage.setItem('portfolio-theme', body.classList.contains('light') ? 'light' : 'dark');
  } catch (error) {
    // Theme still works for the current session when storage is unavailable.
  }
  updateThemeControl();
});

// Hero word entrance and rotating outcome statement.
const heroStaticTitle = document.querySelector('.hero-title__static');
const heroDynamic = document.querySelector('.hero-title__dynamic');
const heroPhrase = document.querySelector('.hero-title__phrase');
let heroPhraseTimer = null;

if (heroStaticTitle && !heroStaticTitle.querySelector('.hero-word')) {
  const words = heroStaticTitle.textContent.trim().split(/\s+/);
  heroStaticTitle.textContent = '';
  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.className = 'hero-word';
    span.style.setProperty('--word-index', String(index));
    span.textContent = word;
    heroStaticTitle.appendChild(span);
  });
}

function startHeroPhraseRotation() {
  if (reduceMotion || !heroDynamic || !heroPhrase) return;

  let phrases = [];
  try {
    phrases = JSON.parse(heroDynamic.dataset.heroPhrases || '[]');
  } catch (error) {
    phrases = [];
  }

  if (phrases.length < 2) return;
  let phraseIndex = 0;

  const showNextPhrase = () => {
    if (document.hidden) return;
    heroPhrase.classList.remove('is-entering');
    heroPhrase.classList.add('is-exiting');

    window.setTimeout(() => {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      heroPhrase.textContent = phrases[phraseIndex];
      heroPhrase.classList.remove('is-exiting');
      heroPhrase.classList.add('is-entering');
      window.setTimeout(() => heroPhrase.classList.remove('is-entering'), 650);
    }, 360);
  };

  heroPhraseTimer = window.setInterval(showNextPhrase, 3600);
}

window.setTimeout(startHeroPhraseRotation, reduceMotion ? 0 : 2250);

// Reveal-on-scroll with automatic stagger across major grids.
const staggerGroups = document.querySelectorAll(
  '.about-highlights, .project-grid, .cert-list, .skills-cloud, .contact-actions'
);

staggerGroups.forEach((group) => {
  [...group.children].forEach((item, index) => {
    if (item.classList.contains('reveal') && !item.dataset.delay) {
      item.dataset.delay = String(Math.min(index * 85, 340));
    }
    if (item.classList.contains('skill-pill')) {
      item.style.setProperty('--skill-index', String(index));
    }
  });
});

const revealItems = [...document.querySelectorAll('.reveal')];
revealItems.forEach((item) => {
  const delay = item.dataset.delay || 0;
  item.style.setProperty('--delay', `${delay}ms`);
});

if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

// Header state, active navigation, scroll progress, and timeline progress.
const verticalScrollProgress = document.getElementById('verticalScrollProgress');
const verticalScrollRail = verticalScrollProgress?.parentElement;
const timeline = document.querySelector('.timeline');
let scrollFrameRequested = false;

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function updateScrollDrivenUI() {
  scrollFrameRequested = false;
  header?.classList.toggle('scrolled', window.scrollY > 24);

  let current = 'home';
  sections.forEach((section) => {
    const top = section.offsetTop - 160;
    if (window.scrollY >= top) current = section.id;
  });

  navLinks.forEach((link) => {
    const isCurrent = link.getAttribute('href') === `#${current}`;
    link.classList.toggle('active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const nextActiveNavLink = navLinks.find((link) => link.classList.contains('active')) || activeNavLink;
  if (nextActiveNavLink !== activeNavLink) {
    activeNavLink = nextActiveNavLink;
    moveNavWaterIndicator(activeNavLink);
  }

  const scrollableHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const pageProgress = clamp(window.scrollY / scrollableHeight);
  if (verticalScrollProgress) verticalScrollProgress.style.transform = `scaleY(${pageProgress})`;
  if (verticalScrollRail) verticalScrollRail.style.setProperty('--page-progress', pageProgress.toFixed(4));

  if (timeline) {
    const rect = timeline.getBoundingClientRect();
    const startPoint = window.innerHeight * 0.72;
    const endDistance = rect.height + window.innerHeight * 0.18;
    const timelineProgress = clamp((startPoint - rect.top) / endDistance);
    timeline.style.setProperty('--timeline-progress', timelineProgress.toFixed(4));
  }
}

function requestScrollUpdate() {
  if (scrollFrameRequested) return;
  scrollFrameRequested = true;
  window.requestAnimationFrame(updateScrollDrivenUI);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
updateScrollDrivenUI();

// Animated profile counters. Final values stay in the HTML for no-JS accessibility.
const counters = [...document.querySelectorAll('.counter')];
const statsBlock = document.querySelector('.profile-stats');
let countersStarted = false;

function animateCounter(counter) {
  const target = Number(counter.dataset.target);
  const duration = 1300;
  const start = performance.now();
  counter.textContent = '0';

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = String(Math.floor(target * eased));
    if (progress < 1) window.requestAnimationFrame(update);
    else counter.textContent = String(target);
  }

  window.requestAnimationFrame(update);
}

function startCounters() {
  if (countersStarted) return;
  countersStarted = true;
  if (reduceMotion) {
    counters.forEach((counter) => { counter.textContent = counter.dataset.target; });
  } else {
    counters.forEach(animateCounter);
  }
}

if (statsBlock && 'IntersectionObserver' in window) {
  const statsObserver = new IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
      startCounters();
      observer.disconnect();
    }
  }, { threshold: 0.55 });
  statsObserver.observe(statsBlock);
} else {
  startCounters();
}

// Animate numeric results in the About section.
const metricValues = [...document.querySelectorAll('.metric-value')];

function animateMetricValue(element) {
  const original = element.textContent.trim();
  const match = original.match(/^(\d+)(.*)$/);
  if (!match || reduceMotion) return;

  const target = Number(match[1]);
  const suffix = match[2];
  const start = performance.now();
  const duration = 1050;
  element.classList.add('is-counting');

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.floor(target * eased)}${suffix}`;
    if (progress < 1) window.requestAnimationFrame(update);
    else {
      element.textContent = original;
      window.setTimeout(() => element.classList.remove('is-counting'), 500);
    }
  }

  window.requestAnimationFrame(update);
}

if ('IntersectionObserver' in window) {
  const metricObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateMetricValue(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.7 });
  metricValues.forEach((metric) => metricObserver.observe(metric));
}

// 3D tilt cards and magnetic controls.
if (!reduceMotion && finePointer) {
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  });

  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('mousemove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = '';
    });
  });
}

// Pointer-following glow across cards.
const spotlightCards = document.querySelectorAll(
  '.glass-card, .metric-card, .project-card, .cert-card, .tool-stack, .contact-link, .profile-card'
);

spotlightCards.forEach((card) => {
  card.classList.add('spotlight-card');
  if (!reduceMotion && finePointer) {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--pointer-x', `${x}%`);
      card.style.setProperty('--pointer-y', `${y}%`);
    });
  }
});

// Click ripple adds feedback to controls without delaying navigation.
document.querySelectorAll('.btn, .contact-link, .cert-card, .theme-toggle, .back-to-top').forEach((control) => {
  control.classList.add('ripple-host');
  control.addEventListener('pointerdown', (event) => {
    if (reduceMotion) return;
    const rect = control.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 1.45;
    ripple.className = 'interaction-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    control.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 680);
  });
});

// Skills progress animation.
const toolStack = document.querySelector('.tool-stack');
if (toolStack && 'IntersectionObserver' in window) {
  const toolObserver = new IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
      toolStack.classList.add('visible');
      observer.disconnect();
    }
  }, { threshold: 0.42 });
  toolObserver.observe(toolStack);
} else {
  toolStack?.classList.add('visible');
}

// Profile image skeleton.
const profileImage = document.querySelector('.profile-media img');
const profileMedia = profileImage?.closest('.profile-media');
function markProfileImageReady() {
  profileMedia?.classList.add('image-ready');
}
if (profileImage) {
  if (profileImage.complete && profileImage.naturalWidth) markProfileImageReady();
  else {
    profileImage.addEventListener('load', markProfileImageReady, { once: true });
    profileImage.addEventListener('error', markProfileImageReady, { once: true });
  }
}

// Cursor glow.
const glow = document.querySelector('.cursor-glow');
if (!reduceMotion && finePointer && glow) {
  window.addEventListener('pointermove', (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }, { passive: true });
} else if (glow) {
  glow.style.display = 'none';
}

// Ambient particle canvas with visibility-aware pause/resume.
const canvas = document.getElementById('particle-canvas');
const context = canvas?.getContext('2d');
let particles = [];
let particleAnimationFrame = null;
let particlesRunning = false;

function createParticles() {
  const count = Math.min(54, Math.floor(window.innerWidth / 24));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.4 + 0.35,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    alpha: Math.random() * 0.45 + 0.12
  }));
}

function resizeCanvas() {
  if (!canvas || !context) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * ratio);
  canvas.height = Math.round(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  createParticles();
}

function drawParticles() {
  if (!context || !particlesRunning) return;
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const particleColor = body.classList.contains('light') ? '20, 64, 88' : '150, 244, 214';

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
    if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(${particleColor}, ${particle.alpha})`;
    context.fill();

    for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
      const other = particles[otherIndex];
      const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
      if (distance < 115) {
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(other.x, other.y);
        context.strokeStyle = `rgba(${particleColor}, ${(1 - distance / 115) * 0.065})`;
        context.lineWidth = 1;
        context.stroke();
      }
    }
  });

  particleAnimationFrame = window.requestAnimationFrame(drawParticles);
}

function startParticles() {
  if (!canvas || !context || reduceMotion || particlesRunning) return;
  particlesRunning = true;
  drawParticles();
}

function stopParticles() {
  particlesRunning = false;
  if (particleAnimationFrame) window.cancelAnimationFrame(particleAnimationFrame);
  particleAnimationFrame = null;
}

if (!reduceMotion && canvas && context) {
  resizeCanvas();
  startParticles();
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resizeCanvas, 120);
  });
} else if (canvas) {
  canvas.style.display = 'none';
}

// Toast feedback.
const siteToast = document.getElementById('siteToast');
let toastTimer = null;
function showToast(message) {
  if (!siteToast) return;
  window.clearTimeout(toastTimer);
  siteToast.textContent = message;
  siteToast.classList.add('show');
  toastTimer = window.setTimeout(() => siteToast.classList.remove('show'), 2600);
}

// Certificate image modal with image-loading state.
const certificateCards = [...document.querySelectorAll('[data-certificate-image]')];
const certificateModal = document.getElementById('certificateModal');
const certificateModalImage = document.getElementById('certificateModalImage');
const certificateModalTitle = document.getElementById('certificateModalTitle');
const certificateImageWrap = document.getElementById('certificateImageWrap');
const certificateCloseButton = certificateModal?.querySelector('.certificate-modal__close');
let lastCertificateTrigger = null;
let certificateCloseTimer = null;

function openCertificateModal(trigger) {
  if (!certificateModal || !certificateModalImage || !certificateModalTitle) return;

  if (certificateCloseTimer) {
    window.clearTimeout(certificateCloseTimer);
    certificateCloseTimer = null;
  }

  const title = trigger.dataset.certificateTitle || 'Certificate';
  lastCertificateTrigger = trigger;
  trigger.setAttribute('aria-expanded', 'true');
  certificateModalTitle.textContent = title;
  certificateModalImage.alt = `${title} certificate`;
  certificateImageWrap?.classList.add('is-loading');

  certificateModalImage.onload = () => certificateImageWrap?.classList.remove('is-loading');
  certificateModalImage.onerror = () => {
    certificateImageWrap?.classList.remove('is-loading');
    showToast('The certificate image could not be loaded.');
  };
  certificateModalImage.src = trigger.dataset.certificateImage;

  certificateModal.hidden = false;
  body.classList.add('modal-open');

  window.requestAnimationFrame(() => {
    certificateModal.classList.add('open');
    certificateCloseButton?.focus();
  });
}

function closeCertificateModal() {
  if (!certificateModal || certificateModal.hidden) return;

  certificateModal.classList.remove('open');
  body.classList.remove('modal-open');

  const finishClose = () => {
    certificateModal.hidden = true;
    certificateModalImage?.removeAttribute('src');
    if (certificateModalImage) {
      certificateModalImage.alt = '';
      certificateModalImage.onload = null;
      certificateModalImage.onerror = null;
    }
    certificateImageWrap?.classList.remove('is-loading');
    lastCertificateTrigger?.setAttribute('aria-expanded', 'false');
    lastCertificateTrigger?.focus();
    lastCertificateTrigger = null;
    certificateCloseTimer = null;
  };

  if (reduceMotion) finishClose();
  else certificateCloseTimer = window.setTimeout(finishClose, 280);
}

certificateCards.forEach((card) => {
  card.setAttribute('aria-expanded', 'false');
  card.addEventListener('click', () => openCertificateModal(card));
});

certificateModal?.querySelectorAll('[data-certificate-close]').forEach((control) => {
  control.addEventListener('click', closeCertificateModal);
});

certificateModal?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeCertificateModal();
  }

  if (event.key === 'Tab') {
    event.preventDefault();
    certificateCloseButton?.focus();
  }
});

// Update current year.
const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

// Reliable back-to-top control.
const backToTop = document.getElementById('backToTop');
backToTop?.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: reduceMotion ? 'auto' : 'smooth'
  });
});

// CV download: normal relative-file download in the editable build,
// embedded Blob download in the standalone build.
const embeddedCvData = document.getElementById('embedded-cv-data');
document.querySelectorAll('[data-cv-download]').forEach((downloadLink) => {
  downloadLink.addEventListener('click', (event) => {
    showToast('Preparing your CV download…');
    if (!embeddedCvData) return;

    event.preventDefault();
    try {
      const binary = window.atob(embeddedCvData.textContent.trim());
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const temporaryLink = document.createElement('a');
      temporaryLink.href = blobUrl;
      temporaryLink.download = 'Abdul-Moiz-Haider-CV.pdf';
      document.body.appendChild(temporaryLink);
      temporaryLink.click();
      temporaryLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    } catch (error) {
      window.location.href = './Abdul-Moiz-Haider-CV.pdf';
    }
  });
});



// Pause ambient motion when the tab is hidden.
document.addEventListener('visibilitychange', () => {
  body.classList.toggle('page-paused', document.hidden);
  if (document.hidden) stopParticles();
  else startParticles();
});

window.addEventListener('pagehide', () => {
  stopParticles();
  if (heroPhraseTimer) window.clearInterval(heroPhraseTimer);
  if (loaderMessageTimer) window.clearInterval(loaderMessageTimer);
});

// Add a refined animated edge and light trail to portfolio cards.
const auroraCardSelector = [
  '.profile-card',
  '.glass-card',
  '.metric-card',
  '.timeline-card',
  '.project-company',
  '.project-card',
  '.tool-domain-card',
  '.tech-node',
  '.ai-tool',
  '.education-card',
  '.cert-card',
  '.contact-link'
].join(',');

document.querySelectorAll(auroraCardSelector).forEach((card) => {
  if (card.classList.contains('aurora-card')) return;

  card.classList.add('aurora-card');

  const edge = document.createElement('span');
  edge.className = 'card-aurora';
  edge.setAttribute('aria-hidden', 'true');

  const trail = document.createElement('span');
  trail.className = 'card-light-trail';
  trail.setAttribute('aria-hidden', 'true');

  card.append(edge, trail);
});


// Interactive AI Scribe: record first, then publish only a final transcript.
// The preferred route is the included server endpoint using gpt-4o-transcribe.
// Chrome's on-device dictation model is used as a private fallback when available.
const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechRecognitionPhraseApi = window.SpeechRecognitionPhrase;

function formatScribeTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function setTranscriptMessage(container, message, placeholder = true) {
  container.textContent = message;
  container.classList.toggle('is-placeholder', placeholder);
  container.setAttribute('contenteditable', placeholder ? 'false' : 'true');
  container.setAttribute('spellcheck', placeholder ? 'false' : 'true');
}

function normalizeTranscriptText(value) {
  let text = String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();

  // Context-aware correction for the portfolio owner's name without replacing
  // normal uses of the word "movies" in longer sentences.
  const moizVariants = '(?:movies|movie\\s?s|moist|moyes|mohiz|moes|muez|moise)';
  text = text.replace(new RegExp(`\\babdul\\s+${moizVariants}\\b`, 'gi'), 'Abdul Moiz');
  text = text.replace(
    new RegExp(`\\b(my name is|i am|i\\'m|this is)\\s+${moizVariants}\\b`, 'gi'),
    (_, lead) => `${lead} Moiz`
  );
  if (text.split(/\s+/).length <= 3) {
    text = text.replace(new RegExp(`^${moizVariants}\\b`, 'i'), 'Moiz');
  }
  text = text.replace(/\bmoiz\s+(?:hider|hyder|hayder|haider)\b/gi, 'Moiz Haider');
  text = text.replace(/\babdul\s+moiz\s+(?:hider|hyder|hayder|haider)\b/gi, 'Abdul Moiz Haider');

  if (text && !/[.!?]$/.test(text)) text += '.';
  return text;
}

function canonicalTranscriptSegment(value) {
  return normalizeTranscriptText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function chooseRecognitionAlternative(result) {
  const domainTerms = ['moiz', 'abdul', 'haider', 'scribe', 'sequel', 'carecloud', 'askari', 'clinical', 'patient'];
  let selected = null;

  for (let index = 0; index < result.length; index += 1) {
    const alternative = result[index];
    const text = normalizeTranscriptText(alternative?.transcript || '');
    if (!text) continue;

    const confidence = Number.isFinite(alternative.confidence) ? alternative.confidence : 0;
    const lower = text.toLowerCase();
    const termBoost = domainTerms.reduce((score, term) => score + (lower.includes(term) ? .08 : 0), 0);
    const score = confidence + termBoost;

    if (!selected || score > selected.score) selected = { text, confidence, score };
  }

  return selected;
}

function getRecorderOptions() {
  if (!window.MediaRecorder) return undefined;
  const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported?.(type));
  return mimeType ? { mimeType } : undefined;
}

function extensionForMimeType(mimeType = '') {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

async function getOnDeviceRecognitionMode(setStatus) {
  if (!SpeechRecognitionApi) return { available: false, local: false };
  if (typeof SpeechRecognitionApi.available !== 'function') {
    return { available: true, local: false };
  }

  const options = { langs: ['en-US'], processLocally: true, quality: 'dictation' };
  try {
    const availability = await SpeechRecognitionApi.available(options);
    if (availability === 'available') return { available: true, local: true };
    if (availability === 'downloadable' || availability === 'downloading') {
      setStatus('Preparing the on-device dictation model…');
      const installed = await SpeechRecognitionApi.install(options);
      return { available: Boolean(installed), local: Boolean(installed) };
    }
    return { available: true, local: false };
  } catch (error) {
    return { available: true, local: false };
  }
}

async function requestServerTranscript(consoleElement, audioBlob) {
  if (!audioBlob || !audioBlob.size || window.location.protocol === 'file:') return '';

  const endpoint = consoleElement.dataset.transcriptionEndpoint || '/api/transcribe';
  const formData = new FormData();
  const extension = extensionForMimeType(audioBlob.type);
  formData.append('audio', audioBlob, `ai-scribe-recording.${extension}`);
  formData.append('language', 'en');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Transcription endpoint returned ${response.status}`);
    const payload = await response.json();
    return normalizeTranscriptText(payload?.text || '');
  } finally {
    window.clearTimeout(timeout);
  }
}

document.querySelectorAll('[data-scribe-console]').forEach((consoleElement) => {
  const recordButton = consoleElement.querySelector('[data-scribe-record]');
  const playbackButton = consoleElement.querySelector('[data-scribe-playback]');
  const timer = consoleElement.querySelector('[data-session-timer]');
  const status = consoleElement.querySelector('[data-scribe-status] span');
  const transcript = consoleElement.querySelector('[data-scribe-transcript]');
  const waveBars = [...consoleElement.querySelectorAll('[data-scribe-wave] span')];

  if (!recordButton || !timer || !status || !transcript) return;

  let isRecording = false;
  let isProcessing = false;
  let mediaStream = null;
  let mediaRecorder = null;
  let audioContext = null;
  let analyser = null;
  let waveformFrame = 0;
  let timerInterval = 0;
  let elapsedSeconds = 0;
  let recognition = null;
  let recognitionShouldRun = false;
  let recognitionRestartTimer = 0;
  let acceptedSegments = [];
  let recordedChunks = [];
  let recordingBlob = null;
  let recordingUrl = '';
  let playbackAudio = null;
  let voiceActivityMs = 0;
  let peakRms = 0;
  let previousWaveTimestamp = 0;

  const setStatus = (message) => { status.textContent = message; };

  const resetWave = () => {
    waveBars.forEach((bar) => {
      bar.style.removeProperty('transform');
      bar.style.removeProperty('opacity');
    });
  };

  const stopWaveform = () => {
    if (waveformFrame) cancelAnimationFrame(waveformFrame);
    waveformFrame = 0;
    previousWaveTimestamp = 0;
    resetWave();
  };

  const drawWaveform = (timestamp = performance.now()) => {
    if (!analyser || !isRecording) return;
    const timeData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeData);

    let squareSum = 0;
    for (const sample of timeData) {
      const normalized = (sample - 128) / 128;
      squareSum += normalized * normalized;
    }
    const rms = Math.sqrt(squareSum / timeData.length);
    peakRms = Math.max(peakRms, rms);

    const frameDelta = previousWaveTimestamp ? Math.min(timestamp - previousWaveTimestamp, 80) : 16;
    previousWaveTimestamp = timestamp;
    if (rms > .022) voiceActivityMs += frameDelta;

    waveBars.forEach((bar, index) => {
      const sampleIndex = Math.floor((index / Math.max(1, waveBars.length - 1)) * (timeData.length - 1));
      const amplitude = Math.abs((timeData[sampleIndex] - 128) / 128);
      const scale = .32 + Math.min(1.55, amplitude * 4.8 + rms * 5.2);
      bar.style.transform = `scaleY(${scale.toFixed(2)})`;
      bar.style.opacity = String(Math.min(1, .52 + amplitude * 2.2 + rms));
    });

    waveformFrame = requestAnimationFrame(drawWaveform);
  };

  const stopTimer = () => {
    if (timerInterval) window.clearInterval(timerInterval);
    timerInterval = 0;
  };

  const startTimer = () => {
    elapsedSeconds = 0;
    timer.textContent = formatScribeTime(elapsedSeconds);
    stopTimer();
    timerInterval = window.setInterval(() => {
      elapsedSeconds += 1;
      timer.textContent = formatScribeTime(elapsedSeconds);
    }, 1000);
  };

  const stopPlayback = () => {
    if (!playbackAudio) return;
    playbackAudio.pause();
    playbackAudio.currentTime = 0;
    playbackAudio = null;
    playbackButton?.classList.remove('is-playing');
    playbackButton?.setAttribute('aria-label', 'Play captured recording');
    playbackButton?.setAttribute('title', 'Play captured recording');
  };

  const prepareRecognition = async () => {
    if (!SpeechRecognitionApi) return null;
    const mode = await getOnDeviceRecognitionMode(setStatus);
    if (!mode.available) return null;

    const speechRecognition = new SpeechRecognitionApi();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = false;
    speechRecognition.maxAlternatives = 5;
    speechRecognition.lang = 'en-US';
    if ('processLocally' in speechRecognition) speechRecognition.processLocally = mode.local;
    if ('quality' in speechRecognition) speechRecognition.quality = 'dictation';

    if ('phrases' in speechRecognition && SpeechRecognitionPhraseApi) {
      try {
        speechRecognition.phrases = [
          new SpeechRecognitionPhraseApi('Abdul Moiz Haider', 10),
          new SpeechRecognitionPhraseApi('Moiz', 10),
          new SpeechRecognitionPhraseApi('AI Scribe', 8),
          new SpeechRecognitionPhraseApi('Sequel Technologies', 7),
          new SpeechRecognitionPhraseApi('CareCloud', 7),
          new SpeechRecognitionPhraseApi('Askari Bank', 7)
        ];
      } catch (error) {
        // Contextual biasing is optional and experimental.
      }
    }

    speechRecognition.onresult = (event) => {
      if (voiceActivityMs < 260) return;
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result.isFinal) continue;
        const selected = chooseRecognitionAlternative(result);
        if (!selected) continue;

        // Engines that expose confidence must meet a reasonable threshold.
        if (selected.confidence > 0 && selected.confidence < .42) continue;
        const canonical = canonicalTranscriptSegment(selected.text);
        const lastCanonical = canonicalTranscriptSegment(acceptedSegments.at(-1) || '');
        if (!canonical || canonical === lastCanonical) continue;
        acceptedSegments.push(selected.text);
      }
    };

    speechRecognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'language-not-supported') {
        recognitionShouldRun = false;
        setStatus('Recording audio · the local language model is unavailable');
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        recognitionShouldRun = false;
        setStatus('Recording audio · speech recognition permission is unavailable');
      }
    };

    speechRecognition.onend = () => {
      if (!recognitionShouldRun || !isRecording) return;
      window.clearTimeout(recognitionRestartTimer);
      recognitionRestartTimer = window.setTimeout(() => {
        if (!recognitionShouldRun || !isRecording) return;
        try { speechRecognition.start(); } catch (error) { /* already starting */ }
      }, 300);
    };

    return speechRecognition;
  };

  const finalizeMediaRecorder = () => new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      resolve(recordingBlob);
      return;
    }

    mediaRecorder.addEventListener('stop', () => {
      if (recordedChunks.length) {
        const mimeType = mediaRecorder.mimeType || recordedChunks[0].type || 'audio/webm';
        recordingBlob = new Blob(recordedChunks, { type: mimeType });
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        recordingUrl = URL.createObjectURL(recordingBlob);
        playbackButton?.removeAttribute('hidden');
      }
      resolve(recordingBlob);
    }, { once: true });

    mediaRecorder.stop();
  });

  const releaseRecordingResources = () => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    audioContext = null;
    analyser = null;
  };

  const stopRecording = async () => {
    if (!isRecording || isProcessing) return;
    isRecording = false;
    isProcessing = true;
    recognitionShouldRun = false;
    window.clearTimeout(recognitionRestartTimer);
    recordButton.disabled = true;
    recordButton.setAttribute('aria-pressed', 'false');
    recordButton.setAttribute('aria-label', 'Processing recording');
    recordButton.setAttribute('title', 'Processing recording');
    consoleElement.classList.remove('is-recording');
    consoleElement.classList.add('is-processing');
    stopTimer();
    stopWaveform();
    setStatus('Processing the final transcription…');
    setTranscriptMessage(transcript, 'Checking the recording and preparing the final text…', true);

    const audioBlobPromise = finalizeMediaRecorder();
    try { recognition?.stop(); } catch (error) { /* recognizer may already be stopped */ }
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    recognition = null;

    const audioBlob = await audioBlobPromise;
    releaseRecordingResources();

    const hasClearSpeech = voiceActivityMs >= 380 && peakRms >= .024;
    let finalText = '';
    let usedServerModel = false;

    if (hasClearSpeech && audioBlob) {
      try {
        finalText = await requestServerTranscript(consoleElement, audioBlob);
        usedServerModel = Boolean(finalText);
      } catch (error) {
        finalText = '';
      }
    }

    if (!finalText && hasClearSpeech && acceptedSegments.length) {
      finalText = normalizeTranscriptText(acceptedSegments.join(' '));
    }

    consoleElement.classList.remove('is-processing');
    consoleElement.classList.add('is-complete');

    if (!hasClearSpeech) {
      setTranscriptMessage(transcript, 'No clear speech was detected. Move closer to the microphone and try again.', true);
      setStatus('Recording captured · no clear speech detected');
      consoleElement.classList.remove('has-transcript');
    } else if (finalText) {
      setTranscriptMessage(transcript, finalText, false);
      consoleElement.classList.add('has-transcript');
      setStatus(usedServerModel ? 'Final transcription ready · high-accuracy model' : 'Final transcription ready · on-device dictation');
    } else {
      setTranscriptMessage(
        transcript,
        'The audio was recorded, but a reliable transcription was not available. Use Chrome on HTTPS/localhost or run the included stable transcription server.',
        true
      );
      setStatus('Recording captured · reliable transcription unavailable');
      consoleElement.classList.remove('has-transcript');
    }

    isProcessing = false;
    recordButton.disabled = false;
    recordButton.setAttribute('aria-label', 'Start a new recording');
    recordButton.setAttribute('title', 'Start a new recording');
  };

  const startRecording = async () => {
    if (isProcessing) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus('Microphone recording needs a modern browser on HTTPS or localhost');
      return;
    }

    try {
      stopPlayback();
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      recordingUrl = '';
      playbackButton?.setAttribute('hidden', '');
      recordedChunks = [];
      recordingBlob = null;
      acceptedSegments = [];
      voiceActivityMs = 0;
      peakRms = 0;
      transcript.classList.add('is-placeholder');
      setTranscriptMessage(transcript, 'Recording in progress. Stop when you finish speaking; only the final transcript will be shown.', true);
      consoleElement.classList.remove('is-complete', 'is-processing', 'has-transcript');

      recognition = await prepareRecognition();
      recognitionShouldRun = Boolean(recognition);

      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      const AudioContextApi = window.AudioContext || window.webkitAudioContext;
      if (AudioContextApi) {
        audioContext = new AudioContextApi();
        await audioContext.resume();
        const source = audioContext.createMediaStreamSource(mediaStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = .68;
        source.connect(analyser);
      }

      mediaRecorder = new MediaRecorder(mediaStream, getRecorderOptions());
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) recordedChunks.push(event.data);
      });
      mediaRecorder.start(300);

      if (recognition) {
        try { recognition.start(); } catch (error) { recognitionShouldRun = false; }
      }

      isRecording = true;
      recordButton.setAttribute('aria-pressed', 'true');
      recordButton.setAttribute('aria-label', 'Stop recording and transcribe');
      recordButton.setAttribute('title', 'Stop recording and transcribe');
      consoleElement.classList.add('is-recording');
      setStatus('Recording clearly · final transcription appears after you stop');
      startTimer();
      if (analyser) drawWaveform();
    } catch (error) {
      releaseRecordingResources();
      stopWaveform();
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
        setStatus('Microphone permission was blocked. Allow access and try again.');
      } else if (error?.name === 'NotFoundError') {
        setStatus('No microphone was found on this device.');
      } else {
        setStatus('The recorder could not start. Please try Chrome on HTTPS or localhost.');
      }
    }
  };

  recordButton.addEventListener('click', () => {
    if (isRecording) void stopRecording();
    else void startRecording();
  });

  playbackButton?.addEventListener('click', () => {
    if (!recordingUrl) return;
    if (playbackAudio && !playbackAudio.paused) {
      stopPlayback();
      setStatus('Recording captured · playback stopped');
      return;
    }

    playbackAudio = new Audio(recordingUrl);
    playbackButton.classList.add('is-playing');
    playbackButton.setAttribute('aria-label', 'Stop recording playback');
    playbackButton.setAttribute('title', 'Stop recording playback');
    setStatus('Playing captured recording…');
    playbackAudio.addEventListener('ended', () => {
      playbackAudio = null;
      playbackButton.classList.remove('is-playing');
      playbackButton.setAttribute('aria-label', 'Play captured recording');
      playbackButton.setAttribute('title', 'Play captured recording');
      setStatus(transcript.classList.contains('is-placeholder') ? 'Recording captured' : 'Final transcription ready');
    }, { once: true });
    playbackAudio.play().catch(() => {
      stopPlayback();
      setStatus('Playback could not start in this browser');
    });
  });

  window.addEventListener('pagehide', () => {
    recognitionShouldRun = false;
    try { recognition?.abort(); } catch (error) { /* no-op */ }
    if (isRecording && mediaRecorder?.state !== 'inactive') mediaRecorder.stop();
    releaseRecordingResources();
    stopPlayback();
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  });
});

/* ------------------------------------------------------------
   Aurora Rush — original self-contained canvas racing mini-game
   ------------------------------------------------------------ */
(() => {
  const modal = document.getElementById('portfolioGameModal');
  const shell = document.getElementById('portfolioGameShell');
  const canvas = document.getElementById('portfolioRaceCanvas');
  if (!modal || !shell || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false });
  const openButtons = [...document.querySelectorAll('[data-game-open]')];
  const closeButtons = [...modal.querySelectorAll('[data-game-close]')];
  const startButton = modal.querySelector('[data-game-start]');
  const restartButtons = [...modal.querySelectorAll('[data-game-restart]')];
  const resumeButton = modal.querySelector('[data-game-resume]');
  const soundButton = modal.querySelector('[data-game-sound]');
  const carOptions = [...modal.querySelectorAll('[data-game-car]')];
  const showCar = modal.querySelector('[data-game-showcar]');
  const startPanel = document.getElementById('gameStartPanel');
  const pausePanel = document.getElementById('gamePausePanel');
  const resultPanel = document.getElementById('gameResultPanel');
  const statusElement = document.getElementById('gameStatus');
  const speedElement = document.getElementById('gameSpeed');
  const distanceElement = document.getElementById('gameDistance');
  const scoreElement = document.getElementById('gameScore');
  const nitroElement = document.getElementById('gameNitroBar');
  const damageElement = document.getElementById('gameDamageBar');
  const damageValueElement = document.getElementById('gameDamageValue');
  const impactElement = document.getElementById('gameImpactMessage');
  const vehiclePhoto = modal.querySelector('[data-game-vehicle-photo]');
  const vehiclePhotoName = modal.querySelector('[data-game-vehicle-name]');
  const resultTitle = document.getElementById('gameResultTitle');
  const resultDistance = document.getElementById('gameResultDistance');
  const resultScore = document.getElementById('gameResultScore');
  const bestScore = document.getElementById('gameBestScore');
  const specLaunch = document.getElementById('gameSpecLaunch');
  const specSpeed = document.getElementById('gameSpecSpeed');
  const specHandling = document.getElementById('gameSpecHandling');
  const touchControls = [...modal.querySelectorAll('[data-game-control]')];

  const cars = {
    apex: {
      name: 'Aurelia Sovereign Sedan', badge: 'AURELIA', kind: 'sedan', topSpeed: 278, acceleration: 96, handling: 1.01,
      launch: '4.8s', handlingLabel: '92', primary: '#f4f1ea', secondary: '#5c6470', heightRatio: .55,
      preview: 'assets/vehicles/aurelia-sovereign.svg', photoPosition: '50% 52%'
    },
    volt: {
      name: 'Velaris Royal SUV', badge: 'VELARIS', kind: 'luxurySuv', topSpeed: 264, acceleration: 92, handling: .97,
      launch: '5.3s', handlingLabel: '89', primary: '#263b4f', secondary: '#0c1722', heightRatio: .66,
      preview: 'assets/vehicles/velaris-royal.svg', photoPosition: '50% 52%'
    },
    titan: {
      name: 'Vantoro V12 Supercar', badge: 'VANTORO', kind: 'supercar', topSpeed: 332, acceleration: 124, handling: 1.13,
      launch: '2.9s', handlingLabel: '97', primary: '#b51f35', secondary: '#31060e', heightRatio: .47,
      preview: 'assets/vehicles/vantoro-v12.svg', photoPosition: '50% 54%'
    }
  };

  const vehicleProfiles = {
    sedan: { width: .96, height: .59, collisionWidth: .48, collisionHeight: .58 },
    luxurySuv: { width: 1.02, height: .72, collisionWidth: .52, collisionHeight: .66 },
    grandTourer: { width: .96, height: .55, collisionWidth: .47, collisionHeight: .56 },
    supercar: { width: .94, height: .48, collisionWidth: .46, collisionHeight: .5 }
  };

  const trafficModels = [
    { kind: 'sedan', badge: 'AURELIA', plate: 'ROYAL 1', speed: 128, colors: ['#f7f4ed', '#a8a7a2', '#34373d'] },
    { kind: 'luxurySuv', badge: 'VELARIS', plate: 'VIP 777', speed: 118, colors: ['#445c70', '#1d3243', '#08131d'] },
    { kind: 'supercar', badge: 'VANTORO', plate: 'V12 001', speed: 176, colors: ['#e04455', '#9b1328', '#2a0209'] },
    { kind: 'grandTourer', badge: 'MONARCH', plate: 'GT 888', speed: 152, colors: ['#d7d9dc', '#6f7781', '#191f27'] },
    { kind: 'sedan', badge: 'LUMIERE', plate: 'LUX 09', speed: 136, colors: ['#d8c49b', '#8a6a35', '#2d1b08'] },
    { kind: 'luxurySuv', badge: 'REGENT', plate: 'EXEC 5', speed: 122, colors: ['#315942', '#173a29', '#07180f'] },
    { kind: 'supercar', badge: 'NOCTURNE', plate: 'NITE 7', speed: 184, colors: ['#6e62a9', '#342a72', '#0d0927'] },
    { kind: 'grandTourer', badge: 'IMPERIA', plate: 'ELITE 8', speed: 158, colors: ['#eef1f4', '#929ca8', '#252d36'] }
  ];

  const state = {
    open: false,
    running: false,
    paused: false,
    finished: false,
    selectedCar: 'apex',
    speed: 0,
    distanceKm: 0,
    trackMeters: 0,
    score: 0,
    nitro: 100,
    playerX: 0,
    damage: 0,
    collisionFlash: 0,
    collisionCooldown: 0,
    hitStop: 0,
    cameraShake: 0,
    playerKick: 0,
    impactMessageTime: 0,
    particles: [],
    boostGlow: 0,
    lastTime: 0,
    animationFrame: 0,
    lastFocused: null,
    traffic: [],
    scenerySeed: Math.random() * 1000,
    soundOn: false,
    audioContext: null,
    engineOscillator: null,
    engineOscillatorTwo: null,
    engineGain: null,
    engineFilter: null
  };

  const controls = {
    accelerate: false,
    brake: false,
    left: false,
    right: false,
    boost: false
  };

  let viewWidth = 1280;
  let viewHeight = 660;
  let dpr = 1;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const ease = (value) => value * value * (3 - 2 * value);
  const hash = (value) => {
    const x = Math.sin(value * 12.9898 + state.scenerySeed) * 43758.5453;
    return x - Math.floor(x);
  };

  function resizeGameCanvas() {
    const rect = shell.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    viewWidth = rect.width;
    viewHeight = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewWidth * dpr);
    canvas.height = Math.round(viewHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  function roadCurveAt(worldMeters) {
    return (
      Math.sin(worldMeters * .00225) * .56 +
      Math.sin(worldMeters * .00091 + 1.6) * .34 +
      Math.sin(worldMeters * .0068 + .4) * .12
    );
  }

  function hillAt(worldMeters) {
    return (
      Math.sin(worldMeters * .0018 + .7) * .55 +
      Math.sin(worldMeters * .0044) * .19
    );
  }

  function roadGeometry(relativeMeters) {
    const viewDistance = 900;
    const t = clamp(1 - relativeMeters / viewDistance, 0, 1);
    const perspective = Math.pow(t, 2.03);
    const horizon = viewHeight * (.295 + hillAt(state.trackMeters) * .014);
    const bottom = viewHeight * 1.04;
    const y = horizon + perspective * (bottom - horizon);
    const halfWidth = lerp(viewWidth * .011, viewWidth * .49, Math.pow(t, 1.18));
    const futureCurve = roadCurveAt(state.trackMeters + relativeMeters);
    const currentCurve = roadCurveAt(state.trackMeters);
    const curveShift = (futureCurve - currentCurve * .22) * viewWidth * (.19 + .12 * (1 - t));
    const playerShift = state.playerX * halfWidth * .58;
    const center = viewWidth * .5 + curveShift - playerShift;
    return { t, y, halfWidth, center, horizon };
  }

  function roundedRectPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width * .5, height * .5);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawSky(timeSeconds) {
    const horizon = viewHeight * (.295 + hillAt(state.trackMeters) * .014);
    const sky = ctx.createLinearGradient(0, 0, 0, horizon * 1.25);
    sky.addColorStop(0, '#04101e');
    sky.addColorStop(.48, '#142b48');
    sky.addColorStop(.74, '#405278');
    sky.addColorStop(1, '#b38ca8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    const glowX = viewWidth * (.72 + Math.sin(state.trackMeters * .00016) * .025);
    const glowY = horizon * .63;
    const glow = ctx.createRadialGradient(glowX, glowY, 2, glowX, glowY, viewWidth * .18);
    glow.addColorStop(0, 'rgba(255,245,218,.95)');
    glow.addColorStop(.08, 'rgba(235,143,255,.5)');
    glow.addColorStop(.38, 'rgba(143,168,255,.14)');
    glow.addColorStop(1, 'rgba(143,168,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, viewWidth, horizon * 1.2);

    ctx.fillStyle = 'rgba(255,246,224,.9)';
    ctx.beginPath();
    ctx.arc(glowX, glowY, Math.max(9, viewWidth * .012), 0, Math.PI * 2);
    ctx.fill();

    const cloudOffset = (state.trackMeters * .012) % (viewWidth * .9);
    ctx.globalAlpha = .18;
    ctx.fillStyle = '#d6e5f3';
    for (let i = 0; i < 6; i += 1) {
      const x = ((i * viewWidth * .24 - cloudOffset + viewWidth * 1.4) % (viewWidth * 1.4)) - viewWidth * .2;
      const y = horizon * (.25 + (i % 3) * .12);
      ctx.beginPath();
      ctx.ellipse(x, y, viewWidth * .09, viewHeight * .018, 0, 0, Math.PI * 2);
      ctx.ellipse(x + viewWidth * .055, y - 4, viewWidth * .065, viewHeight * .014, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawMountainLayer(horizon, .18, '#283c5f', .42, 18);
    drawMountainLayer(horizon, .1, '#1d324e', .6, 31);
    drawMountainLayer(horizon, .035, '#13283f', .78, 47);

    const haze = ctx.createLinearGradient(0, horizon * .58, 0, horizon * 1.12);
    haze.addColorStop(0, 'rgba(190,184,217,0)');
    haze.addColorStop(1, 'rgba(152,183,207,.18)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, horizon * .5, viewWidth, horizon * .7);

    if (state.speed > 230 && state.running) {
      ctx.strokeStyle = `rgba(215,235,255,${clamp((state.speed - 220) / 340, 0, .22)})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 18; i += 1) {
        const seed = hash(i * 21.3 + Math.floor(timeSeconds * 12));
        const x = seed * viewWidth;
        const y = hash(i * 8.7 + 3) * viewHeight;
        const length = 10 + state.speed * .08 * hash(i + 12);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - length * (x < viewWidth / 2 ? 1 : -1), y + length * .18);
        ctx.stroke();
      }
    }
  }

  function drawMountainLayer(horizon, baseOffset, color, amplitude, frequency) {
    const curveParallax = roadCurveAt(state.trackMeters + frequency * 22) * viewWidth * baseOffset;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, horizon + viewHeight * .15);
    for (let x = 0; x <= viewWidth + 12; x += 12) {
      const nx = (x + curveParallax) / viewWidth;
      const ridge =
        Math.sin(nx * frequency + state.scenerySeed * .02) * .46 +
        Math.sin(nx * frequency * .43 + 1.7) * .34 +
        Math.sin(nx * frequency * 1.7 + .8) * .2;
      const y = horizon - ridge * viewHeight * .11 * amplitude + viewHeight * baseOffset;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(viewWidth, horizon + viewHeight * .18);
    ctx.closePath();
    ctx.fill();
  }

  function drawRoad() {
    const slices = 118;
    let previous = roadGeometry(900);
    const horizon = previous.horizon;

    const land = ctx.createLinearGradient(0, horizon, 0, viewHeight);
    land.addColorStop(0, '#203d46');
    land.addColorStop(.45, '#173c38');
    land.addColorStop(1, '#102b2b');
    ctx.fillStyle = land;
    ctx.fillRect(0, horizon, viewWidth, viewHeight - horizon);

    for (let i = 1; i <= slices; i += 1) {
      const relative = 900 * (1 - i / slices);
      const current = roadGeometry(relative);
      const worldBand = Math.floor((state.trackMeters + relative) / 24);
      const alternate = worldBand % 2 === 0;

      ctx.fillStyle = alternate ? '#173b36' : '#1a4039';
      ctx.beginPath();
      ctx.moveTo(0, previous.y);
      ctx.lineTo(previous.center - previous.halfWidth, previous.y);
      ctx.lineTo(current.center - current.halfWidth, current.y);
      ctx.lineTo(0, current.y);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(previous.center + previous.halfWidth, previous.y);
      ctx.lineTo(viewWidth, previous.y);
      ctx.lineTo(viewWidth, current.y);
      ctx.lineTo(current.center + current.halfWidth, current.y);
      ctx.closePath();
      ctx.fill();

      const roadGradient = ctx.createLinearGradient(0, previous.y, 0, current.y);
      roadGradient.addColorStop(0, alternate ? '#28313c' : '#2b3540');
      roadGradient.addColorStop(1, alternate ? '#1d2630' : '#202a34');
      ctx.fillStyle = roadGradient;
      ctx.beginPath();
      ctx.moveTo(previous.center - previous.halfWidth, previous.y);
      ctx.lineTo(previous.center + previous.halfWidth, previous.y);
      ctx.lineTo(current.center + current.halfWidth, current.y);
      ctx.lineTo(current.center - current.halfWidth, current.y);
      ctx.closePath();
      ctx.fill();

      const curbWidthPrev = Math.max(1, previous.halfWidth * .035);
      const curbWidthCurrent = Math.max(1, current.halfWidth * .035);
      ctx.fillStyle = alternate ? '#d8e4ec' : '#63758c';
      ctx.beginPath();
      ctx.moveTo(previous.center - previous.halfWidth, previous.y);
      ctx.lineTo(previous.center - previous.halfWidth + curbWidthPrev, previous.y);
      ctx.lineTo(current.center - current.halfWidth + curbWidthCurrent, current.y);
      ctx.lineTo(current.center - current.halfWidth, current.y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(previous.center + previous.halfWidth - curbWidthPrev, previous.y);
      ctx.lineTo(previous.center + previous.halfWidth, previous.y);
      ctx.lineTo(current.center + current.halfWidth, current.y);
      ctx.lineTo(current.center + current.halfWidth - curbWidthCurrent, current.y);
      ctx.closePath();
      ctx.fill();

      if (worldBand % 6 < 3 && current.t > .05) {
        ctx.fillStyle = `rgba(231,238,244,${.28 + current.t * .48})`;
        [-1 / 3, 1 / 3].forEach((lane) => {
          const x1 = previous.center + previous.halfWidth * lane;
          const x2 = current.center + current.halfWidth * lane;
          const width1 = Math.max(.5, previous.halfWidth * .007);
          const width2 = Math.max(.6, current.halfWidth * .007);
          ctx.beginPath();
          ctx.moveTo(x1 - width1, previous.y);
          ctx.lineTo(x1 + width1, previous.y);
          ctx.lineTo(x2 + width2, current.y);
          ctx.lineTo(x2 - width2, current.y);
          ctx.closePath();
          ctx.fill();
        });
      }

      previous = current;
    }

    drawRoadsideObjects();
  }

  function drawRoadsideObjects() {
    const spacing = 38;
    const start = Math.floor(state.trackMeters / spacing) * spacing;
    const objects = [];
    for (let world = start; world < state.trackMeters + 900; world += spacing) {
      const relative = world - state.trackMeters;
      if (relative < 24 || relative > 890) continue;
      const seed = hash(world * .113);
      if (seed < .26) continue;
      objects.push({ world, relative, seed });
    }

    objects.sort((a, b) => b.relative - a.relative).forEach((object) => {
      const geometry = roadGeometry(object.relative);
      const scale = Math.pow(geometry.t, 1.55);
      if (scale < .012) return;
      const side = hash(object.world * .31) > .5 ? 1 : -1;
      const offset = geometry.halfWidth * (1.18 + hash(object.world * .77) * .82);
      const x = geometry.center + side * offset;
      const y = geometry.y;
      const type = hash(object.world * 1.71);

      if (type > .82 && scale > .08) {
        drawRoadSign(x, y, scale, side);
      } else if (type > .55) {
        drawTree(x, y, scale, '#153b35', '#27634f');
      } else {
        drawTree(x, y, scale * .82, '#172f39', '#31576a');
      }
    });
  }

  function drawTree(x, y, scale, trunkColor, leafColor) {
    const height = 17 + scale * 115;
    const width = height * .44;
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.ellipse(x + width * .08, y + 2, width * .58, height * .09, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = trunkColor;
    ctx.fillRect(x - width * .06, y - height * .38, width * .12, height * .4);
    ctx.fillStyle = leafColor;
    for (let i = 0; i < 3; i += 1) {
      const top = y - height * (.4 + i * .2);
      const layerWidth = width * (1 - i * .16);
      ctx.beginPath();
      ctx.moveTo(x, top - height * .25);
      ctx.lineTo(x - layerWidth, top + height * .2);
      ctx.lineTo(x + layerWidth, top + height * .2);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawRoadSign(x, y, scale, side) {
    const height = 18 + scale * 82;
    const width = height * .62;
    ctx.strokeStyle = '#a7b6c2';
    ctx.lineWidth = Math.max(1, scale * 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - height * .72);
    ctx.stroke();
    roundedRectPath(ctx, x - width * .5, y - height, width, height * .38, Math.max(2, scale * 6));
    const gradient = ctx.createLinearGradient(x - width * .5, 0, x + width * .5, 0);
    gradient.addColorStop(0, '#6f83ff');
    gradient.addColorStop(1, '#69e8bd');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.fillStyle = '#07111f';
    ctx.font = `${Math.max(5, scale * 13)}px Manrope, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(side > 0 ? 'RUSH' : 'APEX', x, y - height * .81);
  }

  function drawTrafficCar(vehicle) {
    const geometry = roadGeometry(vehicle.relative);
    if (geometry.t <= .015 || geometry.t >= 1.08) return;
    const size = 10 + Math.pow(geometry.t, 1.72) * Math.min(165, viewWidth * .132);
    const crashOffset = vehicle.crashed ? vehicle.crashOffset : 0;
    const x = geometry.center + (vehicle.lane + crashOffset) * geometry.halfWidth * .76;
    const y = geometry.y - size * .12;
    vehicle.screenX = x;
    vehicle.screenY = y;
    vehicle.screenSize = size;

    const profile = vehicleProfiles[vehicle.kind] || vehicleProfiles.sedan;
    const vehicleWidth = size * profile.width;
    const vehicleHeight = size * profile.height;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((vehicle.crashed ? vehicle.spin : 0) + Math.sin(vehicle.relative * .018) * .004);

    const shadow = ctx.createRadialGradient(0, vehicleHeight * .31, 1, 0, vehicleHeight * .31, vehicleWidth * .82);
    shadow.addColorStop(0, 'rgba(0,0,0,.58)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, vehicleHeight * .31, vehicleWidth * .66, vehicleHeight * .19, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#040507';
    roundedRectPath(ctx, -vehicleWidth * .51, vehicleHeight * .01, vehicleWidth * .13, vehicleHeight * .45, vehicleWidth * .045);
    ctx.fill();
    roundedRectPath(ctx, vehicleWidth * .38, vehicleHeight * .01, vehicleWidth * .13, vehicleHeight * .45, vehicleWidth * .045);
    ctx.fill();

    const bodyGradient = ctx.createLinearGradient(-vehicleWidth * .52, -vehicleHeight * .62, vehicleWidth * .48, vehicleHeight * .5);
    bodyGradient.addColorStop(0, vehicle.colorLight);
    bodyGradient.addColorStop(.46, vehicle.color);
    bodyGradient.addColorStop(1, vehicle.colorDark);
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    if (vehicle.kind === 'luxurySuv') {
      ctx.moveTo(-vehicleWidth * .48, vehicleHeight * .32);
      ctx.lineTo(-vehicleWidth * .5, -vehicleHeight * .13);
      ctx.quadraticCurveTo(-vehicleWidth * .46, -vehicleHeight * .5, -vehicleWidth * .29, -vehicleHeight * .59);
      ctx.lineTo(vehicleWidth * .29, -vehicleHeight * .59);
      ctx.quadraticCurveTo(vehicleWidth * .46, -vehicleHeight * .5, vehicleWidth * .5, -vehicleHeight * .13);
      ctx.lineTo(vehicleWidth * .48, vehicleHeight * .32);
    } else if (vehicle.kind === 'supercar') {
      ctx.moveTo(-vehicleWidth * .5, vehicleHeight * .28);
      ctx.lineTo(-vehicleWidth * .47, -vehicleHeight * .04);
      ctx.lineTo(-vehicleWidth * .31, -vehicleHeight * .35);
      ctx.quadraticCurveTo(0, -vehicleHeight * .57, vehicleWidth * .31, -vehicleHeight * .35);
      ctx.lineTo(vehicleWidth * .47, -vehicleHeight * .04);
      ctx.lineTo(vehicleWidth * .5, vehicleHeight * .28);
    } else {
      ctx.moveTo(-vehicleWidth * .49, vehicleHeight * .31);
      ctx.lineTo(-vehicleWidth * .48, -vehicleHeight * .02);
      ctx.lineTo(-vehicleWidth * .34, -vehicleHeight * .43);
      ctx.quadraticCurveTo(0, -vehicleHeight * .6, vehicleWidth * .34, -vehicleHeight * .43);
      ctx.lineTo(vehicleWidth * .48, -vehicleHeight * .02);
      ctx.lineTo(vehicleWidth * .49, vehicleHeight * .31);
    }
    ctx.quadraticCurveTo(0, vehicleHeight * .47, -vehicleWidth * .48, vehicleHeight * .32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.24)';
    ctx.lineWidth = Math.max(1, size * .008);
    ctx.stroke();

    const glassTop = vehicle.kind === 'luxurySuv' ? -.52 : vehicle.kind === 'supercar' ? -.4 : -.49;
    const glassBottom = vehicle.kind === 'supercar' ? -.11 : -.13;
    ctx.fillStyle = 'rgba(5,13,21,.95)';
    ctx.beginPath();
    ctx.moveTo(-vehicleWidth * (vehicle.kind === 'supercar' ? .23 : .28), vehicleHeight * glassTop);
    ctx.lineTo(vehicleWidth * (vehicle.kind === 'supercar' ? .23 : .28), vehicleHeight * glassTop);
    ctx.lineTo(vehicleWidth * .34, vehicleHeight * glassBottom);
    ctx.lineTo(-vehicleWidth * .34, vehicleHeight * glassBottom);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(178,218,238,.25)';
    ctx.beginPath();
    ctx.moveTo(-vehicleWidth * .21, vehicleHeight * (glassTop + .04));
    ctx.lineTo(-vehicleWidth * .04, vehicleHeight * (glassTop + .04));
    ctx.lineTo(vehicleWidth * .06, vehicleHeight * (glassBottom - .03));
    ctx.lineTo(-vehicleWidth * .28, vehicleHeight * (glassBottom - .03));
    ctx.closePath();
    ctx.fill();

    // Premium LED signatures
    ctx.shadowColor = '#ff294c';
    ctx.shadowBlur = size * .1;
    if (vehicle.kind === 'luxurySuv') {
      ctx.fillStyle = '#ff3a52';
      roundedRectPath(ctx, -vehicleWidth * .41, -vehicleHeight * .01, vehicleWidth * .1, vehicleHeight * .23, vehicleHeight * .025);
      ctx.fill();
      roundedRectPath(ctx, vehicleWidth * .31, -vehicleHeight * .01, vehicleWidth * .1, vehicleHeight * .23, vehicleHeight * .025);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,68,90,.78)';
      ctx.fillRect(-vehicleWidth * .31, vehicleHeight * .06, vehicleWidth * .62, Math.max(1, vehicleHeight * .025));
    } else if (vehicle.kind === 'supercar') {
      ctx.strokeStyle = '#ff3556';
      ctx.lineWidth = Math.max(1.5, vehicleHeight * .045);
      ctx.beginPath();
      ctx.moveTo(-vehicleWidth * .4, vehicleHeight * .02);
      ctx.lineTo(-vehicleWidth * .13, vehicleHeight * .09);
      ctx.moveTo(vehicleWidth * .4, vehicleHeight * .02);
      ctx.lineTo(vehicleWidth * .13, vehicleHeight * .09);
      ctx.stroke();
    } else {
      const lamp = ctx.createLinearGradient(-vehicleWidth * .4, 0, vehicleWidth * .4, 0);
      lamp.addColorStop(0, '#ff304d'); lamp.addColorStop(.5, '#ff667c'); lamp.addColorStop(1, '#ff304d');
      ctx.fillStyle = lamp;
      roundedRectPath(ctx, -vehicleWidth * .41, vehicleHeight * .025, vehicleWidth * .82, vehicleHeight * .065, vehicleHeight * .025);
      ctx.fill();
      ctx.fillStyle = vehicle.colorDark;
      ctx.fillRect(-vehicleWidth * .08, vehicleHeight * .015, vehicleWidth * .16, vehicleHeight * .09);
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(226,232,238,.78)';
    ctx.fillRect(-vehicleWidth * .35, vehicleHeight * .23, vehicleWidth * .7, Math.max(1.2, vehicleHeight * .032));
    ctx.fillStyle = 'rgba(244,247,250,.86)';
    ctx.font = `800 ${Math.max(4, size * .049)}px Manrope, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(vehicle.badge, 0, vehicleHeight * .145);

    ctx.fillStyle = '#0d141c';
    roundedRectPath(ctx, -vehicleWidth * .14, vehicleHeight * .19, vehicleWidth * .28, vehicleHeight * .09, vehicleHeight * .018);
    ctx.fill();
    ctx.fillStyle = '#eff5f8';
    ctx.font = `700 ${Math.max(4, size * .047)}px Manrope, sans-serif`;
    ctx.fillText(vehicle.plate, 0, vehicleHeight * .234);

    if (vehicle.kind === 'supercar') {
      ctx.fillStyle = '#050709';
      roundedRectPath(ctx, -vehicleWidth * .38, vehicleHeight * .26, vehicleWidth * .76, vehicleHeight * .09, vehicleHeight * .025);
      ctx.fill();
      ctx.fillStyle = '#b9c1c8';
      [-.23, .23].forEach((offset) => {
        ctx.beginPath();
        ctx.arc(vehicleWidth * offset, vehicleHeight * .3, Math.max(1.2, size * .025), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (vehicle.crashed) {
      ctx.strokeStyle = 'rgba(255,205,109,.9)';
      ctx.lineWidth = Math.max(1, size * .014);
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo((Math.random() - .5) * vehicleWidth, vehicleHeight * .26);
        ctx.lineTo((Math.random() - .5) * vehicleWidth * 1.5, vehicleHeight * (.5 + Math.random() * .5));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawPlayerCar(timeSeconds) {
    const selected = cars[state.selectedCar];
    const profile = vehicleProfiles[selected.kind] || vehicleProfiles.sedan;
    const steer = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
    const width = clamp(viewWidth * .142, 108, 208);
    const height = width * selected.heightRatio;
    const x = viewWidth * .5 + state.playerX * viewWidth * .215 + state.playerKick * width;
    const y = viewHeight - height * .74;
    const bounce = state.running ? Math.sin(timeSeconds * (7 + state.speed * .02)) * Math.min(2.2, state.speed * .008) : 0;

    ctx.save();
    ctx.translate(x, y + bounce);
    ctx.rotate(-steer * .035 + state.playerKick * .08);

    if (controls.boost && state.nitro > 0 && state.speed > 55 && state.running) {
      const flame = ctx.createLinearGradient(0, height * .28, 0, height * 1.05);
      flame.addColorStop(0, 'rgba(255,255,255,.94)');
      flame.addColorStop(.2, 'rgba(115,243,193,.92)');
      flame.addColorStop(.62, 'rgba(143,168,255,.72)');
      flame.addColorStop(1, 'rgba(235,143,255,0)');
      ctx.fillStyle = flame;
      [-.2, .2].forEach((offset) => {
        ctx.beginPath();
        ctx.moveTo(width * offset - width * .045, height * .39);
        ctx.lineTo(width * offset + width * .045, height * .39);
        ctx.lineTo(width * offset, height * (.91 + Math.random() * .18));
        ctx.closePath();
        ctx.fill();
      });
    }

    const shadow = ctx.createRadialGradient(0, height * .31, 4, 0, height * .31, width * .67);
    shadow.addColorStop(0, 'rgba(0,0,0,.7)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, height * .31, width * .63, height * .2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#020304';
    roundedRectPath(ctx, -width * .515, height * .005, width * .145, height * .49, width * .05);
    ctx.fill();
    roundedRectPath(ctx, width * .37, height * .005, width * .145, height * .49, width * .05);
    ctx.fill();

    const body = ctx.createLinearGradient(-width * .5, -height * .62, width * .47, height * .5);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(.12, selected.primary);
    body.addColorStop(.6, selected.secondary);
    body.addColorStop(1, '#0b1016');
    ctx.fillStyle = body;
    ctx.beginPath();
    if (selected.kind === 'luxurySuv') {
      ctx.moveTo(-width * .48, height * .31);
      ctx.lineTo(-width * .5, -height * .11);
      ctx.quadraticCurveTo(-width * .47, -height * .51, -width * .29, -height * .61);
      ctx.lineTo(width * .29, -height * .61);
      ctx.quadraticCurveTo(width * .47, -height * .51, width * .5, -height * .11);
      ctx.lineTo(width * .48, height * .31);
    } else if (selected.kind === 'supercar') {
      ctx.moveTo(-width * .5, height * .29);
      ctx.lineTo(-width * .48, -height * .02);
      ctx.lineTo(-width * .32, -height * .36);
      ctx.quadraticCurveTo(0, -height * .59, width * .32, -height * .36);
      ctx.lineTo(width * .48, -height * .02);
      ctx.lineTo(width * .5, height * .29);
    } else {
      ctx.moveTo(-width * .49, height * .31);
      ctx.lineTo(-width * .49, -height * .02);
      ctx.lineTo(-width * .35, -height * .44);
      ctx.quadraticCurveTo(0, -height * .62, width * .35, -height * .44);
      ctx.lineTo(width * .49, -height * .02);
      ctx.lineTo(width * .49, height * .31);
    }
    ctx.quadraticCurveTo(0, height * .47, -width * .48, height * .31);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.36)';
    ctx.lineWidth = Math.max(1, width * .008);
    ctx.stroke();

    const glassTop = selected.kind === 'luxurySuv' ? -.55 : selected.kind === 'supercar' ? -.43 : -.53;
    const glassBottom = selected.kind === 'supercar' ? -.12 : -.14;
    const glass = ctx.createLinearGradient(0, height * glassTop, 0, height * glassBottom);
    glass.addColorStop(0, 'rgba(199,231,246,.9)');
    glass.addColorStop(.34, 'rgba(59,84,104,.9)');
    glass.addColorStop(1, 'rgba(4,10,16,.98)');
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(-width * (selected.kind === 'supercar' ? .23 : .28), height * glassTop);
    ctx.lineTo(width * (selected.kind === 'supercar' ? .23 : .28), height * glassTop);
    ctx.lineTo(width * .34, height * glassBottom);
    ctx.lineTo(-width * .34, height * glassBottom);
    ctx.closePath();
    ctx.fill();

    // Luxury rear deck and LED light signature
    ctx.shadowColor = '#ff3557';
    ctx.shadowBlur = width * .1;
    if (selected.kind === 'luxurySuv') {
      ctx.fillStyle = '#ff3b58';
      roundedRectPath(ctx, -width * .42, -height * .015, width * .105, height * .23, height * .03);
      ctx.fill();
      roundedRectPath(ctx, width * .315, -height * .015, width * .105, height * .23, height * .03);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,72,94,.8)';
      ctx.fillRect(-width * .315, height * .055, width * .63, Math.max(2, height * .027));
    } else if (selected.kind === 'supercar') {
      ctx.strokeStyle = '#ff3658';
      ctx.lineWidth = Math.max(3, height * .05);
      ctx.beginPath();
      ctx.moveTo(-width * .42, height * .015);
      ctx.lineTo(-width * .13, height * .1);
      ctx.moveTo(width * .42, height * .015);
      ctx.lineTo(width * .13, height * .1);
      ctx.stroke();
    } else {
      const lampGradient = ctx.createLinearGradient(-width * .42, 0, width * .42, 0);
      lampGradient.addColorStop(0, '#ff2948');
      lampGradient.addColorStop(.5, '#ff7285');
      lampGradient.addColorStop(1, '#ff2948');
      ctx.fillStyle = lampGradient;
      roundedRectPath(ctx, -width * .42, height * .02, width * .84, height * .075, height * .028);
      ctx.fill();
      ctx.fillStyle = selected.secondary;
      ctx.fillRect(-width * .085, height * .012, width * .17, height * .095);
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(240,244,247,.9)';
    ctx.font = `800 ${Math.max(8, width * .059)}px Manrope, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selected.badge, 0, height * .15);

    const chrome = ctx.createLinearGradient(0, height * .2, 0, height * .34);
    chrome.addColorStop(0, '#eef2f4');
    chrome.addColorStop(.48, '#7c8993');
    chrome.addColorStop(1, '#1d252d');
    ctx.fillStyle = chrome;
    roundedRectPath(ctx, -width * .42, height * .225, width * .84, height * .105, height * .035);
    ctx.fill();
    ctx.fillStyle = '#0b1219';
    roundedRectPath(ctx, -width * .16, height * .175, width * .32, height * .105, height * .025);
    ctx.fill();
    ctx.fillStyle = '#f4f7f8';
    ctx.font = `800 ${Math.max(7, width * .053)}px Manrope, sans-serif`;
    ctx.fillText('AMH LUX', 0, height * .229);

    if (selected.kind === 'supercar') {
      ctx.fillStyle = '#040608';
      roundedRectPath(ctx, -width * .4, height * .27, width * .8, height * .1, height * .025);
      ctx.fill();
      ctx.fillStyle = '#bec6cc';
      [-.22, .22].forEach((offset) => {
        ctx.beginPath();
        ctx.arc(width * offset, height * .315, Math.max(3, width * .025), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (state.damage > 24) {
      ctx.strokeStyle = `rgba(15,20,26,${Math.min(.75, state.damage / 100)})`;
      ctx.lineWidth = Math.max(1, width * .012);
      const scratches = Math.min(5, Math.ceil(state.damage / 20));
      for (let i = 0; i < scratches; i += 1) {
        const sx = (-.28 + i * .13) * width;
        ctx.beginPath();
        ctx.moveTo(sx, height * (.03 + i * .018));
        ctx.lineTo(sx + width * .09, height * (.14 + i * .01));
        ctx.stroke();
      }
    }

    ctx.restore();

    if (Math.abs(state.playerX) > .92 && state.speed > 65 && state.running) {
      const side = state.playerX > 0 ? 1 : -1;
      for (let i = 0; i < 7; i += 1) {
        const px = x + side * width * (.3 + Math.random() * .3);
        const py = y + height * (.2 + Math.random() * .4);
        ctx.fillStyle = `rgba(180,207,186,${.08 + Math.random() * .18})`;
        ctx.beginPath();
        ctx.arc(px, py, 2 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawCollisionFlash() {
    if (state.collisionFlash > 0) {
      const gradient = ctx.createRadialGradient(viewWidth * .5, viewHeight * .72, 20, viewWidth * .5, viewHeight * .72, viewWidth * .7);
      gradient.addColorStop(0, `rgba(255,226,154,${state.collisionFlash * .18})`);
      gradient.addColorStop(.46, `rgba(255,79,112,${state.collisionFlash * .24})`);
      gradient.addColorStop(1, 'rgba(255,40,70,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, viewWidth, viewHeight);
    }

    state.particles.forEach((particle) => {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      if (particle.kind === 'spark') {
        ctx.fillRect(-particle.size * 2.7, -particle.size * .25, particle.size * 5.4, particle.size * .5);
      } else {
        ctx.fillRect(-particle.size * .5, -particle.size * .5, particle.size, particle.size);
      }
      ctx.restore();
    });
  }

  function renderGame(now = performance.now()) {
    const seconds = now / 1000;
    const shake = state.cameraShake * Math.min(18, viewWidth * .015);
    const shakeX = shake ? (Math.random() - .5) * shake : 0;
    const shakeY = shake ? (Math.random() - .5) * shake * .75 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawSky(seconds);
    drawRoad();

    const visibleTraffic = state.traffic
      .filter((vehicle) => vehicle.relative > -70 && vehicle.relative < 900)
      .sort((a, b) => b.relative - a.relative);
    visibleTraffic.forEach(drawTrafficCar);
    drawPlayerCar(seconds);
    drawCollisionFlash();
    ctx.restore();
  }

  function createVehicle(index, initial = false) {
    const model = trafficModels[Math.abs(index) % trafficModels.length];
    const lanes = [-.72, -.36, 0, .36, .72];
    const lane = lanes[Math.floor(Math.random() * lanes.length)] + (Math.random() - .5) * .025;
    return {
      id: `${Date.now()}-${index}-${Math.random()}`,
      relative: initial ? 230 + index * 96 + Math.random() * 55 : 720 + Math.random() * 420,
      lane,
      speed: model.speed + (Math.random() - .5) * 34,
      colorLight: model.colors[0],
      color: model.colors[1],
      colorDark: model.colors[2],
      kind: model.kind,
      badge: model.badge,
      plate: model.plate,
      passed: false,
      crashed: false,
      crashOffset: 0,
      crashVelocity: 0,
      spin: 0,
      spinVelocity: 0,
      screenX: 0,
      screenY: 0,
      screenSize: 0
    };
  }

  function resetTraffic() {
    state.traffic = Array.from({ length: 9 }, (_, index) => createVehicle(index, true));
  }

  function spawnImpactParticles(x, y, direction) {
    const palette = ['#fff2bd', '#ffca69', '#ff6b77', '#d7e8ef', '#73f3c1'];
    for (let i = 0; i < 34; i += 1) {
      const angle = (Math.random() * Math.PI * 1.25) - Math.PI * .15;
      const speed = 120 + Math.random() * 390;
      const life = .35 + Math.random() * .75;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed * direction + (Math.random() - .5) * 130,
        vy: -Math.abs(Math.sin(angle) * speed) - Math.random() * 110,
        gravity: 420 + Math.random() * 380,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - .5) * 12,
        size: 1.4 + Math.random() * 4.8,
        color: palette[Math.floor(Math.random() * palette.length)],
        kind: Math.random() > .38 ? 'spark' : 'debris',
        life,
        maxLife: life
      });
    }
  }

  function playCrashSound() {
    if (!state.soundOn || !state.audioContext) return;
    const audio = state.audioContext;
    const now = audio.currentTime;
    const duration = .42;
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const decay = Math.pow(1 - i / data.length, 2.3);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(170, now + duration);
    gain.gain.setValueAtTime(.18, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start(now);
  }

  function triggerCollision(vehicle, playerX, playerY) {
    if (state.collisionCooldown > 0 || vehicle.crashed || state.finished) return;
    const impactSide = vehicle.screenX >= playerX ? -1 : 1;
    const impactSeverity = clamp((state.speed - vehicle.speed) / 90 + .55, .48, 1.25);
    const addedDamage = Math.round(23 + impactSeverity * 19);
    state.damage = clamp(state.damage + addedDamage, 0, 100);
    state.speed = Math.max(14, state.speed * (.18 + (1 - impactSeverity) * .08));
    state.nitro = Math.max(0, state.nitro - 34);
    state.score = Math.max(0, state.score - Math.round(700 + impactSeverity * 650));
    state.collisionFlash = 1;
    state.collisionCooldown = 1.15;
    state.hitStop = .13;
    state.cameraShake = 1;
    state.playerKick = impactSide * .36;
    state.impactMessageTime = 1.05;

    vehicle.crashed = true;
    vehicle.crashVelocity = -impactSide * (.52 + Math.random() * .3);
    vehicle.spinVelocity = -impactSide * (2.5 + Math.random() * 2.4);
    vehicle.speed *= .35;
    spawnImpactParticles((vehicle.screenX + playerX) * .5, Math.min(vehicle.screenY, playerY) + vehicle.screenSize * .2, -impactSide);
    playCrashSound();

    if (impactElement) {
      impactElement.textContent = state.damage >= 100 ? 'VEHICLE DISABLED' : `IMPACT · ${addedDamage}% DAMAGE`;
      impactElement.classList.remove('is-visible');
      void impactElement.offsetWidth;
      impactElement.classList.add('is-visible');
    }
    updateStatus(state.damage >= 100 ? 'Critical damage · run ended' : `Collision! Vehicle health ${100 - state.damage}%`, true);
    if (state.damage >= 100) window.setTimeout(() => finishGame('Vehicle disabled after a heavy impact.'), 380);
  }

  function updateParticles(delta) {
    state.particles.forEach((particle) => {
      particle.life -= delta;
      particle.vy += particle.gravity * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.rotation += particle.rotationSpeed * delta;
    });
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function updateTraffic(delta) {
    const playerMetersPerSecond = state.speed / 3.6;
    const playerWidth = clamp(viewWidth * .142, 108, 208);
    const playerHeight = playerWidth * cars[state.selectedCar].heightRatio;
    const playerX = viewWidth * .5 + state.playerX * viewWidth * .215 + state.playerKick * playerWidth;
    const playerY = viewHeight - playerHeight * .74;
    const playerBounds = {
      left: playerX - playerWidth * .39,
      right: playerX + playerWidth * .39,
      top: playerY - playerHeight * .45,
      bottom: playerY + playerHeight * .34
    };

    state.traffic.forEach((vehicle, index) => {
      vehicle.relative -= (playerMetersPerSecond - vehicle.speed / 3.6) * delta;

      if (vehicle.crashed) {
        vehicle.crashOffset += vehicle.crashVelocity * delta;
        vehicle.spin += vehicle.spinVelocity * delta;
        vehicle.spinVelocity *= Math.pow(.985, delta * 60);
        vehicle.speed = Math.max(0, vehicle.speed - 45 * delta);
      }

      const geometry = roadGeometry(vehicle.relative);
      const size = 10 + Math.pow(geometry.t, 1.72) * Math.min(165, viewWidth * .132);
      vehicle.screenSize = size;
      vehicle.screenX = geometry.center + (vehicle.lane + vehicle.crashOffset) * geometry.halfWidth * .76;
      vehicle.screenY = geometry.y - size * .12;

      if (!vehicle.crashed && vehicle.relative < 150 && vehicle.relative > -32 && state.collisionCooldown <= 0) {
        const collisionProfile = vehicleProfiles[vehicle.kind] || vehicleProfiles.sedan;
        const widthFactor = collisionProfile.collisionWidth;
        const heightFactor = collisionProfile.collisionHeight;
        const vehicleBounds = {
          left: vehicle.screenX - size * widthFactor,
          right: vehicle.screenX + size * widthFactor,
          top: vehicle.screenY - size * heightFactor,
          bottom: vehicle.screenY + size * .34
        };
        const overlapX = Math.min(playerBounds.right, vehicleBounds.right) - Math.max(playerBounds.left, vehicleBounds.left);
        const overlapY = Math.min(playerBounds.bottom, vehicleBounds.bottom) - Math.max(playerBounds.top, vehicleBounds.top);
        if (overlapX > Math.min(playerWidth, size) * .18 && overlapY > Math.min(playerHeight, size) * .12) {
          triggerCollision(vehicle, playerX, playerY);
        }
      }

      if (vehicle.relative < -78 || Math.abs(vehicle.crashOffset) > 2.4) {
        if (!vehicle.passed && !vehicle.crashed) {
          state.score += 650 + Math.round(state.speed * 2.2);
          updateStatus('Clean pass · bonus added');
        }
        Object.assign(vehicle, createVehicle(index + Math.floor(state.trackMeters), false));
      }

      if (vehicle.relative > 1350) vehicle.relative = 650 + Math.random() * 430;
    });
  }

  function updateHud() {
    if (speedElement) speedElement.textContent = String(Math.round(state.speed));
    if (distanceElement) distanceElement.textContent = state.distanceKm.toFixed(1);
    if (scoreElement) scoreElement.textContent = String(Math.max(0, Math.round(state.score))).padStart(6, '0');
    if (nitroElement) nitroElement.style.transform = `scaleX(${clamp(state.nitro / 100, 0, 1)})`;
    if (damageElement) damageElement.style.transform = `scaleX(${clamp((100 - state.damage) / 100, 0, 1)})`;
    if (damageValueElement) damageValueElement.textContent = `${Math.max(0, 100 - state.damage)}%`;
    shell.classList.toggle('has-critical-damage', state.damage >= 70);
  }

  let statusTimeout = 0;
  function updateStatus(message, sticky = false) {
    if (!statusElement) return;
    statusElement.textContent = message;
    window.clearTimeout(statusTimeout);
    if (!sticky && state.running) {
      statusTimeout = window.setTimeout(() => {
        if (state.running) statusElement.textContent = `${cars[state.selectedCar].name} · vehicle health ${Math.max(0, 100 - state.damage)}%`;
      }, 1800);
    }
  }

  function updateEngineSound() {
    if (!state.soundOn || !state.audioContext || !state.engineOscillator || !state.engineGain) return;
    const now = state.audioContext.currentTime;
    const normalized = clamp(state.speed / cars[state.selectedCar].topSpeed, 0, 1.2);
    const frequency = 46 + normalized * 126 + (controls.boost ? 34 : 0);
    state.engineOscillator.frequency.setTargetAtTime(frequency, now, .055);
    state.engineOscillatorTwo?.frequency.setTargetAtTime(frequency * 2.02, now, .055);
    state.engineFilter?.frequency.setTargetAtTime(320 + normalized * 1450, now, .08);
    const targetGain = state.running && !state.paused ? .018 + normalized * .032 : .0001;
    state.engineGain.gain.setTargetAtTime(targetGain, now, .08);
  }

  function ensureEngineSound() {
    if (!state.soundOn) return;
    const AudioContextApi = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextApi) return;
    if (state.audioContext) {
      state.audioContext.resume().catch(() => {});
      updateEngineSound();
      return;
    }

    const audioContext = new AudioContextApi();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const oscillator = audioContext.createOscillator();
    const oscillatorTwo = audioContext.createOscillator();

    oscillator.type = 'sawtooth';
    oscillatorTwo.type = 'triangle';
    filter.type = 'lowpass';
    gain.gain.value = .0001;
    oscillator.frequency.value = 48;
    oscillatorTwo.frequency.value = 96;
    filter.frequency.value = 400;

    oscillator.connect(filter);
    oscillatorTwo.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillatorTwo.start();

    state.audioContext = audioContext;
    state.engineGain = gain;
    state.engineFilter = filter;
    state.engineOscillator = oscillator;
    state.engineOscillatorTwo = oscillatorTwo;
    audioContext.resume().catch(() => {});
    updateEngineSound();
  }

  function stopEngineSound() {
    if (!state.audioContext) return;
    try { state.engineOscillator?.stop(); } catch (error) { /* already stopped */ }
    try { state.engineOscillatorTwo?.stop(); } catch (error) { /* already stopped */ }
    state.audioContext.close().catch(() => {});
    state.audioContext = null;
    state.engineGain = null;
    state.engineFilter = null;
    state.engineOscillator = null;
    state.engineOscillatorTwo = null;
  }

  function clearControls() {
    Object.keys(controls).forEach((key) => { controls[key] = false; });
    touchControls.forEach((button) => button.classList.remove('is-active'));
  }

  function updateGame(delta) {
    if (!state.running || state.paused || state.finished) return;

    updateParticles(delta);
    state.collisionCooldown = Math.max(0, state.collisionCooldown - delta);
    state.collisionFlash = Math.max(0, state.collisionFlash - delta * 3.2);
    state.cameraShake = Math.max(0, state.cameraShake - delta * 4.6);
    state.playerKick *= Math.pow(.88, delta * 60);
    state.impactMessageTime = Math.max(0, state.impactMessageTime - delta);
    if (state.impactMessageTime <= 0) impactElement?.classList.remove('is-visible');

    if (state.hitStop > 0) {
      state.hitStop = Math.max(0, state.hitStop - delta);
      updateHud();
      updateEngineSound();
      return;
    }

    const car = cars[state.selectedCar];
    const boosting = controls.boost && state.nitro > 0 && state.speed > 55;
    const maximumSpeed = car.topSpeed * (boosting ? 1.12 : 1);

    if (controls.accelerate) state.speed += car.acceleration * delta;
    else state.speed -= (19 + state.speed * .017) * delta;
    if (controls.brake) state.speed -= (142 + state.speed * .14) * delta;

    if (boosting) {
      state.speed += 104 * delta;
      state.nitro -= 25 * delta;
      state.boostGlow = 1;
      state.score += 42 * delta;
    } else {
      state.nitro += (state.speed < 110 ? 10 : 6) * delta;
      state.boostGlow = Math.max(0, state.boostGlow - delta * 3);
    }

    state.nitro = clamp(state.nitro, 0, 100);
    state.speed = clamp(state.speed, 0, maximumSpeed);

    const steering = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
    const speedRatio = clamp(state.speed / car.topSpeed, 0, 1.15);
    state.playerX += steering * car.handling * (1.06 + speedRatio * .76) * delta;
    state.playerX -= roadCurveAt(state.trackMeters + 120) * speedRatio * .17 * delta;

    if (!steering) state.playerX *= Math.pow(.996, delta * 60);
    state.playerX = clamp(state.playerX, -1.22, 1.22);

    if (Math.abs(state.playerX) > .96) {
      state.speed -= (58 + state.speed * .15) * delta;
      state.score = Math.max(0, state.score - 28 * delta);
    }

    const metersPerSecond = state.speed / 3.6;
    state.trackMeters += metersPerSecond * delta;
    state.distanceKm += metersPerSecond * delta / 1000;
    state.score += (state.speed * .42 + Math.max(0, 1 - Math.abs(state.playerX)) * 22) * delta;

    updateTraffic(delta);
    updateHud();
    updateEngineSound();
  }

  function gameLoop(now) {
    if (!state.open) return;
    const delta = state.lastTime ? Math.min(.035, (now - state.lastTime) / 1000) : 0;
    state.lastTime = now;
    updateGame(delta);
    renderGame(now);
    state.animationFrame = window.requestAnimationFrame(gameLoop);
  }

  function startLoop() {
    window.cancelAnimationFrame(state.animationFrame);
    state.lastTime = 0;
    state.animationFrame = window.requestAnimationFrame(gameLoop);
  }

  function resetGameState() {
    state.speed = 0;
    state.distanceKm = 0;
    state.trackMeters = 0;
    state.score = 0;
    state.nitro = 100;
    state.playerX = 0;
    state.damage = 0;
    state.collisionFlash = 0;
    state.collisionCooldown = 0;
    state.hitStop = 0;
    state.cameraShake = 0;
    state.playerKick = 0;
    state.impactMessageTime = 0;
    state.particles = [];
    impactElement?.classList.remove('is-visible');
    state.boostGlow = 0;
    state.finished = false;
    state.paused = false;
    resetTraffic();
    clearControls();
    updateHud();
  }

  function startGame() {
    resetGameState();
    state.running = true;
    shell.classList.remove('is-paused', 'is-finished');
    shell.classList.add('is-running');
    pausePanel?.setAttribute('hidden', '');
    resultPanel?.setAttribute('hidden', '');
    updateStatus(`${cars[state.selectedCar].name} · the road is yours`, true);
    ensureEngineSound();
    canvas.focus({ preventScroll: true });
  }

  function pauseGame(forcePause) {
    if (!state.running || state.finished) return;
    state.paused = typeof forcePause === 'boolean' ? forcePause : !state.paused;
    shell.classList.toggle('is-paused', state.paused);
    pausePanel?.toggleAttribute('hidden', !state.paused);
    clearControls();
    updateStatus(state.paused ? 'Race paused' : `${cars[state.selectedCar].name} · back on the road`, true);
    updateEngineSound();
    if (!state.paused) canvas.focus({ preventScroll: true });
  }

  function finishGame(title) {
    if (state.finished) return;
    state.finished = true;
    state.running = false;
    state.paused = false;
    shell.classList.remove('is-running', 'is-paused');
    shell.classList.add('is-finished');
    clearControls();
    updateEngineSound();

    let storedBest = 0;
    try { storedBest = Number(window.localStorage.getItem('aurora-rush-best') || 0); } catch (error) { storedBest = 0; }
    const finalScoreValue = Math.round(state.score);
    const newBest = Math.max(storedBest, finalScoreValue);
    try { window.localStorage.setItem('aurora-rush-best', String(newBest)); } catch (error) { /* best score remains session-only */ }

    if (resultTitle) resultTitle.textContent = title || 'Nice drive.';
    if (resultDistance) resultDistance.textContent = `${state.distanceKm.toFixed(1)} km`;
    if (resultScore) resultScore.textContent = finalScoreValue.toLocaleString();
    if (bestScore) bestScore.textContent = newBest.toLocaleString();
    resultPanel?.removeAttribute('hidden');
    updateStatus('Run complete · ready for another attempt', true);
  }

  function openGame() {
    if (state.open) return;
    state.lastFocused = document.activeElement;
    state.open = true;
    state.running = false;
    state.paused = false;
    state.finished = false;
    modal.hidden = false;
    document.body.classList.add('game-open');
    closeNavigation();
    resetGameState();
    shell.classList.remove('is-running', 'is-paused', 'is-finished');
    pausePanel?.setAttribute('hidden', '');
    resultPanel?.setAttribute('hidden', '');
    updateStatus('Choose a car and start the engine.', true);
    window.requestAnimationFrame(() => {
      modal.classList.add('open');
      resizeGameCanvas();
      renderGame();
      startLoop();
      startButton?.focus({ preventScroll: true });
    });
  }

  function closeGame() {
    if (!state.open) return;
    state.open = false;
    state.running = false;
    state.paused = false;
    clearControls();
    modal.classList.remove('open');
    document.body.classList.remove('game-open');
    window.cancelAnimationFrame(state.animationFrame);
    stopEngineSound();
    window.setTimeout(() => {
      modal.hidden = true;
      state.lastFocused?.focus?.({ preventScroll: true });
    }, 310);
  }

  function selectCar(key) {
    if (!cars[key]) return;
    state.selectedCar = key;
    carOptions.forEach((option) => {
      const selected = option.dataset.gameCar === key;
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-checked', String(selected));
    });
    showCar?.setAttribute('data-car', key);
    if (vehiclePhoto) {
      vehiclePhoto.src = cars[key].preview;
      vehiclePhoto.style.filter = 'none';
      vehiclePhoto.style.objectPosition = cars[key].photoPosition;
      vehiclePhoto.alt = `${cars[key].name} realistic vehicle preview`;
    }
    if (vehiclePhotoName) vehiclePhotoName.textContent = cars[key].name;
    if (specLaunch) specLaunch.textContent = cars[key].launch;
    if (specSpeed) specSpeed.textContent = String(cars[key].topSpeed);
    if (specHandling) specHandling.textContent = cars[key].handlingLabel;
    updateStatus(`${cars[key].name} selected · ready when you are`, true);
    renderGame();
  }

  function setControl(name, active) {
    if (!(name in controls)) return;
    controls[name] = active;
  }

  openButtons.forEach((button) => button.addEventListener('click', openGame));
  closeButtons.forEach((button) => button.addEventListener('click', closeGame));
  startButton?.addEventListener('click', startGame);
  resumeButton?.addEventListener('click', () => pauseGame(false));
  restartButtons.forEach((button) => button.addEventListener('click', startGame));
  carOptions.forEach((option) => option.addEventListener('click', () => selectCar(option.dataset.gameCar)));

  soundButton?.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    soundButton.setAttribute('aria-pressed', String(state.soundOn));
    soundButton.setAttribute('aria-label', state.soundOn ? 'Turn game sound off' : 'Turn game sound on');
    soundButton.setAttribute('title', state.soundOn ? 'Sound on' : 'Sound off');
    if (state.soundOn) ensureEngineSound();
    else stopEngineSound();
  });

  const keyMap = {
    ArrowUp: 'accelerate', KeyW: 'accelerate',
    ArrowDown: 'brake', KeyS: 'brake',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Space: 'boost'
  };

  document.addEventListener('keydown', (event) => {
    if (!state.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeGame();
      return;
    }
    if (event.code === 'KeyP' && state.running) {
      event.preventDefault();
      pauseGame();
      return;
    }
    const control = keyMap[event.code];
    if (control) {
      event.preventDefault();
      setControl(control, true);
    }
  });

  document.addEventListener('keyup', (event) => {
    if (!state.open) return;
    const control = keyMap[event.code];
    if (control) {
      event.preventDefault();
      setControl(control, false);
    }
  });

  touchControls.forEach((button) => {
    const control = button.dataset.gameControl;
    const activate = (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      button.classList.add('is-active');
      setControl(control, true);
    };
    const deactivate = (event) => {
      event.preventDefault();
      button.classList.remove('is-active');
      setControl(control, false);
    };
    button.addEventListener('pointerdown', activate);
    button.addEventListener('pointerup', deactivate);
    button.addEventListener('pointercancel', deactivate);
    button.addEventListener('lostpointercapture', deactivate);
  });

  window.addEventListener('resize', () => {
    if (!state.open) return;
    resizeGameCanvas();
    renderGame();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.open && state.running && !state.paused) pauseGame(true);
  });

  modal.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  selectCar('apex');
  resetTraffic();
})();
