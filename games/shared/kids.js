// Shared helpers for the kids games: language, speech, sounds, confetti, quiz engine.
const K = (() => {
  let lang = "en"; try { lang = localStorage.getItem("kids-lang") === "ar" ? "ar" : "en"; } catch {}
  const $ = (s) => document.querySelector(s);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const rnd = (a, b) => a + ((Math.random() * (b - a + 1)) | 0);
  const num = (n) => (lang === "ar" ? String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]) : String(n));
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const L = (o) => (lang === "ar" ? o.ar : o.en);
  const opts = (ok, pool, n = 3) => shuffle([ok, ...sample(pool.filter((x) => x !== ok), n - 1)]);

  let ac;
  const tone = (f, d = 0.15, type = "sine") => { try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.value = 0.08; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d); o.stop(ac.currentTime + d); } catch {} };
  const good = () => { tone(660); setTimeout(() => tone(880), 110); };
  const bad = () => tone(180, 0.25, "square");
  const speak = (text) => { try { if (!text || !window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text)); u.lang = lang === "ar" ? "ar-SA" : "en-US"; u.rate = 0.85; speechSynthesis.speak(u); } catch {} };
  const confetti = (n = 24) => { const e = ["🎈", "⭐", "🎉", "✨", "💖", "🌟"]; for (let i = 0; i < n; i++) { const s = document.createElement("div"); s.className = "pc"; s.textContent = pick(e); s.style.left = Math.random() * 100 + "vw"; s.style.fontSize = 18 + Math.random() * 22 + "px"; s.style.animationDelay = Math.random() * 0.4 + "s"; document.body.appendChild(s); setTimeout(() => s.remove(), 2400); } };
  const praise = () => pick(lang === "ar" ? ["ممتاز! 🌟", "أحسنت! 👏", "رائع! 🎉", "برافو! 💖"] : ["Great job! 🌟", "Well done! 👏", "Awesome! 🎉", "You got it! 💖"]);

  // Page shell: header with Home + language toggle. start() runs now and whenever the language changes.
  function page(title, icon, start) {
    const apply = () => { document.body.classList.toggle("ar", lang === "ar"); document.documentElement.lang = lang; };
    document.title = title + " | Kids Games";
    $("#hdr").innerHTML = `<a class="home" href="../index.html" aria-label="Home">🏠</a><h1>${icon} ${title}</h1><button class="langbtn" id="langbtn"></button>`;
    const lb = $("#langbtn"), label = () => (lb.textContent = lang === "en" ? "عربي" : "English");
    lb.onclick = () => { lang = lang === "en" ? "ar" : "en"; try { localStorage.setItem("kids-lang", lang); } catch {} apply(); label(); start(); };
    apply(); label(); start();
  }

  function end(score, total, key, again) {
    const r = score / total, stars = r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1; let best = 0;
    try { best = +localStorage.getItem(key) || 0; if (score > best) localStorage.setItem(key, score); } catch {}
    const isBest = score > best;
    $("#app").innerHTML = `<div class="end"><div class="stars">${"⭐".repeat(stars)}</div><h2>${t("All done!", "انتهت اللعبة!")}</h2><p>${t("Score", "النتيجة")}: ${num(score)} / ${num(total)}</p>${isBest ? `<p>🏆 ${t("New best!", "رقم قياسي جديد!")}</p>` : best ? `<p>${t("Best", "الأفضل")}: ${num(best)}</p>` : ""}<button class="btn" id="again">${t("Play again", "العب مرة أخرى")}</button></div>`;
    $("#again").onclick = again; confetti(40); good();
  }

  // Multiple-choice quiz. gen(i) -> { prompt: html, say?: text, sayOk?: text, cols?: 2|3|4, choices: [{ html, ok }] }
  function quiz({ id, gen, total = 10 }) {
    const app = $("#app"); let i = 0, score = 0;
    const next = () => {
      if (i >= total) return end(score, total, "kids-best-" + id, () => quiz({ id, gen, total }));
      const q = gen(i); let tries = 0, done = false;
      app.innerHTML = `<div class="prog"><span>${t("Question", "السؤال")} ${num(i + 1)}/${num(total)}</span><span>⭐ ${num(score)}</span></div><div class="bar"><i style="width:${(i / total) * 100}%"></i></div><div class="prompt">${q.prompt}</div>${q.say ? `<button class="say" id="say" aria-label="Listen">🔊</button>` : ""}<div class="choices c${q.cols || 2}"></div><div class="msg" id="msg"></div>`;
      if (q.say) $("#say").onclick = () => speak(q.say);
      const box = app.querySelector(".choices");
      q.choices.forEach((c) => {
        const b = document.createElement("button"); b.className = "choice"; b.innerHTML = c.html;
        b.onclick = () => {
          if (done) return;
          if (c.ok) { done = true; b.classList.add("ok"); good(); if (!tries) score++; confetti(12); $("#msg").textContent = praise(); speak(q.sayOk); setTimeout(() => { i++; next(); }, 1300); }
          else { tries++; b.classList.add("no"); b.disabled = true; bad(); $("#msg").textContent = t("Try again 💪", "حاول مرة أخرى 💪"); }
        };
        box.appendChild(b);
      });
    };
    next();
  }

  const mk = (rows) => rows.map(([e, en, ar]) => ({ e, en, ar }));
  const ANIMALS = mk([["🐶", "Dog", "كلب"], ["🐱", "Cat", "قطة"], ["🐘", "Elephant", "فيل"], ["🦁", "Lion", "أسد"], ["🐒", "Monkey", "قرد"], ["🐰", "Rabbit", "أرنب"], ["🐟", "Fish", "سمكة"], ["🐦", "Bird", "طائر"], ["🐴", "Horse", "حصان"], ["🐄", "Cow", "بقرة"], ["🐑", "Sheep", "خروف"], ["🐪", "Camel", "جمل"], ["🦒", "Giraffe", "زرافة"], ["🐢", "Turtle", "سلحفاة"], ["🐸", "Frog", "ضفدع"], ["🦆", "Duck", "بطة"]]);
  const FRUITS = mk([["🍎", "Apple", "تفاحة"], ["🍌", "Banana", "موزة"], ["🍇", "Grapes", "عنب"], ["🍓", "Strawberry", "فراولة"], ["🍊", "Orange", "برتقالة"], ["🍉", "Watermelon", "بطيخ"], ["🍐", "Pear", "كمثرى"], ["🍒", "Cherries", "كرز"], ["🍍", "Pineapple", "أناناس"], ["🥭", "Mango", "مانجو"]]);
  const COLORS = [["Red", "أحمر", "#e53935"], ["Blue", "أزرق", "#1e88e5"], ["Green", "أخضر", "#43a047"], ["Yellow", "أصفر", "#fdd835"], ["Orange", "برتقالي", "#fb8c00"], ["Purple", "بنفسجي", "#8e24aa"], ["Pink", "وردي", "#ec407a"], ["Brown", "بني", "#6d4c41"], ["Black", "أسود", "#212121"], ["White", "أبيض", "#ffffff"]].map(([en, ar, hex]) => ({ en, ar, hex }));

  return { $, pick, shuffle, sample, rnd, num, t, L, opts, good, bad, speak, confetti, praise, page, quiz, end, ANIMALS, FRUITS, COLORS, get lang() { return lang; } };
})();
