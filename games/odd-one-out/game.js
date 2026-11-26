// Odd One Out: which one does not belong?
const CATS = [K.ANIMALS.map((a) => a.e), K.FRUITS.map((a) => a.e), ["🚗", "🚌", "🚲", "✈️", "🚂", "🚀", "🚁", "⛵"], ["⚽", "🏀", "🎾", "🏈", "🏐"], ["☀️", "🌧️", "❄️", "🌈", "⚡"]];
const start = () => K.quiz({
  id: "odd",
  gen: () => {
    const [a, b] = K.sample(CATS, 2), same = K.sample(a, 3), odd = K.pick(b), q = K.t("Which one is different?", "أيهم مختلف؟");
    return { prompt: `<div>${q}</div>`, say: q, cols: 2, choices: K.shuffle([...same, odd]).map((e) => ({ html: `<span class="big">${e}</span>`, ok: e === odd })) };
  },
});
K.page("Odd One Out", "🕵️", start);
