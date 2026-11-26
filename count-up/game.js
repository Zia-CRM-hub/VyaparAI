// Count Up: how many are there?
const start = () => K.quiz({
  id: "count",
  gen: () => {
    const n = K.rnd(1, 10), item = K.pick([...K.ANIMALS, ...K.FRUITS]).e, q = K.t("How many?", "كم العدد؟");
    return {
      prompt: `<div class="items">${Array(n).fill(item).join(" ")}</div><div>${q}</div>`, say: q, sayOk: K.num(n), cols: 3,
      choices: K.opts(n, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3).map((v) => ({ html: K.num(v), ok: v === n })),
    };
  },
});
K.page("Count Up", "🔢", start);
