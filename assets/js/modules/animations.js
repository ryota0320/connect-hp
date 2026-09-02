import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function initHeroAnimation(reducedMotion) {
  const lines = gsap.utils.toArray('[data-hero-line]');
  const image = document.querySelector('[data-hero-image]');
  const details = gsap.utils.toArray('[data-hero-item]');

  if (!lines.length || !image) return;

  if (reducedMotion) {
    gsap.set([...lines, image, ...details], { clearProps: 'all' });
    return;
  }

  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from(lines, { opacity: 0, y: 54, duration: 0.72, stagger: 0.08 })
    .from(image, { clipPath: 'inset(100% 0 0 0)', duration: 0.82 }, '-=0.62')
    .from(details, { opacity: 0, y: 22, duration: 0.52, stagger: 0.055 }, '-=0.52');
}

function initFadeAnimations(reducedMotion) {
  const elements = gsap.utils.toArray('[data-animation="fade-up"]');

  if (reducedMotion) {
    gsap.set(elements, { autoAlpha: 1, clearProps: 'transform' });
    return;
  }

  elements.forEach((element) => {
    gsap.fromTo(element,
      { autoAlpha: 0, y: 40 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.95,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 84%',
          once: true,
        },
      },
    );
  });
}

function initImageReveal(reducedMotion) {
  const images = gsap.utils.toArray('[data-reveal]');
  if (reducedMotion) return;

  images.forEach((image) => {
    gsap.from(image, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.05,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: image,
        start: 'top 82%',
        once: true,
      },
    });

    const media = image.querySelector('img');
    if (media) {
      gsap.from(media, {
        scale: 1.07,
        duration: 1.25,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: image,
          start: 'top 82%',
          once: true,
        },
      });
    }
  });
}

function initParallax(reducedMotion) {
  if (reducedMotion || window.innerWidth <= 767) return;

  const orb = document.querySelector('.brand-message__orb');
  if (!orb) return;

  gsap.to(orb, {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: {
      trigger: '.brand-message',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.8,
    },
  });
}

export function initAnimations() {
  document.documentElement.classList.add('has-js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || new URLSearchParams(window.location.search).get('motion') === 'off';

  initHeroAnimation(reducedMotion);
  initFadeAnimations(reducedMotion);
  initImageReveal(reducedMotion);
  initParallax(reducedMotion);
}
