import { gsap } from 'gsap';

export function initMenu() {
  const button = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!button || !menu) return;

  const links = [...menu.querySelectorAll('a')];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || new URLSearchParams(window.location.search).get('motion') === 'off';
  let isOpen = false;

  const setState = (open, returnFocus = false) => {
    isOpen = open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-menu-open', open);

    if (prefersReducedMotion) {
      gsap.set(menu, { autoAlpha: open ? 1 : 0 });
    } else if (open) {
      gsap.timeline()
        .set(menu, { visibility: 'visible' })
        .to(menu, { opacity: 1, duration: 0.35, ease: 'power3.out' })
        .fromTo(links, { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.045, duration: 0.45, ease: 'power3.out' }, '-=0.18');
    } else {
      gsap.to(menu, {
        opacity: 0,
        duration: 0.28,
        ease: 'power2.out',
        onComplete: () => gsap.set(menu, { visibility: 'hidden' }),
      });
    }

    if (open) {
      links[0]?.focus({ preventScroll: true });
    } else if (returnFocus) {
      button.focus({ preventScroll: true });
    }
  };

  button.addEventListener('click', () => setState(!isOpen));
  links.forEach((link) => link.addEventListener('click', () => setState(false)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setState(false, true);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 767 && isOpen) setState(false);
  });
}
