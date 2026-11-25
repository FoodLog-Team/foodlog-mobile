# Architecture

This document records how FoodLog Mobile is structured and why. Update it when a decision changes.

## Goals

- Ship the MVP with as little code and as few dependencies as possible.
- Keep UI, data access and business rules apart, so features can be built and tested one at a time.
- Treat the backend as the source of truth. The app shows and edits backend data; it doesn't duplicate backend logic.
- Keep the non-UI code (API types, request functions, error handling) portable to the future Next.js web app.

## Feature-based structure

```
src/
  app/                     Expo Router routes (thin)
  features/
    auth/                  Login, registration, session, token refresh
    profile/               User nutrition profile (age, sex, weight, activity…)
    nutrition-goals/       Daily calorie and macro targets
    dashboard/             Today's totals compared to targets
    meal-analysis/         Photo selection, upload, AI recognition, reviewing detected items
    meals/                 Saving, editing and deleting meals
    history/               Past days and meals
  shared/
    api/                   HTTP client, ApiError, QueryClient
    config/                Public env config
    providers/             App-wide providers
    storage/               Secure token storage
    theme/                 Design tokens
    ui/                    Reusable presentational components
```

Feature folders are created when the feature is implemented, not in advance.

### Feature module responsibilities

| Feature           | Owns                                                                                                          | Depends on             |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `auth`            | Login/register screens, the session context (is the user signed in?), storing and refreshing tokens, sign-out | shared                 |
| `profile`         | Creating and updating the nutrition profile                                                                   | auth                   |
| `nutrition-goals` | Calculated recommendations, choosing a target mode, custom targets                                            | profile                |
| `dashboard`       | Today's calories and macros against the target                                                                | nutrition-goals, meals |
| `meal-analysis`   | Picking or taking photos, uploading them, tracking analysis status, reviewing detected items and weights      | auth                   |
| `meals`           | Saving, editing and deleting a meal and its items                                                             | meal-analysis          |
| `history`         | Listing past days and their meals                                                                             | meals                  |

Inside a feature:

```
features/meals/
  api/          meals-api.ts: request functions and response types, using apiRequest
  hooks/        use-meals.ts: TanStack Query hooks and query keys
  components/   UI only this feature uses
  screens/      Screen components that routes render
```

### Dependency rules

- `src/app` → `features` → `shared`. Never the other way around.
- `src/shared` must not import from `features` or `app`. ESLint enforces this (`no-restricted-imports` in `eslint.config.js`).
- A feature may use another feature's public hooks, e.g. the dashboard reads meals through `meals/hooks`. It must not reach into another feature's components or API internals.
- Code moves to `shared/` only when a second feature needs it.

## Routing

Expo Router with file-based routes in `src/app/`. Route files only connect a URL to a feature screen:

```tsx
// src/app/(app)/history.tsx
export { HistoryScreen as default } from "@/features/history/screens/history-screen";
```

Planned navigation structure (to be confirmed against the Figma design):

```
src/app/
  _layout.tsx             Root: providers, error boundary, session gate
  (auth)/                 Public routes: login, register
  (onboarding)/           Profile and goals setup after first sign-up
  (app)/                  Signed-in routes
    _layout.tsx           Tabs: Today (dashboard), History, Profile
    meal/new.tsx          Photo capture and analysis flow (modal stack)
    meal/[id].tsx         Meal details and editing
```

Access control uses Expo Router's protected routes (`Stack.Protected`) with the session state from `auth`, instead of redirecting inside each screen. Typed routes (`experiments.typedRoutes`) are enabled, so `href` values are type-checked.

## API layer

`src/shared/api/client.ts` wraps the platform `fetch`. I chose plain `fetch` over Axios because:

- It needs no dependency, and React Native and Next.js both provide it.
- The backend's JSON and multipart (meal photo) requests don't need anything Axios adds.
- Interceptor-like behavior (attaching the token, refreshing it) fits in one small function.

The client:

