import type { Language, Reminder } from "./types.js";
import { DISCLAIMER } from "./engine.js";
import { fmt } from "./dates.js";

/**
 * A "channel post": the unit we publish to a trader, shaped like a WhatsApp chat message.
 * Short, one idea, one tap to act. Rendered as a WhatsApp interactive-button message and as a feed card in-app.
 */
export interface ChannelPost {
  text: string;
  buttons: { id: string; label: string }[];
}

interface Labels {
  due: string;
  today: string;
  left: (n: number) => string;
  todo: string;
  steps: string;
  done: string;
  later: string;
  help: string;
}

const L: Record<Language, Labels> = {
  en: { due: "Due", today: "today", left: (n) => `in ${n} days`, todo: "To do once", steps: "How to do it", done: "Done", later: "Remind me", help: "Help me" },
  hi: { due: "अंतिम तिथि", today: "आज", left: (n) => `${n} दिन में`, todo: "एक बार करना है", steps: "कैसे करें", done: "हो गया", later: "फिर याद दिलाएँ", help: "मदद चाहिए" },
  kn: { due: "ಕೊನೆಯ ದಿನಾಂಕ", today: "ಇಂದು", left: (n) => `${n} ದಿನಗಳಲ್ಲಿ`, todo: "ಒಮ್ಮೆ ಮಾಡಬೇಕು", steps: "ಹೇಗೆ ಮಾಡುವುದು", done: "ಮುಗಿಯಿತು", later: "ನೆನಪಿಸಿ", help: "ಸಹಾಯ ಬೇಕು" },
};

const ICON: Record<Reminder["urgency"], string> = { "overdue-risk": "🔴", "this-week": "🟠", "this-month": "🟡", later: "🟢", todo: "📝" };

export function composePost(r: Reminder, lang: Language): ChannelPost {
  const t = L[lang];
  const when =
    r.due === null
      ? t.todo
      : `${t.due}: ${fmt(r.due)} (${r.daysLeft === 0 ? t.today : t.left(r.daysLeft ?? 0)})${r.period ? `, ${r.period}` : ""}`;
  const steps = r.obligation.steps[lang].map((s, i) => `${i + 1}. ${s}`).join("\n");
  const text = [`${ICON[r.urgency]} *${r.title}*`, when, "", r.obligation.why[lang], "", `*${t.steps}*`, steps, "", `_${DISCLAIMER}_`].join("\n");
  return {
    text,
    buttons: [
      { id: `done:${r.obligationId}`, label: `✅ ${t.done}` },
      { id: `snooze:${r.obligationId}`, label: `⏰ ${t.later}` },
      { id: `help:${r.obligationId}`, label: `🙋 ${t.help}` },
    ],
  };
}
