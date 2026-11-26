// Letter Match: which picture starts with this letter? (English and Arabic)
const EN = [["A", "🍎", "Apple"], ["B", "⚽", "Ball"], ["C", "🐱", "Cat"], ["D", "🐶", "Dog"], ["E", "🐘", "Elephant"], ["F", "🐟", "Fish"], ["G", "🍇", "Grapes"], ["H", "🐴", "Horse"], ["I", "🍦", "Ice cream"], ["J", "🧃", "Juice"], ["K", "🪁", "Kite"], ["L", "🦁", "Lion"], ["M", "🐒", "Monkey"], ["N", "👃", "Nose"], ["O", "🍊", "Orange"], ["P", "🍕", "Pizza"], ["Q", "👑", "Queen"], ["R", "🐰", "Rabbit"], ["S", "☀️", "Sun"], ["T", "🌳", "Tree"], ["U", "☂️", "Umbrella"], ["V", "🎻", "Violin"], ["W", "🍉", "Watermelon"], ["Y", "🪀", "Yo-yo"], ["Z", "🦓", "Zebra"]];
const AR = [["أ", "🐰", "أرنب"], ["ب", "🦆", "بطة"], ["ت", "🍎", "تفاحة"], ["ث", "🦊", "ثعلب"], ["ج", "🐪", "جمل"], ["ح", "🐴", "حصان"], ["خ", "🐑", "خروف"], ["د", "🐔", "دجاجة"], ["ز", "🦒", "زرافة"], ["س", "🐟", "سمكة"], ["ش", "☀️", "شمس"], ["ص", "🦅", "صقر"], ["ض", "🐸", "ضفدع"], ["ط", "🐦", "طائر"], ["ع", "🍇", "عنب"], ["ف", "🐘", "فيل"], ["ق", "🐱", "قطة"], ["ك", "🐶", "كلب"], ["ل", "🍋", "ليمون"], ["م", "🍌", "موزة"], ["ن", "🐝", "نحلة"], ["ه", "🌙", "هلال"], ["و", "🌹", "وردة"]];
const start = () => K.quiz({
  id: "letters-" + K.lang,
  gen: () => {
    const data = K.lang === "ar" ? AR : EN, it = K.pick(data), q = K.t("Which one starts with this letter?", "أي صورة تبدأ بهذا الحرف؟");
    return {
      prompt: `<div class="huge">${it[0]}${K.lang === "en" ? " " + it[0].toLowerCase() : ""}</div><div>${q}</div>`, say: it[0], sayOk: it[2], cols: 3,
      choices: K.opts(it, data, 3).map((x) => ({ html: `<span class="big">${x[1]}</span>`, ok: x === it })),
    };
  },
});
K.page("Letter Match", "🔤", start);
