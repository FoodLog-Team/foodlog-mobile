# FoodLog Mobile

The mobile app for FoodLog: track calories and macronutrients with AI food recognition. It runs on iOS and Android through Expo and talks to the FoodLog backend REST API.

Current state: the project foundation (architecture, API client, tooling) and a welcome screen. MVP features are planned in [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md).

## Tech stack

- [Expo](https://expo.dev) SDK 58, React Native 0.88, React 19, TypeScript 6 (strict)
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routes in `src/app/`)
- [NativeWind](https://www.nativewind.dev) 4 (Tailwind CSS 3)
- [TanStack Query](https://tanstack.com/query) 5 for server data, expo-secure-store for tokens
- Jest + jest-expo + React Native Testing Library, ESLint + Prettier

## Quick start

Requires Node.js 22.13+ (24 LTS recommended) and the Expo Go app on your phone.

```bash
git clone https://github.com/FoodLog-Team/foodlog-mobile.git
cd foodlog-mobile
npm install
cp .env.example .env.local   # then set EXPO_PUBLIC_API_URL
npm start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). The phone and the computer must be on the same Wi-Fi network. If they aren't, use `npm run start:tunnel`.

Before opening a pull request, run:

```bash
npm run check
```

## Documentation

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): setup, environment variables, commands, running on a device
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure, API layer, state management, auth, decisions
- [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md): MVP roadmap and backend dependencies
- [CLAUDE.md](CLAUDE.md): project rules for Claude Code (also a good summary of the conventions)

## Git branching strategy

- `main`: production-ready code.
- `develop`: the main development and integration branch.
- Every task gets its own branch from `develop`, merged back through a pull request: `feature/feature-name`, `fix/bug-name`, `refactor/component-name`, `chore/task-name`.

Don't commit directly to `main` or `develop`, and don't force-push shared branches.
