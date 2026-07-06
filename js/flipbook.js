// Realistic flipbook built on top of the page-flip library (vendored at js/vendor/page-flip.browser.js).
// Images are lazy-loaded around the current page so books with hundreds of pages stay light.
class Flipbook {
  static _sharedAudioCtx = null;

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
    this.preloadWindow = 3;
    this.current = 0;
    this.soundEnabled = true;
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

  _buildSkeleton() {
    this.mount.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'flipbook';
    root.style.setProperty('--fb-w', this.width + 'px');
    root.style.setProperty('--fb-h', this.height + 'px');

    const toolbar = document.createElement('div');
    toolbar.className = 'flipbook__toolbar';
    const firstBtn = this._iconButton('⏮', 'Về trang đầu');
    const tocBtn = this._iconButton('☰', 'Mục lục');
    const spacer = document.createElement('div');
    spacer.className = 'flipbook__toolbar-spacer';
    const soundBtn = this._iconButton('🔊', 'Bật/tắt âm thanh lật trang');
    const fsBtn = this._iconButton('⤢', 'Mở toàn màn hình');
    toolbar.append(firstBtn, tocBtn, spacer, soundBtn, fsBtn);

    const bookWrap = document.createElement('div');
    bookWrap.className = 'flipbook__book-wrap';
    const book = document.createElement('div');
    book.className = 'flipbook__book';
    bookWrap.appendChild(book);

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
    tocClose.textContent = '✕';
    tocClose.setAttribute('aria-label', 'Đóng mục lục');
    tocHeader.append(tocSearch, tocClose);
    const tocList = document.createElement('div');
    tocList.className = 'flipbook__toc-list';
    toc.append(tocHeader, tocList);
    bookWrap.appendChild(toc);

    const controls = document.createElement('div');
    controls.className = 'flipbook__controls';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'flipbook__btn flipbook__btn--prev';
    prevBtn.style.border = `1px solid ${this.accent}`;
    prevBtn.style.color = this.accent;
    prevBtn.style.background = 'none';
    const pageLabel = document.createElement('div');
    pageLabel.className = 'flipbook__page-label';
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'flipbook__btn flipbook__btn--next';
    nextBtn.style.background = this.accent;
    nextBtn.style.border = `1px solid ${this.accent}`;
    controls.append(prevBtn, pageLabel, nextBtn);

    root.append(toolbar, bookWrap, controls);
    this.mount.appendChild(root);

    this.el = {
      root, toolbar, firstBtn, tocBtn, soundBtn, fsBtn, bookWrap, book,
      toc, tocSearch, tocClose, tocList, prevBtn, pageLabel, nextBtn
    };
  }

  _iconButton(label, title) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flipbook__icon-btn';
    btn.textContent = label;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    return btn;
  }

  _buildPages() {
    this.pageEls = [];
    const cover = document.createElement('div');
    cover.className = 'flipbook__page flipbook__page--cover';
    cover.style.background = `linear-gradient(155deg, ${this.accent}, ${this._mix(this.accent, '#000000', 0.35)})`;
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
    cover.append(badge, title, subtitle);
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
      minWidth: 220,
      maxWidth: this.width * 3,
      minHeight: 280,
      maxHeight: this.height * 3,
      showCover: false,
      usePortrait: true,
      flippingTime: 650,
      maxShadowOpacity: 0.55,
      mobileScrollSupport: false
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
    this.el.prevBtn.addEventListener('click', () => this.pageFlip.flipPrev());
    this.el.nextBtn.addEventListener('click', () => this.pageFlip.flipNext());
    this.el.firstBtn.addEventListener('click', () => this.jumpTo(0));
    this.el.tocBtn.addEventListener('click', () => this.toggleToc());
    this.el.tocClose.addEventListener('click', () => this.toggleToc(false));
    this.el.tocSearch.addEventListener('input', () => this._filterToc());
    this.el.soundBtn.addEventListener('click', () => this.toggleSound());
    this.el.fsBtn.addEventListener('click', () => this.toggleFullscreen());
    document.addEventListener('fullscreenchange', () => {
      const isFs = document.fullscreenElement === this.el.root;
      this.el.root.classList.toggle('is-fullscreen', isFs);
      this.el.fsBtn.textContent = isFs ? '⤡' : '⤢';
      this.el.fsBtn.title = isFs ? 'Thu nhỏ' : 'Mở toàn màn hình';
      window.dispatchEvent(new Event('resize'));
    });
  }

  jumpTo(n) {
    n = Math.max(0, Math.min(this.total, Math.round(n)));
    this.pageFlip.turnToPage(n);
    this.current = n;
    this._preloadAround(n);
    this._updateControls();
    this.toggleToc(false);
  }

  toggleFullscreen() {
    if (document.fullscreenElement === this.el.root) {
      document.exitFullscreen();
    } else if (this.el.root.requestFullscreen) {
      this.el.root.requestFullscreen().catch(() => {});
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.el.soundBtn.classList.toggle('is-active', !this.soundEnabled);
    this.el.soundBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
  }

  toggleToc(force) {
    const willShow = typeof force === 'boolean' ? force : this.el.toc.hidden;
    if (willShow && !this._tocBuilt) this._buildToc();
    this.el.toc.hidden = !willShow;
    if (willShow) this.el.tocSearch.value = '', this._filterToc();
  }

  _buildToc() {
    this.el.tocList.innerHTML = '';
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
      gain.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + 0.015);
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
    this.el.prevBtn.textContent = this.texts.prevLabel;
    this.el.nextBtn.textContent = this.texts.nextLabel;
    this.el.pageLabel.textContent = this.texts.pageLabel(this.current, this.total);
  }

  setTexts(texts) {
    this.texts = texts;
    this._coverTitleEl.textContent = texts.coverTitle;
    this._coverSubtitleEl.textContent = texts.coverSubtitle;
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
