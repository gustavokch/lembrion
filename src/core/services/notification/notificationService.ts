/**
 * Toast notifications, drawn outside React so services and hooks can raise
 * them. Styling lives in `src/index.css` (`.toast-region`, `.toast`).
 */

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  /** Milliseconds before the toast leaves; 0 keeps it until clicked. */
  duration?: number;
}

const REGION_ID = 'toast-region';
const LEAVE_MS = 160;

function toastRegion(): HTMLElement {
  const existing = document.getElementById(REGION_ID);
  if (existing) return existing;
  const region = document.createElement('div');
  region.id = REGION_ID;
  region.className = 'toast-region';
  region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);
  return region;
}

export function showNotification({ type = 'info', title, message, duration = 5000 }: NotificationOptions): void {
  try {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.dataset.type = type;
    if (type === 'error') toast.setAttribute('role', 'alert');

    // Title and message can contain URL-supplied text: insert them as text, never as HTML.
    const body = document.createElement('div');
    body.className = 'toast-body';
    const titleEl = document.createElement('p');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    const messageEl = document.createElement('p');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    body.append(titleEl, messageEl);
    toast.appendChild(body);

    toastRegion().appendChild(toast);

    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      toast.dataset.leaving = '';
      setTimeout(() => toast.remove(), LEAVE_MS);
    };
    if (duration > 0) setTimeout(remove, duration);
    toast.addEventListener('click', remove);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}
