// Spell It: tap the letters in order to spell the picture. English and Arabic.
const EN = [["🐶", "DOG"], ["🐱", "CAT"], ["🐟", "FISH"], ["🦁", "LION"], ["🦆", "DUCK"], ["🐸", "FROG"], ["🐄", "COW"], ["🍎", "APPLE"], ["🍐", "PEAR"], ["🐷", "PIG"]];
const AR = [["🐶", "كلب"], ["🐱", "قطة"], ["🦆", "بطة"], ["🐘", "فيل"], ["🦁", "أسد"], ["🐪", "جمل"], ["🐒", "قرد"], ["🍇", "عنب"], ["🍌", "موزة"], ["🐟", "سمكة"]];
const start = () => {
  const app = K.$("#app"), words = K.sample(K.lang === "ar" ? AR : EN, 6); let i = 0, score = 0;
  const next = () => {
    if (i >= words.length) return K.end(score, words.length, "kids-best-spell-" + K.lang, start);
    const [emoji, word] = words[i], letters = [...word], tiles = K.shuffle(letters.map((ch, k) => ({ ch, k }))), slots = Array(letters.length).fill(null);
    let wrong = false, done = false;
    app.innerHTML = `<div class="prog"><span>${K.t("Word", "الكلمة")} ${K.num(i + 1)}/${K.num(words.length)}</span><span>⭐ ${K.num(score)}</span></div><div class="bar"><i style="width:${(i / words.length) * 100}%"></i></div><div class="prompt"><div class="huge">${emoji}</div><div>${K.t("Spell it!", "هجِّ الكلمة!")}</div></div><button class="say" id="say">🔊</button><div class="slots" id="slots"></div><div class="tiles" id="tiles"></div><div class="msg" id="msg"></div>`;
    K.$("#say").onclick = () => K.speak(word);
    const draw = () => {
      K.$("#slots").replaceChildren(...slots.map((t, s) => { const d = document.createElement("div"); d.className = "slot" + (t === null ? "" : " full"); d.textContent = t === null ? "" : tiles[t].ch; d.onclick = () => { if (!done && slots[s] !== null) { slots[s] = null; draw(); } }; return d; }));
      K.$("#tiles").replaceChildren(...tiles.map((t, k) => { const d = document.createElement("div"); d.className = "tile" + (slots.includes(k) ? " used" : ""); d.textContent = t.ch; d.onclick = () => put(k); return d; }));
    };
    const put = (k) => {
      if (done) return; const s = slots.indexOf(null); if (s < 0) return; slots[s] = k; draw();
      if (slots.includes(null)) return;
      if (slots.map((t) => tiles[t].ch).join("") === word) { done = true; if (!wrong) score++; K.good(); K.confetti(14); K.$("#msg").textContent = K.praise(); K.speak(word); setTimeout(() => { i++; next(); }, 1400); }
      else { wrong = true; K.bad(); K.$("#msg").textContent = K.t("Try again 💪", "حاول مرة أخرى 💪"); setTimeout(() => { slots.fill(null); draw(); }, 700); }
    };
    draw();
  };
  next();
};
K.page("Spell It", "✏️", start);
