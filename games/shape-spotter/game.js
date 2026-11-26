// Shape Spotter: what shape is this?
const SHAPES = [
  { en: "Circle", ar: "دائرة", svg: '<circle cx="50" cy="50" r="42"/>' },
  { en: "Square", ar: "مربع", svg: '<rect x="12" y="12" width="76" height="76"/>' },
  { en: "Rectangle", ar: "مستطيل", svg: '<rect x="6" y="28" width="88" height="44"/>' },
  { en: "Triangle", ar: "مثلث", svg: '<polygon points="50,8 92,88 8,88"/>' },
  { en: "Star", ar: "نجمة", svg: '<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/>' },
  { en: "Heart", ar: "قلب", svg: '<path d="M50 90 C8 58 6 26 30 18 C42 14 50 24 50 32 C50 24 58 14 70 18 C94 26 92 58 50 90Z"/>' },
  { en: "Diamond", ar: "معين", svg: '<polygon points="50,4 92,50 50,96 8,50"/>' },
  { en: "Oval", ar: "بيضاوي", svg: '<ellipse cx="50" cy="50" rx="44" ry="28"/>' },
];
const fills = K.COLORS.filter((c) => !["Black", "White", "Brown"].includes(c.en)).map((c) => c.hex);
const start = () => K.quiz({
  id: "shapes",
  gen: () => {
    const s = K.pick(SHAPES), q = K.t("What shape is this?", "ما هذا الشكل؟");
    return {
      prompt: `<svg viewBox="0 0 100 100" fill="${K.pick(fills)}" stroke="#fff" stroke-width="3">${s.svg}</svg><div>${q}</div>`, say: q, sayOk: K.L(s), cols: 2,
      choices: K.opts(s, SHAPES, 4).map((x) => ({ html: K.L(x), ok: x === s })),
    };
  },
});
K.page("Shape Spotter", "🔷", start);
