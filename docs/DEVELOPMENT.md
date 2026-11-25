# Development

## Requirements

- **Node.js 22.13 or newer.** Node 24 LTS is recommended; this repo is tested on 24.22.3. With nvm-windows, run these from a terminal opened as Administrator:
  ```bash
  nvm install 24.22.3
  ```
  ```bash
  nvm use 24.22.3
  ```
- **Expo Go** on your phone, in the version that supports SDK 58.
- The **FoodLog backend** running locally (see `foodlog-backend/README.md`), for any work that calls the API.

## Installation

```bash
git clone https://github.com/FoodLog-Team/foodlog-mobile.git
cd foodlog-mobile
npm install
```

npm may warn that `@parcel/watcher` has an install script that isn't approved. It's a dependency of Jest's file watcher and ships prebuilt binaries, so you can ignore the warning.

## Environment variables

```bash
cp .env.example .env.local
```

Set `EXPO_PUBLIC_API_URL` to the backend URL **including `/api`**. A phone can't reach `localhost` on your computer, so use the computer's LAN IP address, for example `http://192.168.1.20:8080/api`. The address Expo prints after `Metro: exp://` is the same IP.

- `.env.local` is git-ignored. Only `.env.example` is committed.
- `EXPO_PUBLIC_*` values are compiled into the app bundle, so never put secrets in them.
- Restart the dev server after changing env files.
- In SDK 58, Expo loads only `.env`, `.env.local`, `.env.development(.local)` and `.env.production(.local)`.

The app starts without `EXPO_PUBLIC_API_URL`. API calls then fail with a clear configuration error.

## Commands

| Command                | What it does                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `npm start`            | Start the dev server (`expo start`) and show the QR code                            |
| `npm run start:tunnel` | Start with a tunnel, for when the phone can't reach your computer                   |
| `npm run start:clear`  | Start with a cleared Metro cache, after changing Babel, Metro or Tailwind config    |
| `npm run typecheck`    | TypeScript check (`tsc --noEmit`)                                                   |
| `npm run lint`         | ESLint (`expo lint`)                                                                |
| `npm run lint:fix`     | ESLint with automatic fixes                                                         |
| `npm run format`       | Format everything with Prettier                                                     |
| `npm run format:check` | Check formatting without changing files                                             |
| `npm test`             | Run the Jest tests once                                                             |
| `npm run test:watch`   | Run Jest in watch mode                                                              |
| `npm run doctor`       | Check dependency versions and config (`expo-doctor`)                                |
| `npm run check`        | Typecheck, lint, format check and tests in one go. Run it before every pull request |

Add dependencies with `npx expo install <package>` so you get versions that match SDK 58. On Windows PowerShell, pass dev dependencies as `npx expo install <package> "--" --dev`; without the quoted `--`, the package ends up in `dependencies`.

## Running on a physical device (Expo Go)

1. Connect the phone and the computer to the same Wi-Fi network.
2. Run `npm start`.
3. Scan the QR code. On Android, use the scanner in Expo Go; on iOS, use the Camera app.
4. Saving a file reloads the changed code on the phone (Fast Refresh).

If the phone can't connect (different network, guest or office Wi-Fi, or Windows Firewall blocking Node.js), run `npm run start:tunnel`.

Expo Go includes only Expo's bundled native modules. Every dependency in this project works in Expo Go. If a future library needs custom native code, the project will need a development build (`npx expo run:android` or EAS Build) instead. Discuss that before adding the library.

## Known environment notes

- Two of five test production builds (`npx expo export`) crashed inside Hermes's bytecode compiler on Windows while the machine was on Node 22.12. Re-running worked. Development with Expo Go doesn't use that compiler.
- On Windows, `expo start` may log "An unexpected error occurred while installing the latest version of React Native DevTools … os error 5". This is usually antivirus locking the downloaded file. Expo falls back to the bundled DevTools, and the app isn't affected.
- `WARN ImageBackground is deprecated` comes from a dependency, not from this project's code.
