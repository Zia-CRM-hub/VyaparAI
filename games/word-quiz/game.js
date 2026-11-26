// Word Quiz: learn the names of animals and fruits in English and Arabic.
const ALL = [...K.ANIMALS, ...K.FRUITS];
const start = () => K.quiz({
  id: "words-" + K.lang,
  gen: () => {
    const it = K.pick(ALL), q = K.t("What is this?", "ما هذا؟");
    return { prompt: `<div class="huge">${it.e}</div><div>${q}</div>`, say: K.L(it), sayOk: K.L(it), cols: 2, choices: K.opts(it, ALL, 4).map((x) => ({ html: K.L(x), ok: x === it })) };
  },
});
K.page("Word Quiz", "📖", start);
