// Realistic flipbook built on top of the page-flip library (vendored at js/vendor/page-flip.browser.js).
// Inline it shows a compact cover that, when clicked, opens an immersive heyzine-style fullscreen reader
// with a two-page spread. Images lazy-load in a window around the current page so 400+ page books stay light.
class Flipbook {
  static _sharedAudioCtx = null;

  // Lucide icon path data (https://lucide.dev, ISC license). Thin strokes to match the witflower mark.
  static ICONS = {
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    zoomIn: '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>',
    zoomOut: '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>',
    volumeOn: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
    volumeOff: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    bookOpen: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'
  };

  static icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.75');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = Flipbook.ICONS[name] || '';
    return svg;
  }

  /**
   * @param {HTMLElement} mount
   * @param {Object} opts
   * @param {number} opts.total - number of content pages (cover is page 0, content is 1..total)
   * @param {(pageNum:number)=>string} opts.getSrc - image src for content page pageNum (1-based)
   * @param {(pageNum:number)=>string} [opts.getTocLabel] - label shown in the table of contents
   * @param {string} opts.accent
   * @param {string} opts.paper
   * @param {number} opts.width
   * @param {number} opts.height
   * @param {Object} opts.texts
   */
  constructor(mount, opts) {
    this.mount = mount;
    this.total = opts.total;
    this.getSrc = opts.getSrc;
    this.getTocLabel = opts.getTocLabel || ((n) => `Trang ${n}`);
    this.accent = opts.accent;
    this.paper = opts.paper || '#FAF6F0';
    this.width = opts.width;
    this.height = opts.height;
    this.pfMinWidth = 260;
    this.preloadWindow = 4;
    this.current = 0;
    this.soundEnabled = true;
    this.zoom = 1;
    this.isOpen = false;
    this.texts = opts.texts;
    this._tocBuilt = false;

    this._buildSkeleton();
    this._buildPages();
    this._initPageFlip();
    this._bindControls();
    this._updateControls();
  }

  _mix(hexA, hexB, t) {
    const toRgb = (hex) => {
      hex = String(hex).replace('#', '');
      if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
      const num = parseInt(hex, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    };
    const a = toRgb(hexA), b = toRgb(hexB);
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }

  _iconButton(name, title, extraClass) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flipbook__icon-btn' + (extraClass ? ' ' + extraClass : '');
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.appendChild(Flipbook.icon(name));
    return btn;
  }

  _setIcon(btn, name) {
    btn.innerHTML = '';
    btn.appendChild(Flipbook.icon(name));
  }

  _buildSkeleton() {
    this.mount.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'flipbook';
    root.style.setProperty('--fb-w', this.width + 'px');
    root.style.setProperty('--fb-h', this.height + 'px');

    // Header: title (left) + toolbar (right) — visible only in the open reader
    const header = document.createElement('div');
    header.className = 'flipbook__header';
    const titleWrap = document.createElement('div');
    titleWrap.className = 'flipbook__title';
    const titleB = document.createElement('b');
    const titleSpan = document.createElement('span');
    titleWrap.append(titleB, titleSpan);
    const toolbar = document.createElement('div');
    toolbar.className = 'flipbook__toolbar';
    const homeBtn = this._iconButton('home', 'Về trang đầu');
    const tocBtn = this._iconButton('grid', 'Mục lục');
    const zoomBtn = this._iconButton('zoomIn', 'Phóng to');
    const soundBtn = this._iconButton('volumeOn', 'Bật/tắt âm thanh lật trang');
    const fsBtn = this._iconButton('maximize', 'Toàn màn hình');
    const closeBtn = this._iconButton('close', 'Đóng');
    toolbar.append(homeBtn, tocBtn, zoomBtn, soundBtn, fsBtn, closeBtn);
    header.append(titleWrap, toolbar);

    // Stage: the book + TOC overlay + inline "open" launcher
    const stage = document.createElement('div');
    stage.className = 'flipbook__stage';
    const bookWrap = document.createElement('div');
    bookWrap.className = 'flipbook__book-wrap';
    const book = document.createElement('div');
    book.className = 'flipbook__book';
    bookWrap.appendChild(book);

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'flipbook__open';
    const openBadge = document.createElement('div');
    openBadge.className = 'flipbook__open-badge';
    openBadge.appendChild(Flipbook.icon('bookOpen'));
    const openLabel = document.createElement('div');
    openLabel.className = 'flipbook__open-label';
    openBtn.append(openBadge, openLabel);
    bookWrap.appendChild(openBtn);

    const toc = document.createElement('div');
    toc.className = 'flipbook__toc-panel';
    toc.hidden = true;
    const tocHeader = document.createElement('div');
    tocHeader.className = 'flipbook__toc-header';
    const tocSearch = document.createElement('input');
    tocSearch.type = 'search';
    tocSearch.className = 'flipbook__toc-search';
    const tocClose = document.createElement('button');
    tocClose.type = 'button';
    tocClose.className = 'flipbook__toc-close';
    tocClose.setAttribute('aria-label', 'Đóng mục lục');
    tocClose.appendChild(Flipbook.icon('close'));
    tocHeader.append(tocSearch, tocClose);
    const tocList = document.createElement('div');
    tocList.className = 'flipbook__toc-list';
    toc.append(tocHeader, tocList);
    bookWrap.appendChild(toc);

    stage.appendChild(bookWrap);

    // Controls: prev / scrubber / next — visible only in the open reader
    const controls = document.createElement('div');
    controls.className = 'flipbook__controls';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'flipbook__nav flipbook__nav--prev';
    prevBtn.appendChild(Flipbook.icon('chevronLeft'));
    const scrub = document.createElement('div');
    scrub.className = 'flipbook__scrub';
    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'flipbook__range';
    range.min = '0';
    range.max = String(this.total);
    range.value = '0';
    range.setAttribute('aria-label', 'Chọn trang');
    const pageLabel = document.createElement('div');
    pageLabel.className = 'flipbook__page-label';
    scrub.append(range, pageLabel);
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'flipbook__nav flipbook__nav--next';
    nextBtn.appendChild(Flipbook.icon('chevronRight'));
    controls.append(prevBtn, scrub, nextBtn);

    root.append(header, stage, controls);
    this.mount.appendChild(root);

    this.el = {
      root, header, titleB, titleSpan, toolbar, homeBtn, tocBtn, zoomBtn, soundBtn, fsBtn, closeBtn,
      stage, bookWrap, book, openBtn, openLabel,
      toc, tocSearch, tocClose, tocList, prevBtn, range, pageLabel, nextBtn
    };
  }

  _buildPages() {
    this.pageEls = [];
    const cover = document.createElement('div');
    cover.className = 'flipbook__page flipbook__page--cover';
    // The gradient lives on a full-bleed inner layer so page-flip's hard-cover rendering
    // (which forces the page element's own background to white) can't wipe it out.
    const inner = document.createElement('div');
    inner.className = 'flipbook__cover-inner';
    inner.style.background = `linear-gradient(155deg, ${this.accent}, ${this._mix(this.accent, '#000000', 0.35)})`;
    const badge = document.createElement('div');
    badge.className = 'flipbook__cover-badge';
    const badgeImg = document.createElement('img');
    badgeImg.src = 'images/brand/witflower.png';
    badgeImg.alt = '';
    badge.appendChild(badgeImg);
    const title = document.createElement('div');
    title.className = 'flipbook__cover-title';
    title.textContent = this.texts.coverTitle;
    const subtitle = document.createElement('div');
    subtitle.className = 'flipbook__cover-subtitle';
    subtitle.textContent = this.texts.coverSubtitle;
    inner.append(badge, title, subtitle);
    cover.appendChild(inner);
    this._coverTitleEl = title;
    this._coverSubtitleEl = subtitle;
    this.pageEls.push(cover);

    for (let n = 1; n <= this.total; n++) {
      const page = document.createElement('div');
      page.className = 'flipbook__page';
      const img = document.createElement('img');
      img.alt = this.getTocLabel(n);
      img.dataset.src = this.getSrc(n);
      page.appendChild(img);
      this.pageEls.push(page);
    }

    this.pageEls.forEach((el) => this.el.book.appendChild(el));
  }

  _initPageFlip() {
    this.pageFlip = new St.PageFlip(this.el.book, {
      width: this.width,
      height: this.height,
      size: 'stretch',
      minWidth: this.pfMinWidth,
      maxWidth: 2000,
      minHeight: 350,
      maxHeight: 2600,
      drawShadow: true,
      flippingTime: 800,
      usePortrait: true,
      autoSize: true,
      showCover: true,
      maxShadowOpacity: 0.5,
      mobileScrollSupport: false,
      swipeDistance: 20
    });
    this.pageFlip.loadFromHTML(this.pageEls);
    this._preloadAround(0);
    this.pageFlip.on('flip', (e) => {
      this.current = e.data;
      this._preloadAround(this.current);
      this._updateControls();
      this._playFlipSound();
    });
  }

  _preloadAround(current) {
    const lo = Math.max(1, current - this.preloadWindow);
    const hi = Math.min(this.total, current + this.preloadWindow);
    for (let n = lo; n <= hi; n++) {
      const img = this.pageEls[n].querySelector('img');
      if (img && !img.src && img.dataset.src) img.src = img.dataset.src;
    }
  }

  _bindControls() {
    this.el.openBtn.addEventListener('click', () => this.open());
    this.el.closeBtn.addEventListener('click', () => this.close());
    this.el.prevBtn.addEventListener('click', () => this.pageFlip.flipPrev());
    this.el.nextBtn.addEventListener('click', () => this.pageFlip.flipNext());
    this.el.homeBtn.addEventListener('click', () => this.goHome());
    this.el.tocBtn.addEventListener('click', () => this.toggleToc());
    this.el.tocClose.addEventListener('click', () => this.toggleToc(false));
    this.el.tocSearch.addEventListener('input', () => this._filterToc());
    this.el.soundBtn.addEventListener('click', () => this.toggleSound());
    this.el.zoomBtn.addEventListener('click', () => this.toggleZoom());
    this.el.fsBtn.addEventListener('click', () => this.toggleNativeFullscreen());
    this.el.range.addEventListener('input', () => this.jumpTo(Number(this.el.range.value)));

    this._onKeydown = (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') this.close();
      else if (e.key === 'ArrowRight') this.pageFlip.flipNext();
      else if (e.key === 'ArrowLeft') this.pageFlip.flipPrev();
    };
    document.addEventListener('keydown', this._onKeydown);

    this._onResize = () => { if (this.isOpen) this._fitReader(); };
    window.addEventListener('resize', this._onResize);

    document.addEventListener('fullscreenchange', () => {
      const isFs = document.fullscreenElement === this.el.root;
      this._setIcon(this.el.fsBtn, isFs ? 'minimize' : 'maximize');
      this.el.fsBtn.title = isFs ? 'Thu nhỏ' : 'Toàn màn hình';
    });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.el.root.classList.add('is-open');
    document.body.classList.add('flipbook-open-lock');
    this._fitReader();
    // Best-effort native fullscreen (a click gesture satisfies the browser requirement).
    if (this.el.root.requestFullscreen) {
      this.el.root.requestFullscreen().catch(() => {});
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.el.root.classList.remove('is-open', 'is-zoomed');
    document.body.classList.remove('flipbook-open-lock');
    this.zoom = 1;
    this.el.bookWrap.style.width = '';
    this.el.bookWrap.style.transform = '';
    this.toggleToc(false);
    if (document.fullscreenElement === this.el.root) document.exitFullscreen().catch(() => {});
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }

  _fitReader() {
    const stage = this.el.stage;
    const availH = stage.clientHeight - 6;
    const availW = stage.clientWidth - 6;
    if (availH <= 0 || availW <= 0) return;
    const ratio = this.width / this.height; // page aspect (w / h)
    let cap;
    if (availW < this.pfMinWidth * 2) {
      cap = Math.min(availW, availH * ratio);          // portrait, single page
    } else {
      cap = Math.min(availW, availH * ratio * 2);       // landscape, two-page spread
    }
    this.el.bookWrap.style.width = Math.floor(cap) + 'px';
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }

  goHome() {
    this.pageFlip.turnToPage(0);
    this.current = 0;
    this._preloadAround(0);
    this._updateControls();
  }

  jumpTo(n) {
    n = Math.max(0, Math.min(this.total, Math.round(n)));
    this.pageFlip.turnToPage(n);
    this.current = n;
    this._preloadAround(n);
    this._updateControls();
    this.toggleToc(false);
  }

  toggleNativeFullscreen() {
    if (document.fullscreenElement === this.el.root) {
      document.exitFullscreen().catch(() => {});
    } else if (this.el.root.requestFullscreen) {
      if (!this.isOpen) this.open();
      else this.el.root.requestFullscreen().catch(() => {});
    }
  }

  toggleZoom() {
    this.zoom = this.zoom > 1 ? 1 : 1.6;
    this.el.root.classList.toggle('is-zoomed', this.zoom > 1);
    this.el.bookWrap.style.transformOrigin = 'top center';
    this.el.bookWrap.style.transform = this.zoom > 1 ? `scale(${this.zoom})` : '';
    this._setIcon(this.el.zoomBtn, this.zoom > 1 ? 'zoomOut' : 'zoomIn');
    this.el.zoomBtn.classList.toggle('is-active', this.zoom > 1);
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.el.soundBtn.classList.toggle('is-active', !this.soundEnabled);
    this._setIcon(this.el.soundBtn, this.soundEnabled ? 'volumeOn' : 'volumeOff');
  }

  toggleToc(force) {
    const willShow = typeof force === 'boolean' ? force : this.el.toc.hidden;
    if (willShow && !this._tocBuilt) this._buildToc();
    this.el.toc.hidden = !willShow;
    this.el.tocBtn.classList.toggle('is-active', willShow);
    if (willShow) { this.el.tocSearch.value = ''; this._filterToc(); }
  }

  _buildToc() {
    this.el.tocList.innerHTML = '';
    this.el.tocList.classList.add('flipbook__toc-list--grid');
    this._tocRows = [];
    for (let n = 1; n <= this.total; n++) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'flipbook__toc-row';
      const b = document.createElement('b');
      b.textContent = String(n);
      const span = document.createElement('span');
      span.textContent = this.getTocLabel(n);
      row.append(b, span);
      row.addEventListener('click', () => this.jumpTo(n));
      this.el.tocList.appendChild(row);
      this._tocRows.push({ el: row, text: this._normalizeForSearch(n + ' ' + span.textContent) });
    }
    this._tocBuilt = true;
  }

  _normalizeForSearch(s) {
    return s.toLowerCase().replace(/[\s_./·-]+/g, '');
  }

  _filterToc() {
    const q = this._normalizeForSearch(this.el.tocSearch.value.trim());
    this._tocRows.forEach((r) => {
      r.el.hidden = q.length > 0 && !r.text.includes(q);
    });
  }

  _playFlipSound() {
    if (!this.soundEnabled) return;
    try {
      if (!Flipbook._sharedAudioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        Flipbook._sharedAudioCtx = new Ctx();
      }
      const ctx = Flipbook._sharedAudioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const duration = 0.22;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2600, ctx.currentTime);
      bandpass.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + duration);
      bandpass.Q.value = 0.8;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      noise.connect(bandpass).connect(gain).connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + duration);
    } catch (e) {
      /* Web Audio unavailable — silently skip the sound effect */
    }
  }

  _updateControls() {
    this.el.prevBtn.disabled = this.current <= 0;
    this.el.nextBtn.disabled = this.current >= this.total;
    this.el.pageLabel.textContent = this.texts.pageLabel(this.current, this.total);
    this.el.range.value = String(this.current);
  }

  setTexts(texts) {
    this.texts = texts;
    this._coverTitleEl.textContent = texts.coverTitle;
    this._coverSubtitleEl.textContent = texts.coverSubtitle;
    this.el.titleB.textContent = texts.coverTitle;
    this.el.titleSpan.textContent = texts.coverSubtitle;
    this.el.openLabel.textContent = texts.openLabel;
    this._updateControls();
  }

  refreshImages() {
    for (let n = 1; n <= this.total; n++) {
      const img = this.pageEls[n].querySelector('img');
      const newSrc = this.getSrc(n);
      img.dataset.src = newSrc;
      if (img.src) img.src = newSrc;
    }
  }
}
