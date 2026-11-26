// Pattern Fix: what comes next?
const THEMES = [["🔴", "🔵", "🟢"], ["🟡", "🟣", "🟠"], ["🐶", "🐱", "🐸"], ["🍎", "🍌", "🍇"], ["⭐", "🌙", "☀️"], ["🚗", "🚌", "🚲"], ["🌸", "🍀", "🌻"]];
const PATTERNS = [[0, 1], [0, 0, 1], [0, 1, 2], [0, 1, 1], [0, 1, 2, 1]];
const start = () => K.quiz({
  id: "pattern",
  gen: () => {
    const theme = K.shuffle(K.pick(THEMES)), p = K.pick(PATTERNS), seq = Array.from({ length: 7 }, (_, i) => theme[p[i % p.length]]), ans = seq[6];
    return {
      prompt: `<div class="items" style="letter-spacing:6px">${seq.slice(0, 6).join(" ")} ❓</div><div>${K.t("What comes next?", "ما التالي؟")}</div>`, cols: 3,
      choices: K.shuffle(theme).map((e) => ({ html: `<span class="big">${e}</span>`, ok: e === ans })),
    };
  },
});
K.page("Pattern Fix", "🧩", start);
