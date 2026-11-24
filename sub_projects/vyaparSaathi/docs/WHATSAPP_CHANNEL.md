# The channel experience

"Like a WhatsApp channel" means the trader's whole experience is a thread of short posts they already know how to read. We deliver it two ways with one message model.

## Two surfaces, one model

| Surface | What it is | Why |
|---|---|---|
| **WhatsApp chat** (WhatsApp Business Platform, Cloud API) | A verified business number the trader messages. Posts arrive as interactive-button messages. | Where traders already live. No app to install. |
| **In-app feed** (VyaparAI `/saathi`) | The same posts as cards, with history, documents and a calendar. | For owners who already use VyaparAI, and as the fallback when WhatsApp is unavailable. |

Both render a `ChannelPost` (see [src/channel.ts](../src/channel.ts)): text, plus up to three buttons.

> **Platform note.** WhatsApp *Channels* are one-to-many broadcasts: followers cannot reply, and you cannot personalise per follower. Personal due dates and "Done" taps need two-way messaging, so the production design uses the **WhatsApp Business Platform** (a business chat) and optionally a public Channel for general news such as "GST due dates this month" and rule changes. Confirm current WhatsApp policies and pricing before building.

## Anatomy of a post

```
🟠 *File GSTR-3B and pay GST*
Due: 20 Dec 2026 (in 6 days), Nov 2026

The monthly summary return and the tax payment. Filing late costs a daily fee plus interest.

*How to do it*
1. Log in at gst.gov.in > Returns Dashboard
2. Pick the month, open GSTR-3B
3. Confirm sales, input credit and tax payable
4. Pay through challan, then file

_General guidance, not legal or tax advice. ..._
[✅ Done]  [⏰ Remind me]  [🙋 Help me]
```

Rules of thumb: under 1,400 characters, one obligation, traffic-light icon for urgency (🔴 within 3 days or overdue risk, 🟠 within a week, 🟡 within a month, 🟢 later, 📝 one-time task), steps numbered, disclaimer last.

## Conversation flows

1. **Onboarding (6 taps/replies).** Language, what you do, state, rough yearly sales band (tap a range, never type exact figures), number of staff, which registrations you already have. Result: a `BusinessProfile`.
2. **Welcome digest.** "You have 3 things to do this month and 4 one-time tasks." Top three posts follow.
3. **Reminders.** 7 days and 1 day before a due date, plus on the day if not marked Done. A trader who marks Done is not nagged again.
4. **Done.** Asks for an optional photo of the acknowledgement; stores it in the document locker.
5. **Remind me.** Snoozes 1 day, 3 days or a week (never past the due date).
6. **Help me.** Offers: a voice note explaining the step, a link to the exact portal page, or a handover to a partner CA (paid, optional, never pushed).
7. **Free text.** "Do I need GST?" is answered from the catalogue only (retrieval over the rule data, no free-form legal answers), with the disclaimer and a CA handover offer when unsure.

## Message policy and consent

- Explicit opt-in before the first message, recorded with timestamp (also satisfies DPDP consent).
- Reminders outside the 24-hour customer-service window must use pre-approved templates. Keep templates generic with variables (`{{title}}`, `{{due}}`), submitted per language.
- Honour "STOP" instantly. Never message about anything other than the trader's own obligations and service notices.
- Quiet hours 9pm to 8am local time.

## Voice and low literacy

Many users are more comfortable with voice. Plan: every post has an optional voice-note version generated from the same text in the trader's language, and the "Help me" button accepts a voice question.

## Accessibility of the in-app feed

Large tap targets, high-contrast urgency colours with icons (never colour alone), language switch always visible, works on a low-end Android over 3G.
