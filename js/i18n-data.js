// Bilingual content data, adapted from the original design (Cộng Đồng Nội Tâm - Website.dc.html).
const RAW = {
  brand: { vi: 'Cộng Đồng Nội Tâm Quốc Tế', en: 'International Inner-Being Community' },
  navAnchors: ['source', 'diagram', 'quotes', 'dictionary', 'course', 'community', 'journey', 'contact'],
  navLabels: [
    { vi: 'Khái niệm nguồn', en: 'Source Concepts' },
    { vi: 'Đồ hình', en: 'Diagram' },
    { vi: 'Câu nói nội tâm', en: 'Inner Being Quotes' },
    { vi: 'Từ điển', en: 'Dictionary' },
    { vi: 'Khoá học', en: 'Course' },
    { vi: 'Cộng đồng', en: 'Community' },
    { vi: 'Hành trình', en: 'Journey' },
    { vi: 'Liên hệ', en: 'Contact' }
  ],
  hero: {
    eyebrow: { vi: 'Cộng Đồng Nội Tâm Song Ngữ', en: 'A Bilingual Inner-Being Community' },
    title: { vi: 'Trở về bên trong,\ncùng nhau tỉnh thức', en: 'Return within,\nawaken together' },
    subtitle: { vi: 'Không gian song ngữ Việt – Anh dành cho những ai đang trên hành trình hiểu mình, chữa lành và trưởng thành nội tâm.', en: 'A Vietnamese–English space for those on the journey of self-understanding, healing, and inner growth.' },
    ctaPrimary: { vi: 'Tham gia cộng đồng', en: 'Join the Community' },
    ctaSecondary: { vi: 'Khám phá khái niệm nguồn', en: 'Explore Source Concepts' }
  },
  source: {
    kicker: { vi: '02 — Khái Niệm Nguồn', en: '02 — Source Concepts' },
    title: { vi: 'Nền tảng tri thức từ Thầy Lê', en: 'Foundational teachings from Master Lê' },
    body: { vi: 'Toàn bộ hệ thống nội tâm được xây dựng trên nền khái niệm gốc do Thầy Lê hệ thống hoá — nơi khởi nguồn của mọi đồ hình, thuật ngữ và bài học trong giáo trình.', en: 'The entire inner-being framework rests on source concepts systematized by Master Lê — the origin of every diagram, term, and lesson in the curriculum.' },
    cta: { vi: 'Đến trang Khái niệm nguồn', en: 'Visit Source Concepts' },
    placeholder: { vi: 'ẢNH MINH HOẠ · 4:3', en: 'ILLUSTRATION PLACEHOLDER · 4:3' }
  },
  diagram: {
    kicker: { vi: '03 — Đồ Hình', en: '03 — Diagram' },
    title: { vi: 'Đồ hình trực quan hoá cấu trúc nội tâm', en: 'Diagrams that map the structure of the inner being' },
    body: { vi: 'Lật từng trang để khám phá hệ thống đồ hình — nơi các khái niệm trừu tượng được hình ảnh hoá thành những sơ đồ dễ nắm bắt.', en: 'Turn each page to explore the diagram library — abstract concepts rendered as clear, visual maps.' },
    note: { vi: '* {count} đồ hình song ngữ Việt – Anh', en: '* {count} bilingual diagrams' },
    bookTitle: { vi: 'Đồ Hình', en: 'Diagram' },
    bookSubtitle: { vi: 'ĐỒ HÌNH NỘI TÂM', en: 'INNER-BEING DIAGRAM' }
  },
  quotes: {
    kicker: { vi: '04 — Câu Nói Nội Tâm', en: '04 — Inner Being Quotes' },
    title: { vi: 'Những lời nhắc nhở cho hành trình quay về', en: 'Words to return to, again and again' },
    body: { vi: 'Một tuyển tập câu nói chắt lọc từ giáo trình nội tâm, dùng để chiêm nghiệm mỗi ngày.', en: 'A curated collection of reflections from the curriculum, for daily contemplation.' },
    note: { vi: '* Lật để xem toàn bộ tuyển tập câu nói', en: '* Turn the pages to see the full collection' },
    bookTitle: { vi: 'Câu Nói', en: 'Quotes' },
    bookSubtitle: { vi: 'CÂU NÓI NỘI TÂM', en: 'INNER BEING QUOTES' }
  },
  dictionary: {
    kicker: { vi: '05 — Từ Điển', en: '05 — Dictionary' },
    title: { vi: 'Tra cứu thuật ngữ nội tâm Việt – Anh', en: 'Look up Vietnamese–English inner-being terms' },
    body: { vi: 'Từ điển song ngữ tổng hợp các thuật ngữ chuyên biệt được sử dụng xuyên suốt giáo trình.', en: 'A bilingual glossary of the specialized terms used throughout the curriculum.' },
    cta: { vi: 'Mở từ điển', en: 'Open Dictionary' }
  },
  course: {
    kicker: { vi: '06 — Khoá Học', en: '06 — Course' },
    title: { vi: 'Mentor Quốc Tế — chương trình đào tạo chuyên sâu', en: 'International Mentor — an in-depth training program' },
    body: { vi: 'Chương trình đồng hành chuyên sâu dành cho những ai muốn bước vào vai trò dẫn dắt hành trình nội tâm cho người khác. (Nội dung chi tiết sẽ được cập nhật)', en: 'An immersive program for those ready to guide others on the inner-being journey. (Full details coming soon)' },
    cta: { vi: 'Xem lộ trình khoá học', en: 'View Course Roadmap' },
    placeholder: { vi: 'HÌNH ẢNH KHOÁ HỌC', en: 'COURSE VISUAL' }
  },
  community: {
    kicker: { vi: '07 — Cộng Đồng', en: '07 — Community' },
    title: { vi: 'Cùng nhau huân tập mỗi ngày', en: 'Cultivating together, every day' },
    body: {
      vi: 'Trân trọng kính mời anh chị tham gia Cộng Đồng Nội Tâm Song Ngữ để cập nhật thông tin mới nhất và cùng nhau huân tập tri thức nội tâm Việt - Anh mỗi ngày trên hành trình hiểu mình, chữa lành và trưởng thành.',
      en: 'We warmly invite you to join the Bilingual Inner-Being Community to stay updated and cultivate Vietnamese–English inner wisdom together — every day — on the journey of self-understanding, healing, and growth.'
    },
    links: [
      { name: 'Zalo', initial: 'Z', sub: { vi: 'Nhóm Zalo', en: 'Zalo Group' }, href: 'https://zalo.me/g/wqxpsu324?joinSrc=9' },
      { name: 'Telegram', initial: 'T', sub: { vi: 'Nhóm Telegram', en: 'Telegram Group' }, href: 'https://t.me/+6_XtMvMxLVs5YTYx' },
      { name: 'Facebook', initial: 'F', sub: { vi: 'Nhóm Facebook', en: 'Facebook Group' }, href: 'https://www.facebook.com/share/g/19EseqXPEe/' }
    ]
  },
  journey: {
    kicker: { vi: '08 — Hành Trình Tiếp Theo', en: '08 — Continue the Journey' },
    title: { vi: 'Tiếp tục khám phá', en: 'Keep exploring' },
    items: [
      { title: { vi: 'Bản Đồ Học Tập', en: 'Study Map' }, desc: { vi: 'Lộ trình từng bước để đi sâu vào hệ thống giáo trình nội tâm.', en: 'A step-by-step path through the inner-being curriculum.' } },
      { title: { vi: 'Thư Viện', en: 'Library' }, desc: { vi: 'Kho tài liệu, bài viết và tư liệu tham khảo cho hành trình nội tâm.', en: 'A library of articles and references to support your journey.' } },
      { title: { vi: 'Nhật Ký Nội Tâm', en: 'Daily Inner Being' }, desc: { vi: 'Không gian ghi chép và chiêm nghiệm nội tâm mỗi ngày.', en: 'A space for daily inner reflection and journaling.' } }
    ],
    comingSoon: { vi: 'Sắp ra mắt', en: 'Coming soon' }
  },
  footer: {
    tagline: { vi: 'Không gian trở về bên trong.', en: 'A space to return within.' },
    email: 'hello@innerbeing.community',
    contactLabel: { vi: 'Liên hệ', en: 'Contact' },
    sitemapLabel: { vi: 'Sơ đồ trang', en: 'Sitemap' },
    rights: { vi: 'Bảo lưu mọi quyền.', en: 'All rights reserved.' }
  }
};
