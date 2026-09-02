export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const updateHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}
