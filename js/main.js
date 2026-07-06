(function () {
  let currentLang = 'vi';

  function resolve(path) {
    const parts = path.split('.');
    let node = RAW;
    for (const p of parts) node = node[p];
    if (node && typeof node === 'object' && (currentLang in node)) return node[currentLang];
    return node;
  }

  function flipLabels() {
    return {
      openLabel: currentLang === 'vi' ? 'Mở sách để đọc' : 'Open the book',
      pageLabel: (current, total) => currentLang === 'vi' ? `Trang ${current} / ${total}` : `Page ${current} / ${total}`
    };
  }

  function applyStaticI18n() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      let val = resolve(el.dataset.i18n);
      if (typeof val === 'string' && val.includes('{count}')) {
        val = val.replace('{count}', DIAGRAM_BASENAMES.length);
      }
      el.textContent = val;
    });
    document.getElementById('langBtnVi').classList.toggle('is-active', currentLang === 'vi');
    document.getElementById('langBtnEn').classList.toggle('is-active', currentLang === 'en');
  }

  function renderNav() {
    const nav = document.getElementById('navMain');
    nav.innerHTML = '';
    RAW.navAnchors.slice(0, 6).forEach((anchor, i) => {
      const a = document.createElement('a');
      a.href = '#' + anchor;
      a.textContent = RAW.navLabels[i][currentLang];
      nav.appendChild(a);
    });
  }

  function renderCommunityLinks() {
    const wrap = document.getElementById('communityLinks');
    wrap.innerHTML = '';
    RAW.community.links.forEach((link) => {
      const a = document.createElement('a');
      a.href = link.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'community__link';
      const badge = document.createElement('div');
      badge.className = 'community__link-initial';
      badge.textContent = link.initial;
      const textWrap = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'community__link-name';
      name.textContent = link.name;
      const sub = document.createElement('div');
      sub.className = 'community__link-sub';
      sub.textContent = link.sub[currentLang];
      textWrap.append(name, sub);
      a.append(badge, textWrap);
      wrap.appendChild(a);
    });
  }

  function renderJourney() {
    const grid = document.getElementById('journeyGrid');
    grid.innerHTML = '';
    RAW.journey.items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'journey__card';
      const title = document.createElement('div');
      title.className = 'journey__card-title';
      title.textContent = item.title[currentLang];
      const desc = document.createElement('div');
      desc.className = 'journey__card-desc';
      desc.textContent = item.desc[currentLang];
      const tag = document.createElement('div');
      tag.className = 'journey__card-tag';
      tag.textContent = RAW.journey.comingSoon[currentLang];
      card.append(title, desc, tag);
      grid.appendChild(card);
    });
  }

  function renderFooter() {
    const email = document.getElementById('footerEmail');
    email.href = 'mailto:' + RAW.footer.email;
    email.textContent = RAW.footer.email;
    const sitemap = document.getElementById('footerSitemap');
    sitemap.innerHTML = '';
    RAW.navAnchors.slice(0, 7).forEach((anchor, i) => {
      const a = document.createElement('a');
      a.href = '#' + anchor;
      a.textContent = RAW.navLabels[i][currentLang];
      sitemap.appendChild(a);
    });
  }

  function prettifyBasename(name) {
    return name.replace(/_/g, ' · ');
  }

  // --- Flipbooks ---
  const diagramFlipbook = new Flipbook(document.getElementById('diagramFlipbook'), {
    total: DIAGRAM_BASENAMES.length,
    accent: '#C0272A',
    paper: '#FBF6F2',
    width: 340,
    height: 480,
    getSrc: (pageNum) => `images/dohinh/${encodeURIComponent(DIAGRAM_BASENAMES[pageNum - 1] + '_' + currentLang)}.webp`,
    getTocLabel: (pageNum) => prettifyBasename(DIAGRAM_BASENAMES[pageNum - 1]),
    texts: Object.assign({
      coverTitle: RAW.diagram.bookTitle.vi,
      coverSubtitle: RAW.diagram.bookSubtitle.vi
    }, flipLabels())
  });

  const quotesFlipbook = new Flipbook(document.getElementById('quotesFlipbook'), {
    total: QUOTE_FILENAMES.length,
    accent: '#8A8A8A',
    paper: '#FBF6F2',
    width: 300,
    height: 430,
    getSrc: (pageNum) => `images/quotes/${encodeURIComponent(QUOTE_FILENAMES[pageNum - 1])}`,
    texts: Object.assign({
      coverTitle: RAW.quotes.bookTitle.vi,
      coverSubtitle: RAW.quotes.bookSubtitle.vi
    }, flipLabels())
  });

  function refreshFlipbookTexts() {
    diagramFlipbook.setTexts(Object.assign({
      coverTitle: RAW.diagram.bookTitle[currentLang],
      coverSubtitle: RAW.diagram.bookSubtitle[currentLang]
    }, flipLabels()));
    diagramFlipbook.refreshImages();
    quotesFlipbook.setTexts(Object.assign({
      coverTitle: RAW.quotes.bookTitle[currentLang],
      coverSubtitle: RAW.quotes.bookSubtitle[currentLang]
    }, flipLabels()));
  }

  function setLang(lang) {
    currentLang = lang;
    applyStaticI18n();
    renderNav();
    renderCommunityLinks();
    renderJourney();
    renderFooter();
    refreshFlipbookTexts();
  }

  document.getElementById('langBtnVi').addEventListener('click', () => setLang('vi'));
  document.getElementById('langBtnEn').addEventListener('click', () => setLang('en'));

  setLang('vi');
})();
