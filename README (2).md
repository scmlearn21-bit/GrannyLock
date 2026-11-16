# 👵 GrannyLock

> *"Put the phone down. Now."*

**GrannyLock** is a cartoon-styled studycore Pomodoro timer built with React Native and Expo. It keeps you focused with a color-coded priority stack, automatic breaks, and an angry grandma who pops up with a spatula to glare (and yell) at you.

## Features

- **Priority stack:** rank assignments by importance. Tests are red, projects yellow, homework green, studying blue.
- **Time steppers:** adjust each task with `-5m` / `+5m`.
- **Smart breaks:** breaks of 5 to 15 minutes are added between tasks automatically.
- **Spatula Grandma:** she slides up during focus sessions with a quote, sound effects, and a scream. She disappears during breaks.
- **Sound and mute:** whoosh, whack, and a scream, with a mute button on the timer screen.
- **Haptics and notifications:** tactile taps and alerts when a step ends.
- **Tabs:** Add, Stack, and Sync keep the home screen clean.

## Tech stack

- React Native / Expo
- `expo-haptics`, `expo-notifications`, `expo-audio`
- `@expo/vector-icons`

## Run it

1. Download or clone this repo.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npx expo start
   ```
4. Scan the QR code with the Expo Go app, or paste the files into [Expo Snack](https://snack.expo.dev).

Make sure the `assets/` folder (with both `.wav` files) stays next to `App.js`.
