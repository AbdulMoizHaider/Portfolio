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