- builds URLs from `EXPO_PUBLIC_API_URL` (which includes the backend's `/api` context path);
- sends JSON bodies, or `FormData` for photo uploads;
- adds `Authorization: Bearer <token>` from a provider that the auth feature registers (`setAccessTokenProvider`);
- applies a timeout (30 seconds by default) and supports cancellation through `AbortSignal`;
- turns every failure into an `ApiError`.

Response bodies aren't validated at runtime. Feature API modules declare TypeScript types that mirror the backend DTOs. If a response turns out to be unreliable, add a Zod schema in that feature's `api/` file.

### Errors

`ApiError.kind` is one of `http`, `network`, `timeout`, `aborted` or `invalid-response`. For `http` errors, `status` holds the status code and `fieldErrors` holds the validation messages.

The parser handles the backend's actual formats, from `GlobalExceptionHandler`:

- `{ status, message, timestamp }`
- `{ status, message, errors: { field: string[] }, timestamp }` for validation errors
- Spring's default `ProblemDetail` (`title`, `detail`) for exceptions without a custom handler
- empty bodies, e.g. a 401 from the security filter

`getErrorMessage(error)` returns user-facing English text. It shows the backend message for 4xx errors, a generic message for 5xx, and fixed messages for network failures and timeouts. The root `ErrorBoundary` catches render errors.

## Authentication

What the backend does today (`JwtAuthenticationController`):

- `POST /auth/register` and `POST /auth/login` return `{ accessToken }` in the body. The access token is a JWT valid for 15 minutes.
- The refresh token (30 days, rotated on every refresh) is sent only as an `HttpOnly`, `SameSite=Strict`, `Secure` cookie named `refresh_token_cookie` on path `/api/auth`. `POST /auth/refresh` reads it from that cookie.

**Open issue: refreshing the session on mobile.** The cookie is designed for browsers. React Native's networking does keep cookies in the native cookie store, but that isn't a reliable or secure place to keep a 30-day credential:

- It isn't SecureStore.
- `Secure` cookies are dropped over plain HTTP in local development.
- Cookie persistence behaves differently on iOS and Android.

Recommended backend change: let mobile clients get the refresh token in the response body and send it back in the request body, for example selected by a client header, while keeping the cookie for the web app. The mobile app would then store both tokens in SecureStore.

Until that's decided:

- `tokenStorage` (SecureStore) holds only the access token.
- The client has a single place to add the token (`setAccessTokenProvider`).
- When a 401 arrives, the auth feature will try to refresh once and otherwise sign out. This logic belongs to the auth task.

## State management

| State                                        | Tool                             | Why                                                                                                                                       |
| -------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Server data (profile, goals, meals, history) | TanStack Query 5                 | Caching, background refetch, loading and error states, invalidation after mutations, and polling of meal analysis status are all built in |
| Auth session                                 | React context in `features/auth` | One small value read by the root layout. A store library would add nothing                                                                |
| Screen and form UI state                     | `useState` / React Hook Form     | Local to the screen                                                                                                                       |
| Tokens                                       | expo-secure-store                | Keychain on iOS, Keystore-backed storage on Android                                                                                       |

QueryClient defaults (`src/shared/api/query-client.ts`):

- Data stays fresh for 30 seconds.
- Queries retry up to twice, and only for network errors, timeouts and 5xx responses.
- Mutations never retry: saving or deleting a meal must not run twice silently.
- Queries refetch when the app returns to the foreground (`AppState` → `focusManager`).

Online detection (`onlineManager`) isn't set up because it needs `expo-network`. Add it if offline behavior becomes a requirement.

### Libraries I evaluated and didn't install

- **Axios:** not needed (see "API layer").
- **Zustand:** no client state needs it yet. The only shared client state is the session, and context handles that. Add it when several unrelated screens need the same mutable client state, such as a multi-step meal draft, and record why here.
- **React Hook Form and Zod:** chosen for forms and validation, since the MVP has several forms (auth, profile, goals, meal items). They're installed with the first form (the auth task) so no dependency sits unused. Zod schemas mirror the backend's validation rules, such as the password rules in `UserRegistrationRequestDto`, so users see errors before submitting; the backend still validates.

## Theme and design tokens

- `src/shared/theme/colors.js` is the single source for colors, taken from the web app's CSS variables. `tailwind.config.js` generates a light class and a `-dark` variant for every token (`bg-surface dark:bg-surface-dark`).
- The app follows the system color scheme (`userInterfaceStyle: "automatic"`).
- Spacing, font sizes and radii use Tailwind's defaults for now. Note that NativeWind uses 14px per rem, so `text-base` is 14 and `p-4` is 14. When the Figma design is applied, extend `tailwind.config.js` with its scale instead of hardcoding values in components.
- Shared UI components (`src/shared/ui`) are added when a second screen needs them. Right now there is `ErrorView`.

## Code sharing with the future web app

This decision is deliberately not a monorepo. Sharing between apps that don't exist yet would cost more than it saves. To keep a later extraction cheap:

- Request functions and DTO types in `features/*/api` and `shared/api` must not import React Native. They use only `fetch`, `FormData` and TypeScript, so they can move into a shared package unchanged.
- Business rules stay on the backend, so the two clients have no logic to keep in sync.
- Design tokens live in one plain JS file that a Tailwind config on the web can also read.
- Query hooks use only `@tanstack/react-query`, which works identically in Next.js.

If both apps reach the point of duplicating more than these files, extract `api` and the types into a package. Until then, copying a typed API file is acceptable.

## Testing strategy

- **Unit:** the API client, error parsing and query retry rules (`src/shared/api/__tests__`). Each feature adds tests for its API functions and non-trivial hooks.
- **Components:** React Native Testing Library for screens with logic, such as form validation and the loading, empty and error states.
- **Navigation:** `expo-router/testing-library` for protected-route behavior once auth exists.
- **Manual:** run in Expo Go on a physical device before every merge into `develop`.
