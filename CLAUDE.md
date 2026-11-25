@AGENTS.md

# FoodLog Mobile

React Native (Expo) app for tracking calories and macronutrients (protein, fat, carbohydrates) with AI food recognition. It talks to the existing FoodLog backend (Spring Boot REST API, sibling repo `foodlog-backend`). A separate Next.js web app will come later.

Details: `docs/ARCHITECTURE.md` (decisions), `docs/DEVELOPMENT.md` (commands), `docs/IMPLEMENTATION-PLAN.md` (roadmap).

## Stack

Expo SDK 58 · React Native 0.88 · React 19 · TypeScript 6 (strict) · Expo Router · NativeWind 4 (Tailwind 3) · TanStack Query 5 · expo-secure-store · Jest 30 + jest-expo + React Native Testing Library · ESLint 9 (eslint-config-expo) + Prettier.

Expo SDK 58 is the baseline. Don't upgrade or downgrade it as a side effect of another task.

## Directory structure

```
src/
  app/              Routes only (Expo Router). Thin: compose feature screens, no logic.
  features/<name>/  One folder per domain: auth, profile, nutrition-goals, dashboard,
                    meal-analysis, meals, history. Created when the feature is built.
    api/            Request functions + response types for this domain's endpoints
    hooks/          TanStack Query hooks (useXQuery / useXMutation) and other hooks
    components/     UI used only by this feature
    screens/        Screen components rendered by src/app routes
  shared/           Code used by 2+ features. Must not import from features or app (ESLint-enforced).
    api/            HTTP client, ApiError, QueryClient defaults
    config/         Public env config (EXPO_PUBLIC_*)
    providers/      App-wide providers
    storage/        Secure token storage
    theme/          Design tokens (colors.js feeds tailwind.config.js)
    ui/             Reusable presentational components
```

Create a feature folder's subfolders only when they get their first file. No empty barrels.

## Coding conventions

- File names: kebab-case (`meal-card.tsx`). Components and types: PascalCase. Hooks: `useX`.
- Imports: use the `@/` alias for `src/`; relative imports only inside the same folder tree.
- Named exports, except route files (Expo Router needs default exports).
- Style with NativeWind classes and the token colors (`bg-background dark:bg-background-dark`). No hardcoded hex values in components. If a value is needed in JS, import `palette` from `@/shared/theme/colors`.
- Every color class needs its `dark:` pair. The app follows the system light/dark setting.
- All user-facing text is English.
- Touch targets are at least 44pt (`min-h-11`). Set `accessibilityRole` on headers and buttons.
- Don't add a dependency without checking it works in Expo Go on SDK 58. Install with `npx expo install`.

## API integration

- All requests go through `apiRequest` (`src/shared/api/client.ts`). Never call `fetch` directly.
- Endpoint functions live in `features/<name>/api/`. Type their requests and responses from the real backend DTOs (`foodlog-backend/src/main/java/.../dto`). Never invent endpoints or fields. If the backend lacks something, write that down and ask.
- Base URL comes from `EXPO_PUBLIC_API_URL` and includes the `/api` context path.
- Every failure is an `ApiError` (`kind`, `status`, `fieldErrors`). Show text with `getErrorMessage(error)`, and map `fieldErrors` onto form fields.
- The backend is the source of truth for nutrition data and calculations. Display what it returns; don't recompute calories or macros on the client.
- Tokens are stored only in `tokenStorage` (SecureStore). Never in AsyncStorage, logs or query keys.

## State management

- Server data (profile, goals, meals, dashboard, history) lives in TanStack Query only. Don't copy it into React state or a store.
- Query keys: arrays starting with the domain, e.g. `["meals", "list", date]`. Define them next to the hooks.
- After a mutation, invalidate the affected queries (e.g. saving a meal invalidates meals, dashboard and history).
- UI state stays local (`useState`). Shared client state (auth session) uses React context in its feature. Add Zustand only when context becomes a real problem, and document why.
- Forms: React Hook Form + Zod, to be installed with the first form (auth).

## Screens and states

Every data-driven screen handles loading, empty, error (with retry) and success states. Use the shared UI components for these, and create them in `src/shared/ui` the first time a feature needs them.

## Testing

- Jest with the `jest-expo` preset. Test files go in `__tests__/` folders named `*-test.ts(x)`, never inside `src/app/`.
- Unit-test API functions, error mapping and non-trivial hooks. Mock `fetch`, never the backend logic.
- Component tests: React Native Testing Library. Router tests: `expo-router/testing-library`.
- Before finishing any task: `npm run check` (typecheck, lint, format check, tests) must pass, and the app must start with `npx expo start`.

## MVP boundaries

In scope: email/password auth (JWT), profile and nutrition goals, daily calorie/macro dashboard, photo selection and upload, AI recognition through the backend, editing detected items and weights, saving/editing/deleting meals, meal history.

Out of scope unless asked: social login, offline mode, push notifications, barcode scanning, analytics, i18n, a monorepo or shared packages with the web app, and mock or fake API data in production code.

## Git

Branch from `develop`: `feature/…`, `fix/…`, `refactor/…`, `chore/…`. Never commit to `main` or `develop` directly, never force-push, and never merge without approval.
