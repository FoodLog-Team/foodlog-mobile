# MVP implementation plan

Each step is its own branch from `develop` and its own pull request. The order follows the dependencies between features.

Endpoints are from `foodlog-backend` (`develop` at commit `36a9788`), relative to `EXPO_PUBLIC_API_URL` (which includes `/api`).

## Backend status

| Needed by the app                                        | Backend today                                                                                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Register, login                                          | `POST /auth/register`, `POST /auth/login` ✅                                                                                      |
| Refresh session                                          | `POST /auth/refresh` ⚠️ refresh token only via `HttpOnly` cookie (see ARCHITECTURE.md)                                            |
| Logout                                                   | `POST /auth/logout`, `POST /auth/logout-all` ✅                                                                                   |
| Create / update nutrition profile                        | `POST /nutrition-profile`, `PATCH /nutrition-profile` ✅                                                                          |
| Read nutrition profile (to know if onboarding is done)   | ❌ no `GET` endpoint                                                                                                              |
| Target recommendations, current target, custom target    | `POST /nutrition-target/recommendations`, `GET /nutrition-target`, `PUT /nutrition-target/custom` ✅                              |
| Upload meal photos for analysis                          | `POST /meals` (multipart: `photo1`, optional `photo2`, `plateSize` = SMALL/MEDIUM/LARGE) → `{ id, analysisStatus, createdAt }` ✅ |
| Read analysis result (status, detected items, nutrition) | ❌ not available: analysis is asynchronous (PENDING → PROCESSING → COMPLETED/FAILED) and there is no read endpoint                |
| Edit detected items and weights, save the meal           | ❌                                                                                                                                |
| Delete a meal                                            | ❌                                                                                                                                |
| List meals for a day, daily totals                       | ❌                                                                                                                                |

The ❌ rows block steps 5–8. Agree on their request and response formats with the backend team before starting those steps. Don't build against guessed endpoints.

## Steps

### 1. Auth: login, registration, session

Depends on the foundation (done) and a decision on the refresh-token transport.

- Install React Hook Form and Zod (`npx expo install react-hook-form zod @hookform/resolvers`).
- `features/auth`: API functions, a session context, login and register screens, and `setAccessTokenProvider` wiring.
- Route groups `(auth)` and `(app)` with `Stack.Protected`.
- Sign-out, plus handling a 401 (refresh once, then sign out).
- Shared UI components the forms need: text field, button, form error.
- Tests: API functions, form validation, protected-route redirect.

### 2. Design system pass (can run in parallel with step 1)

Depends on access to the Figma file.

- Reconcile `colors.js` with Figma and add the typography, spacing and radius scales to `tailwind.config.js`.
- Build the shared components the screens repeat, such as button, text field, card, and loading, empty and error views.

### 3. Profile onboarding

Depends on step 1, and on a `GET /nutrition-profile` endpoint (or another agreed way to know whether a profile exists).

- Form for the profile fields from `CreateUserNutritionProfileRequestDto`, plus editing via `PATCH`.
- After registration, send users without a profile to onboarding.

### 4. Nutrition goals

Depends on step 3.

- Show recommendations, choose the target mode, enter a custom target, show the current target.

### 5. Meal analysis: photo to detected items

Depends on step 1 and the analysis read endpoint.

- Pick or take photos (`expo-image-picker`, which works in Expo Go; confirm the version with `npx expo install`).
- Choose the plate size and upload as multipart.
- Poll the analysis status with TanStack Query `refetchInterval` until it is COMPLETED or FAILED, with a cancel option.
- Review screen for the detected items.

### 6. Meals: edit, save, delete

Depends on step 5 and the meal edit and delete endpoints.

- Edit detected items and weights. Nutrition values come from the backend's recalculation, never from the client.
- Save, edit and delete, invalidating the meals, dashboard and history queries.

### 7. Dashboard

Depends on steps 4 and 6, and on the daily totals endpoint.

- Today's calories and macros against the target, today's meals, loading, empty and error states.

### 8. History

Depends on step 6 and the meal list endpoint.

- Browse past days, see a day's meals, open a meal for editing.

### 9. MVP hardening

- Error and empty states reviewed on every screen.
- Accessibility pass (labels, touch targets, dynamic font size).
- Testing on a physical Android and iOS device.
- App icon and splash screen from the design.
- EAS Build configuration for internal distribution (a separate decision: it needs an Expo account).

## Recommended next task

Step 1 (auth). First, resolve the refresh-token transport with the backend team, because it decides how the session is stored. Step 2 can start at the same time if the Figma file is available.
