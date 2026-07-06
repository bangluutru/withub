// Performant vanilla-JS flipbook.
// Only ever keeps 3 <img>-bearing leaf elements in the DOM (prev / current / next),
// regardless of how many total pages the book has (works fine for 400+ page books).
class Flipbook {
  /**
   * @param {HTMLElement} mount
   * @param {Object} opts
   * @param {number} opts.total - number of content pages (cover is page 0, content is 1..total)
   * @param {(pageNum:number)=>string} opts.getSrc - returns image src for content page pageNum (1-based)
   * @param {string} opts.accent
   * @param {string} opts.paper
   * @param {number} opts.width
   * @param {number} opts.height
   * @param {boolean} [opts.showJump] - show a "jump to page" slider (useful for large books)
   */
  constructor(mount, opts) {
    this.mount = mount;
    this.total = opts.total;
    this.getSrc = opts.getSrc;
    this.accent = opts.accent;
    this.paper = opts.paper || '#FAF6F0';
    this.width = opts.width;
    this.height = opts.height;
    this.showJump = !!opts.showJump;
    this.current = 0;
    this.animating = false;
    this.lang = 'vi';
    this.texts = opts.texts; // { coverTitle, coverSubtitle, prevLabel, nextLabel, pageLabel(n,total), placeholderLabel, pageNumLabel(n) }
    this._buildSkeleton();
    this._renderPool();
    this._updateControls();
  }

