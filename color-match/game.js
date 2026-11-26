// Color Match: name the color, or find the color.
const swatch = (hex) => `<span style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${hex};border:4px solid #fff"></span>`;
const start = () => K.quiz({
  id: "colors",
  gen: () => {
    const c = K.pick(K.COLORS), four = K.opts(c, K.COLORS, 4);
    if (Math.random() < 0.5) {
      const q = K.t("What color is this?", "ما هذا اللون؟");
      return { prompt: `<div class="blob" style="background:${c.hex}"></div><div>${q}</div>`, say: q, sayOk: K.L(c), cols: 2, choices: four.map((x) => ({ html: K.L(x), ok: x === c })) };
    }
    const q = K.t("Find the color", "جد اللون") + ": " + K.L(c);
    return { prompt: `<div>${q}</div>`, say: q, sayOk: K.L(c), cols: 2, choices: four.map((x) => ({ html: swatch(x.hex), ok: x === c })) };
  },
});
K.page("Color Match", "🎨", start);
