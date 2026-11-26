// Memory Match: flip cards, find the pairs.
const start = () => {
  const app = K.$("#app"), pairs = K.sample([...K.ANIMALS, ...K.FRUITS], 6), cards = K.shuffle([...pairs, ...pairs]);
  let open = [], moves = 0, matched = 0, lock = false;
  app.innerHTML = `<div class="prog"><span>${K.t("Moves", "الحركات")}: <b id="mv">${K.num(0)}</b></span><span>${K.t("Find the pairs!", "جد الأزواج!")}</span></div><div class="grid" id="g" style="grid-template-columns:repeat(4,1fr)"></div><div class="msg" id="msg"></div>`;
  const g = K.$("#g");
  cards.forEach((c) => {
    const d = document.createElement("div"); d.className = "card"; d.textContent = "❓";
    d.onclick = () => {
      if (lock || d.classList.contains("up") || d.classList.contains("done")) return;
      d.classList.add("up"); d.textContent = c.e; open.push({ c, d });
      if (open.length < 2) return;
      moves++; K.$("#mv").textContent = K.num(moves);
      const [a, b] = open; open = [];
      if (a.c === b.c) {
        a.d.className = b.d.className = "card done"; matched++; K.good(); K.speak(K.L(c)); K.$("#msg").textContent = K.L(c) + " " + c.e;
        if (matched === 6) setTimeout(finish, 900);
      } else {
        lock = true; K.bad();
        setTimeout(() => { [a, b].forEach((x) => { x.d.className = "card"; x.d.textContent = "❓"; }); lock = false; }, 800);
      }
    };
    g.appendChild(d);
  });
  function finish() {
    const stars = moves <= 9 ? 3 : moves <= 14 ? 2 : 1; let best = 0;
    try { best = +localStorage.getItem("kids-best-memory") || 0; if (!best || moves < best) localStorage.setItem("kids-best-memory", moves); } catch {}
    app.innerHTML = `<div class="end"><div class="stars">${"⭐".repeat(stars)}</div><h2>${K.t("You did it!", "أحسنت!")}</h2><p>${K.t("Moves", "الحركات")}: ${K.num(moves)}</p>${best && best <= moves ? `<p>${K.t("Best", "الأفضل")}: ${K.num(best)}</p>` : `<p>🏆 ${K.t("New best!", "رقم قياسي جديد!")}</p>`}<button class="btn" id="again">${K.t("Play again", "العب مرة أخرى")}</button></div>`;
    K.$("#again").onclick = start; K.confetti(40); K.good();
  }
};
K.page("Memory Match", "🧠", start);
