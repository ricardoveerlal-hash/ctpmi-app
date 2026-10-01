# CTPMI App

Native iOS and Android app for Conquering Through Prayer Ministries International.
It brings the WhatsApp bot (Emma) and ctpmi.online into one app: daily verse and
devotional, Bible Quiz, leaderboard and seasons, help and prayer requests, profile.

Stack: Expo SDK 57, Expo Router, React Native 0.86, TypeScript, Reanimated 4.

## Run it

```bash
npm install
cp .env.example .env      # optional, defaults to the live n8n API
npx expo start
```

Scan the QR code with Expo Go (it must support SDK 57) or press `i` / `a` for a
simulator. `npx expo start --web` gives a browser preview.

Checks: `npx tsc --noEmit` and `npx expo export --platform web` (both pass).

## What is wired today

Everything talks to the existing **CTPMI Web API** (n8n workflow
`5UluDLGwpaLa3iEt`) through `lib/api.ts`, ported 1:1 from the website repo, so
members, scores and seasons are the same as on ctpmi.online.

| Screen | Endpoints |
| --- | --- |
| Login / Register | `web/login`, `web/register` (cell number is the member key `wa_id`) |
| Today | `web/verse`, `web/quiz/today`, `web/latest` |
| Quiz | `web/quiz/today`, `web/quiz/answer` |
| Ranks | `web/leaderboard`, `web/season` |
| Help | `website-prayer-request` |
| Profile | `web/profile` |

Quiz rules follow the website player: 60 s per question, 100 points plus up to 50
time bonus, difficulty tiers, one play per day. Instant right/wrong feedback and
the 50/50 and Hint lifelines switch on automatically when `/web/quiz/today`
starts returning `correct` (and `hint`) on each question.

## Structure

```
app/            routes (welcome, login, register, (tabs): Today, Quiz, Ranks, Help, Profile)
components/     ui.tsx (design kit, starfield, logo orbit), QuizPlayer, form
lib/            api, session (SecureStore), theme (dark/light), constants, season
assets/images/  logo and placeholder icons
```

Brand tokens (navy, teal, gold; Bricolage Grotesque + Inter) live in `lib/theme.tsx`
with a dark and a light palette and a persisted toggle.

## Known gaps and next steps

1. **Icon and splash** are placeholders upscaled from the 168 px website logo.
   Replace `assets/images/*` with a 1024 px (or vector) logo before store submission.
2. **Bundle id** `online.ctpmi.app` is a placeholder; set it once the publisher
   entity is decided.
3. **Login has no verification** (same as the website: cell number only). Add an
   OTP step before public release.
4. **Delete account** is a placeholder alert. Both stores require in-app deletion,
   so the API needs a delete endpoint.
5. **Leaderboard** returns display names only, so the signed-in member is not
   highlighted. Add `isYou` or `waId` to `/web/leaderboard`.
6. **Push notifications**, the zone pastor finder, AI chat and the admin screens
   are not built yet (spec phases 1 and 2).
7. **FAQ** is static copy; serve it from the Church FAQ Answers table.

## Builds

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build --profile preview --platform all
```
