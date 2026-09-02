const messages = {
  name: 'お名前を入力してください。',
  email: '有効なメールアドレスを入力してください。',
  subject: 'お問い合わせ種別を選択してください。',
  message: 'お問い合わせ内容を入力してください。',
  privacy: 'プライバシーポリシーへの同意が必要です。',
};

function setError(form, name, message = '') {
  const field = form.elements.namedItem(name);
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (field) field.setAttribute('aria-invalid', String(Boolean(message)));
  if (error) error.textContent = message;
}

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const subject = new URLSearchParams(window.location.search).get('subject');
  const subjectField = form.elements.namedItem('subject');
  if (subjectField instanceof HTMLSelectElement
    && ['facility', 'energy', 'solar', 'support', 'human-resources', 'lifestyle', 'other'].includes(subject)) {
    subjectField.value = subject;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const checks = {
      name: String(data.get('name') || '').trim().length > 0,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      subject: ['facility', 'energy', 'solar', 'support', 'human-resources', 'lifestyle', 'other'].includes(String(data.get('subject') || '')),
      message: String(data.get('message') || '').trim().length > 0,
      privacy: data.get('privacy') === 'agreed',
    };

    Object.entries(checks).forEach(([name, valid]) => setError(form, name, valid ? '' : messages[name]));
    const firstInvalid = Object.entries(checks).find(([, valid]) => !valid)?.[0];
    const status = form.querySelector('[data-form-status]');

    if (firstInvalid) {
      status.textContent = '入力内容をご確認ください。';
      form.elements.namedItem(firstInvalid)?.focus();
      return;
    }

    status.textContent = '現在は画面確認用です。メール送信機能は本番設定後に有効になります。';
  });
}
