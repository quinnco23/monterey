# SCBC Baseball

Starter for the SCBC travel baseball league and tournament platform.

## Stack

- React 19 + Vite
- TypeScript
- React Router
- Tailwind CSS v4
- shadcn-style local UI components
- Supabase Auth + Postgres + RLS

## 1. Install

```powershell
npm install
```

## 2. Create `.env`

```powershell
Copy-Item .env.example .env
```

Set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Never place the Supabase service-role/secret key in a Vite environment variable.

## 3. Configure Supabase Auth

In Supabase Dashboard > Authentication > URL Configuration:

- Site URL: `http://localhost:5173`
- Redirect URL: `http://localhost:5173/dashboard`

When deployed, add your production site and callback URL too.

For development you may leave email confirmation enabled. If enabled, registration shows a confirmation message before login. If disabled, a new account receives a session immediately and is sent directly to organization onboarding.

## 4. Apply database migrations

Run the SQL files in order using the Supabase SQL editor, or use the Supabase CLI:

1. `supabase/migrations/20260826000100_phase1_foundation.sql`
2. `supabase/migrations/20260826000200_auth_and_onboarding.sql`

Migration 2 adds:

- automatic `profiles` creation when an Auth user is created
- profile backfill for existing Auth users
- `create_organization_with_owner(...)` RPC
- automatic owner membership
- onboarding completion
- organization/member RLS helpers

## 5. Run

```powershell
npm run dev
```

Open `http://localhost:5173`.

## Phase 1 smoke test

1. Create an account at `/register`.
2. Confirm email if required.
3. Sign in.
4. Open `/onboarding`.
5. Create an organization.
6. Confirm you land on `/dashboard`.
7. Confirm the organization appears under **Your organizations**.
8. In Supabase, confirm:
   - `profiles` contains the user.
   - `organizations` contains the new organization.
   - `organization_members` contains the user with `role = owner` and `status = active`.

## Current routes

- `/` public homepage
- `/register` account creation
- `/login` sign in
- `/dashboard` protected dashboard
- `/onboarding` protected organization onboarding
- `/teams` placeholder
- `/tournaments` placeholder

## Security model

The browser uses only the Supabase public/anon key. Authenticated database access is protected with Row Level Security. Organization creation is handled by a Postgres RPC so creation and owner assignment happen in one transaction.

## Next phase

- organization detail page
- team creation
- organization roles/permissions
- member invitations
- public team profiles
