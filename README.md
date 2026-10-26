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
2. **Bundle id** `online.ctpmi.app` (CTPMI is the publisher). It cannot be changed
   after the first store submission.
3. **Login has no verification** (same as the website: cell number only). Add an
   OTP step before public release.
4. **Delete account** is a placeholder alert. Both stores require in-app deletion,
   so the API needs a delete endpoint.
5. **Leaderboard** returns display names only, so the signed-in member is not
   highlighted. Add `isYou` or `waId` to `/web/leaderboard`.
6. The zone pastor finder, AI chat and the admin screens are not built yet
   (spec phases 1 and 2). Push notifications, the inbox, login location and
   profile pictures are built in the app and need the endpoints below.
7. **FAQ** is static copy; serve it from the Church FAQ Answers table.

## Backend contract (notifications, inbox, location, avatar)

The app calls these on the existing Web API (`EXPO_PUBLIC_API_BASE_URL`). Every
call fails soft: until an endpoint exists the app simply shows an empty inbox,
skips the check-in, or says the photo could not be saved.

| Method + path | Body / query | Returns |
| --- | --- | --- |
| `POST web/push/register` | `{ wa_id, token, platform }` (Expo push token) | `{ success }`. Upsert by `token`. |
| `GET web/inbox?wa_id=` | | `{ messages: [{ id, title, body, sentAt, read, url? }], unread }`, newest first, bounded (e.g. last 50). |
| `POST web/inbox/read` | `{ wa_id, ids: string[] \| "all" }` | `{ success }` |
| `POST web/login-location` | `{ wa_id, latitude, longitude, city, region, country, platform, capturedAt }` | `{ success }`. Coordinates arrive rounded to about 1 km. |
| `POST web/profile/avatar` | `{ wa_id, mime: "image/jpeg", image_base64 }` (256x256, a few KB) | `{ success, avatarUrl }` |
| `GET web/profile` | existing | add `avatarUrl` |

To send an alert: write one inbox row per recipient, then POST the tokens to
`https://exp.host/--/api/v2/push/send` (batches of up to 100) with
`{ to, title, body, data: { url }, channelId: "default" }`.

Push needs credentials on the EAS project before it works: an FCM v1 service
account key for Android (and `google-services.json`), and an APNs key for iOS
(`eas credentials`). Remote push does not work in Expo Go; use a development
build or the preview APK. The new native modules need a fresh build.

Privacy: location is opt-in (explained before the system prompt), foreground
only, rounded, checked in at most every 6 hours, and switchable in Profile. Add
it to the privacy policy and the store data-safety / privacy-label answers.

## Builds

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build --profile preview --platform all
```