  _mix(hexA, hexB, t) {
    const toRgb = (hex) => {
      hex = String(hex).replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
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

    const stage = document.createElement('div');
    stage.className = 'flipbook__stage';
    stage.style.setProperty('--fb-w', this.width + 'px');
    stage.style.aspectRatio = `${this.width} / ${this.height}`;

    const shadow = document.createElement('div');
    shadow.className = 'flipbook__shadow';
    const spine = document.createElement('div');
    spine.className = 'flipbook__spine';
    const perspective = document.createElement('div');
    perspective.className = 'flipbook__perspective';

    stage.append(shadow, spine, perspective);
    root.appendChild(stage);

    const controls = document.createElement('div');
    controls.className = 'flipbook__controls';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'flipbook__btn flipbook__btn--prev';
    prevBtn.style.border = `1px solid ${this.accent}`;
    prevBtn.style.color = this.accent;
    prevBtn.style.background = 'none';
    prevBtn.addEventListener('click', () => this.prev());

    const pageLabel = document.createElement('div');
    pageLabel.className = 'flipbook__page-label';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'flipbook__btn flipbook__btn--next';
    nextBtn.style.background = this.accent;
    nextBtn.style.border = `1px solid ${this.accent}`;
    nextBtn.addEventListener('click', () => this.next());

    controls.append(prevBtn, pageLabel, nextBtn);
    root.appendChild(controls);

    if (this.showJump) {
      const jump = document.createElement('div');
      jump.className = 'flipbook__jump';
      const jumpLabel = document.createElement('span');
      jumpLabel.className = 'flipbook__jump-label';
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = String(this.total);
      slider.value = '0';
      slider.setAttribute('aria-label', 'Jump to page');
      slider.addEventListener('input', () => this.jumpTo(Number(slider.value)));
      jump.append(jumpLabel, slider);
      root.appendChild(jump);
      this.el = { jump, jumpLabel, slider };
    } else {
      this.el = {};
    }

    this.mount.appendChild(root);
    Object.assign(this.el, { root, stage, perspective, prevBtn, pageLabel, nextBtn });
  }

  _makeLeaf(pageNum, flipped) {
    const leaf = document.createElement('div');
    leaf.className = 'flipbook__leaf';
    leaf.style.transform = `rotateY(${flipped ? -180 : 0}deg)`;

    const front = document.createElement('div');
    front.className = 'flipbook__face';
    const isCover = pageNum === 0;
    front.style.borderRadius = isCover ? '3px 12px 12px 3px' : '3px 7px 7px 3px';
    front.style.background = isCover
      ? `linear-gradient(155deg, ${this.accent}, ${this._mix(this.accent, '#000000', 0.35)})`
      : `repeating-linear-gradient(125deg, ${this.paper}, ${this.paper} 11px, ${this._mix(this.paper, this.accent, 0.10)} 11px, ${this._mix(this.paper, this.accent, 0.10)} 22px)`;

    if (isCover) {
      const cover = document.createElement('div');
      cover.className = 'flipbook__cover-face';
      const badge = document.createElement('div');
      badge.className = 'flipbook__cover-badge';
      const img = document.createElement('img');
      img.src = 'images/brand/witflower.png';
      img.alt = '';
      badge.appendChild(img);
      const title = document.createElement('div');
      title.className = 'flipbook__cover-title';
      title.textContent = this.texts.coverTitle;
      const subtitle = document.createElement('div');
      subtitle.className = 'flipbook__cover-subtitle';
      subtitle.textContent = this.texts.coverSubtitle;
      cover.append(badge, title, subtitle);
      front.appendChild(cover);
    } else {
      const img = document.createElement('img');
      img.loading = 'eager';
      img.decoding = 'async';
      img.alt = this.texts.pageNumLabel ? this.texts.pageNumLabel(pageNum) : `Page ${pageNum}`;
      img.src = this.getSrc(pageNum);
      front.appendChild(img);
    }

    const back = document.createElement('div');
    back.className = 'flipbook__face flipbook__face--back';
    back.style.borderRadius = isCover ? '3px 12px 12px 3px' : '3px 7px 7px 3px';
    back.style.background = this._mix(this.paper, '#000000', 0.12);

    leaf.append(front, back);
    leaf.dataset.page = String(pageNum);
    leaf.dataset.flipped = flipped ? '1' : '0';
    leaf.addEventListener('click', () => {
      if (leaf.dataset.flipped === '1') this.prev();
      else this.next();
    });
    return leaf;
  }

  _renderPool() {
    const c = this.current;
    const prevIdx = c - 1;
    const nextIdx = c + 1;
    this.el.perspective.innerHTML = '';
    this.leaves = {};

    if (prevIdx >= 0) {
      const leaf = this._makeLeaf(prevIdx, true);
      leaf.style.zIndex = 1;
      this.el.perspective.appendChild(leaf);
      this.leaves.prev = leaf;
    }
    if (nextIdx <= this.total) {
      const leaf = this._makeLeaf(nextIdx, false);
      leaf.style.zIndex = 2;
      this.el.perspective.appendChild(leaf);
      this.leaves.next = leaf;
    }
    const curr = this._makeLeaf(c, false);
    curr.style.zIndex = 3;
    this.el.perspective.appendChild(curr);
    this.leaves.curr = curr;
  }

  _updateControls() {
    this.el.prevBtn.disabled = this.current <= 0;
    this.el.nextBtn.disabled = this.current >= this.total;
    this.el.prevBtn.textContent = this.texts.prevLabel;
    this.el.nextBtn.textContent = this.texts.nextLabel;
    this.el.pageLabel.textContent = this.texts.pageLabel(this.current, this.total);
    if (this.el.slider) {
      this.el.slider.value = String(this.current);
      this.el.jumpLabel.textContent = this.texts.jumpLabel ? this.texts.jumpLabel(this.current, this.total) : '';
    }
  }

  next() {
    if (this.animating || this.current >= this.total) return;
    this.animating = true;
    this.leaves.curr.style.transform = 'rotateY(-180deg)';
    this.leaves.curr.dataset.flipped = '1';
    window.setTimeout(() => {
      this.current += 1;
      this._renderPool();
      this._updateControls();
      this.animating = false;
    }, 760);
  }

  prev() {
    if (this.animating || this.current <= 0) return;
    this.animating = true;
    if (this.leaves.prev) {
      this.leaves.prev.style.transform = 'rotateY(0deg)';
      this.leaves.prev.dataset.flipped = '0';
    }
    window.setTimeout(() => {
      this.current -= 1;
      this._renderPool();
      this._updateControls();
      this.animating = false;
    }, 760);
  }

  jumpTo(n) {
    n = Math.max(0, Math.min(this.total, Math.round(n)));
    if (n === this.current || this.animating) return;
    this.current = n;
    this._renderPool();
    this._updateControls();
  }

  setTexts(texts) {
    this.texts = texts;
    this._renderPool();
    this._updateControls();
  }
}
