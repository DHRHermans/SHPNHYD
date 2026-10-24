// Non-modal tool windows keep measurements available without reserving drawing space.
const KEY = 'shpnhyd.tool-windows.v1';
const margin = 12;

export class ToolWindows {
  constructor(onResize) {
    this.windows = new Map();
    this.onResize = onResize;
    this.front = 100;
    try { this.saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { this.saved = {}; }
    window.addEventListener('resize', () => {
      for (const item of this.windows.values()) this.apply(item);
      this.onResize?.();
    });
  }

  register(name, title, content, actions) {
    const element = document.createElement('section');
    element.className = 'tool-window'; element.id = `window-${name}`;
    element.setAttribute('role', 'dialog'); element.setAttribute('aria-modal', 'false');
    element.setAttribute('aria-labelledby', `window-title-${name}`);
    element.tabIndex = -1; element.hidden = true;
    element.innerHTML = `<header class="tool-window-titlebar"><h2 id="window-title-${name}"></h2><span class="tool-window-controls"><button type="button" data-maximize aria-label="Venster vergroten" title="Vergroten / herstellen">□</button><button type="button" data-close aria-label="Venster sluiten" title="Sluiten (Escape)">×</button></span></header><div class="tool-window-toolbar"></div><div class="tool-window-body"></div><div class="tool-window-resize" role="separator" aria-label="Vensterformaat aanpassen" title="Sleep om het vensterformaat aan te passen"></div>`;
    element.querySelector('h2').textContent = title;
    content.classList.remove('is-hidden');
    element.querySelector('.tool-window-body').appendChild(content);
    if (actions) {
      actions.removeAttribute('data-for'); actions.hidden = false;
      element.querySelector('.tool-window-toolbar').appendChild(actions);
    }
    document.body.appendChild(element);
    const offset = this.windows.size * 28;
    const saved = this.saved[name];
    const rect = saved && ['x','y','width','height'].every(k => Number.isFinite(saved[k]))
      ? saved : { x: (innerWidth - 900) / 2 + offset, y: 150 + offset, width: 900, height: 430 };
    const item = { element, rect, maximized: false };
    this.windows.set(name, item); this.apply(item);
    element.addEventListener('pointerdown', event => {
      this.bringToFront(item);
      if (!event.target.closest('button, input, select, textarea, a')) element.focus({ preventScroll: true });
    });
    element.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(name); }
    });
    element.querySelector('[data-close]').addEventListener('click', () => this.close(name));
    const maximize = () => {
      item.maximized = !item.maximized;
      const button = element.querySelector('[data-maximize]');
      button.setAttribute('aria-label', item.maximized ? 'Venster herstellen' : 'Venster vergroten');
      button.setAttribute('aria-pressed', String(item.maximized));
      this.apply(item); this.onResize?.();
    };
    element.querySelector('[data-maximize]').addEventListener('click', maximize);
    const titlebar = element.querySelector('.tool-window-titlebar');
    titlebar.addEventListener('dblclick', event => { if (!event.target.closest('button')) maximize(); });
    this.bindDrag(item, titlebar, false);
    this.bindDrag(item, element.querySelector('.tool-window-resize'), true);
    new ResizeObserver(() => { if (this.isOpen(name)) this.onResize?.(); }).observe(element);
  }

  isOpen(name) { return this.windows.has(name) && !this.windows.get(name).element.hidden; }

  open(name) {
    const item = this.windows.get(name);
    if (!item) return;
    item.opener = document.activeElement;
    item.element.hidden = false;
    this.apply(item); this.bringToFront(item);
    item.element.focus({ preventScroll: true });
    this.updateButton(name);
    requestAnimationFrame(() => this.onResize?.());
  }

  close(name) {
    const item = this.windows.get(name);
    if (!item) return;
    const hadFocus = item.element.contains(document.activeElement);
    item.element.hidden = true;
    this.updateButton(name);
    if (hadFocus) {
      const target = item.opener?.getClientRects().length ? item.opener : document.querySelector('#btn-analysis');
      target?.focus({ preventScroll: true });
    }
  }

  updateButton(name) {
    document.querySelectorAll(`[data-toolwindow="${name}"]`).forEach(button => button.setAttribute('aria-pressed', String(this.isOpen(name))));
  }

  bringToFront(item) { item.element.style.zIndex = String(++this.front); }

  apply(item) {
    const maxWidth = Math.max(1, innerWidth - margin * 2);
    const maxHeight = Math.max(1, innerHeight - margin * 2);
    const clamp = (value, min, max) => Math.min(Math.max(value, Math.min(min, max)), max);
    const width = item.maximized ? maxWidth : clamp(item.rect.width, 340, maxWidth);
    const height = item.maximized ? maxHeight : clamp(item.rect.height, 240, maxHeight);
    const x = item.maximized ? margin : clamp(item.rect.x, margin, innerWidth - width - margin);
    const y = item.maximized ? margin : clamp(item.rect.y, margin, innerHeight - height - margin);
    if (!item.maximized) item.rect = { x, y, width, height };
    Object.assign(item.element.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
  }

  save() {
    const state = Object.fromEntries([...this.windows].map(([name, item]) => [name, item.rect]));
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Storage may be disabled. */ }
  }

  bindDrag(item, handle, resize) {
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || item.maximized || event.target.closest('button')) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      const start = { ...item.rect, xPointer: event.clientX, yPointer: event.clientY };
      const move = e => {
        const dx = e.clientX - start.xPointer, dy = e.clientY - start.yPointer;
        item.rect = resize ? { x:start.x, y:start.y, width:start.width + dx, height:start.height + dy }
          : { x:start.x + dx, y:start.y + dy, width:start.width, height:start.height };
        this.apply(item); this.onResize?.();
      };
      const end = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        this.save();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });
  }
}
