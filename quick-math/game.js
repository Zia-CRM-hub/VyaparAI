// Quick Math: easy adding and taking away, gets harder as you go.
const start = () => K.quiz({
  id: "math",
  gen: (i) => {
    const max = i < 3 ? 5 : i < 7 ? 10 : 20, plus = Math.random() < 0.6;
    let a = K.rnd(1, max), b = K.rnd(1, max);
    if (!plus && b > a) [a, b] = [b, a];
    const ans = plus ? a + b : a - b, wrong = new Set();
    while (wrong.size < 3) { const w = ans + K.pick([-3, -2, -1, 1, 2, 3]); if (w >= 0 && w !== ans) wrong.add(w); }
    return {
      prompt: `<div class="huge" dir="ltr" style="font-size:clamp(44px,14vw,80px)">${K.num(a)} ${plus ? "+" : "−"} ${K.num(b)} = ❓</div>`, cols: 2, sayOk: K.num(ans),
      choices: K.shuffle([ans, ...wrong]).map((v) => ({ html: K.num(v), ok: v === ans })),
    };
  },
});
K.page("Quick Math", "➕", start);
