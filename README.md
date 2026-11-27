# FoodLog Mobile

The mobile app for FoodLog. Right now it is only the project foundation: a single welcome screen that runs on a physical phone through Expo Go.

## Tech stack

- [Expo](https://expo.dev) SDK 58 with React Native 0.88
- TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing in `app/`)
- [NativeWind](https://www.nativewind.dev) v4 (Tailwind CSS v3 for React Native)

Brand colors match the FoodLog web app and are defined in `tailwind.config.js`.

## Requirements

- Node.js **22.13 or newer** (an LTS release is recommended)
- The **Expo Go** app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)), in the version that supports SDK 58

## Installation

```bash
git clone https://github.com/FoodLog-Team/foodlog-mobile.git
cd foodlog-mobile
npm install
```

## Running the development server

```bash
npx expo start
```

The terminal shows a QR code. If the app behaves oddly after you change config files (`babel.config.js`, `metro.config.js`, `tailwind.config.js`), restart with a cleared cache:

```bash
npx expo start --clear
```

## Opening the app on your phone (Expo Go)

1. Connect the phone and the computer to the **same Wi‑Fi network**.
2. Run `npx expo start`.
3. Scan the QR code:
   - **Android:** open Expo Go and tap *Scan QR code*.
   - **iOS:** use the built-in Camera app, then tap the banner to open it in Expo Go.
4. The FoodLog welcome screen appears. Saving a file in `app/` updates the phone automatically (Fast Refresh).

### When the phone can't connect

If the phone is on another network, or the Wi‑Fi blocks device-to-device traffic (common on office and public networks), use a tunnel:

```bash
npx expo start --tunnel
```

The tunnel is slower, but it works across networks. On Windows, also check that the firewall allows Node.js on private networks.

## Project structure

```
app/
  _layout.tsx   Root layout (imports global styles, sets up the stack)
  index.tsx     Welcome screen
assets/         App icons and splash images
global.css      Tailwind entry file
tailwind.config.js, babel.config.js, metro.config.js   NativeWind setup
```

## Useful commands

```bash
npx tsc --noEmit        # typecheck
npx expo-doctor         # check dependency and config health
npx expo install <pkg>  # add a package in an SDK-compatible version
```

## Git branching strategy

- `main`: production-ready code.
- `develop`: the main development and integration branch.
- Every task gets its own branch, created from `develop` and merged back through a pull request:
  - `feature/feature-name`
  - `fix/bug-name`
  - `refactor/component-name`
  - `chore/task-name`

Don't commit directly to `main` or `develop`, and don't force-push shared branches.
