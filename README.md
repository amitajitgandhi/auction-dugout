# 🏏 Auction Dugout — Engineering & AI Handoff Guide

> **Purpose of this document**  
> This is the primary technical source of truth for developers and AI coding agents working on Auction Dugout. Read this file before changing application code, database interactions, auction rules, imports, exports, or deployment configuration. It describes the current repository architecture and the contracts that must remain stable.

## 1. Product overview

Auction Dugout is a browser-based cricket player auction management application. It supports an authenticated auction operator, team and player administration, live auction workflows, cloud persistence, and a read-only public spectator view.

**Repository:** `amitajitgandhi/auction-dugout`  
**Primary branch:** `master`  
**Frontend deployment:** Vercel (React single-page application)  
**Backend deployment:** Render (Node.js / Express API; current default API host is configured in frontend fallbacks)  
**Database, authentication and storage:** Supabase  
**Primary entry point:** `src/index.js` → `src/App.js`

### Product capabilities

- Authenticated tournament setup and account-scoped auction workspace.
- Player and team CSV import.
- Player photos downloaded from supported source URLs and stored in Supabase Storage.
- Configurable player categories, base prices and category roster requirements.
- Live auction: select category, queue players, sell, mark unsold, retain and re-auction.
- Team squad, purse, retained players, transfers, booster points and manual corrections.
- Player summary/master assignment, unsold player management and max-bid analysis.
- Read-only public viewer link.
- Cloud save, startup restore, periodic auto-save and audit events.
- WhatsApp message generation/sharing.
- Spin wheels, jersey colour assignment, team image ZIP export and CSV export.
- CricHeroes profile launch in a separate browser popup window (subject to browser popup rules).

## 2. Technology stack

| Area | Implementation |
|---|---|
| Frontend | React 18, Create React App / `react-scripts` |
| Styling | Tailwind utility classes, project CSS and inline styles |
| Animation | Framer Motion, React Confetti, CSS animations |
| Notifications | `react-hot-toast` plus project toast manager |
| Authentication | `@supabase/supabase-js` Auth |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage; default bucket `player-images` |
| Backend | Node.js ES modules, Express 5 |
| CSV | PapaParse in browser; `csv-parse` / `csv-parser` dependencies on backend |
| HTTP | Fetch and Axios |
| Hosting | Vercel frontend; Render backend (deployment settings are external to this repository) |

The package manifest is authoritative for exact dependency versions and scripts. Do not introduce a new dependency for a small utility without first checking whether the platform APIs or existing packages are sufficient.

## 3. Repository map

### Root
- `package.json` — dependencies and scripts. Available scripts: `npm start`, `npm run build`.
- `server.js` — Express API, Supabase service-role client, player photo upload and reset-related server routes.
- `README.md` — this engineering guide.
- `supabase/auction_viewer_data.sql` — SQL setup reference for the compact public viewer table and its policies.
- `public/` — Create React App static assets and browser entry HTML.
- `src/` — React application.
- `player-images/` — backend temporary working directory; do not treat this as the permanent photo store.

### Frontend entry and core components
- `src/index.js` — React DOM bootstrap and global styles.
- `src/App.js` — application composition, account-scoped session state, page routing, shared callbacks, reset flow and hook wiring.
- `src/supabaseClient.js` — browser Supabase client, configured with the public/anon key.
- `src/components/AuthPage.js` — sign-in / sign-up surface.
- `src/components/TournamentSetup.js` — tournament title, sponsor and ticker setup.
- `src/components/FileUpload.js` — player/team CSV import, player photo processing, upload progress and validation feedback.
- `src/components/CategoryConfig.js` — category-level player count and base price setup/validation.
- `src/components/CategorySelection.js` — category selection before a round starts.
- `src/components/AuctionInterface.js` — live auction operator interface and auction controls.
- `src/components/TeamsPage.js` — team summary, squad management and team exports.
- `src/components/MasterPlayersPage.js` — player summary/master assignment, filtering, editing and photo cropping.
- `src/components/UnsoldPlayersPage.js` — unsold/previously-unsold player list and later sale workflow.
- `src/components/MaxBidPage.js` — team-wise maximum bid analysis.
- `src/components/SpinWheelPage.js` — table and jersey spin-wheel utility modes.
- `src/components/ResetConfirmation.js` — reset confirmation and in-progress UI.
- `src/components/StandardNavigationMenu.js` — shared navigation, spin and export menu.
- `src/components/WhatsAppSettings.js` — WhatsApp preferences and test/setup controls.
- `src/components/PlayerInfo.js` — current player details, CricHeroes launch and max-bid summary popup.
- `src/components/PlayerImage.js` — player photo display, zoom and pan popup.
- `src/components/PlayerPhotoCropper.js` — crop UI for master-player photo updates.
- `src/components/MaxBidAnalysisTable.js`, `MaxBidHelpPopup.js` — max-bid presentation and explanation.
- `src/components/TeamEditPopup.js`, `BoosterPopup.js` — team purse and booster editing.
- `src/components/PlayerSpinWheel.js`, `JerseyColorAssignment.js` — team-page spin and jersey assignment utilities.

### Hooks
- `src/hooks/useAuth.js` — Supabase auth session subscription and sign-in/sign-up/sign-out.
- `src/hooks/useAuction.js` — auction UI state: active player, category, round, queues, sold/unsold progression and reset.
- `src/hooks/useAuctionBusinessLogic.js` — sale, unsold, retention, transfer and team financial business workflows; coordinates persistence and notifications.
- `src/hooks/usePersistence.js` — cloud state read/write, serialized saves, viewer snapshot publishing and audit logging.
- `src/hooks/useAutoSave.js` — periodic and page-unload save orchestration.
- `src/hooks/useStartupRestore.js` — account-specific cloud restore prompt and state rehydration.
- `src/hooks/useToastManager.js` — common toast styling/notification helpers.
- `src/hooks/useWhatsAppIntegration.js` — WhatsApp settings and auction message orchestration.

### Utilities
- `src/utils/constants.js` — shared emoji/style constants, common helpers, backup/export helpers and image fallbacks.
- `src/utils/csvUtils.js` — CSV parsing, validation, player-name normalization and URL formatting.
- `src/utils/centralizedTeamData.js` — central team/player financial calculations and mutations (purse, sales, transfers, retention, boosters and roster requirements).
- `src/utils/maxBidCalculator.js` — shared max-bid analysis calculation.
- `src/utils/teamImageExport.js` — canvas-based team image generation and ZIP creation.
- `src/utils/viewerPayload.js` — creates a compact public-safe viewer snapshot from full auction state.
- `src/utils/whatsappUtils.js` — WhatsApp message formatting, validation and sharing helpers.

> File names and component responsibilities are a navigation map, not permission to duplicate logic. Before adding a feature, inspect the current implementation and follow its existing state/data flow. Some components may have additional helpers or props not enumerated here.

## 4. Application lifecycle and navigation

The app is an SPA. `App.js` owns the top-level workflow and uses `currentPage` to select the active workspace view. The exact render conditions and props in `App.js` are authoritative.

Typical operator journey:

1. Authenticate using Supabase.
2. Enter tournament name and optional sponsor/ticker details.
3. Import player CSV and team CSV.
4. Configure category player requirements and base prices.
5. Select a category and run the auction.
6. Navigate to Team Summary, Player Summary, Unsold Players or Max Bid as needed.
7. Use exports, WhatsApp sharing, spin utilities and reset from shared navigation.

Navigation is shared through `StandardNavigationMenu.js`; page components pass callbacks and/or respond to documented custom events. When adding a menu action, verify it works from every page where the menu is rendered. A handler registered only by one page will not automatically work on other pages.

Known navigation event contract used by the current implementation:
- `auction-dugout-export` — export selection; detail is the selected export type (currently `image` or `csv`).
- `auction-dugout-spin` — spin selection; details route table/custom/team/jersey actions.
Check all event listeners and dispatch sites before changing event names or detail values.

## 5. Authentication and account isolation

The browser client is created in `src/supabaseClient.js` using:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

`useAuth` subscribes to `supabase.auth.onAuthStateChange` and checks the current session. `App.js` keys the auction session component by authenticated user ID so switching accounts remounts the workspace and clears account-specific in-memory state.

Important invariants:
- Do not bypass authentication checks for private auction data.
- Never put a Supabase service-role key in frontend code or any `REACT_APP_*` variable.
- Private auction saves must be associated with the authenticated user's UUID.
- Persistence verifies that the active Supabase session user matches the workspace user before saving/loading.
- Public viewer access is a separate, deliberately reduced data path. Do not expose the full private backup payload to unauthenticated viewers.

## 6. State model and auction rules

### Top-level state

The principal state is owned by `CricketAuctionSession` in `App.js`:
- `players` — canonical player array used by the operator workspace.
- `teams` — object keyed by team name; each team contains owner, purse, roster and roster requirements/booster-related values.
- `tournamentName`, `sponsorName`, `tickerDetails` — tournament branding and ticker.
- `isTournamentNameSet` — setup completion gate.
- `categoryConfigs` — category-level requirements and base-price configuration.
- `boosterPointsPerBooster` — tournament-wide points awarded per booster.
- `whatsappSettings` — message integration preferences.
- `currentPage` — active SPA view.

Auction execution state lives in `useAuction`, not in duplicated page-local state. It includes current player, selected category, round, queue pointer, current/sold/unsold queues, category completion and auction-start flags.

### Player status

The app uses player fields such as `sold`, `soldTo`, `soldPrice`, `category`, `skill`, `basePrice`, `photoUrl`, `bowlingStyle`, `wicketkeeper`, CricHeroes profile URL and retention metadata. Confirm the exact current mapping in `FileUpload.js`, `server.js`, `useAuctionBusinessLogic.js` and the relevant UI before changing a field.

Common status interpretation:
- Available: not sold and not currently marked Unsold.
- Sold: `sold === true` and `soldTo !== 'Unsold'`.
- Unsold: `soldTo === 'Unsold'`; `wasUnsold` may retain historical unsold state after later sale.

Do not assume that the UI status badge alone defines business eligibility. Use the shared business functions.

### Team data and financial logic

`centralizedTeamData.js` is the shared source for team/player calculations. `useAuctionBusinessLogic.js` orchestrates actions and calls these helpers. Avoid implementing separate purse arithmetic in individual pages.

The model includes:
- Initial purse / current purse.
- Player sale price and team roster.
- Number of players still required, including category constraints.
- Owner-retained players and retention source.
- Booster count and tournament-wide points per booster.
- Player transfers and price adjustments.
- Max-bid calculations constrained by remaining budget and remaining roster slots/category needs.

For any financial change, inspect the relevant helper and all consumers (Auction, Teams, Viewer and Max Bid). Preserve non-negative purse and roster requirement invariants, and avoid double-processing fast repeated clicks.

### Category and round handling

Categories are derived from imported players, rather than assumed to be a fixed list. Category configuration stores the required player count and base price. The auction hook builds a category-specific queue and tracks sold/unsold progression and rounds. Unsold players can be brought forward for subsequent rounds and are also accessible through Unsold Players.

Do not hardcode a fixed category list or assume a particular tournament's categories.

## 7. CSV import contracts

### Player CSV

The current required columns are:
- `Name`
- `Skillset`
- `Photo Link`
- `Category`

Optional columns include:
- `CricHeroes_Profile`
- `bowling_style` / `Bowling Style` / `Bowling_Style`
- `wicketkeeper` / `Wicketkeeper`

Inspect `validatePlayerCSV` and the importer mapping before changing accepted headers. The importer normalizes and validates names, rejects duplicate normalized names within the uploaded file, formats supported image/profile links, and processes player photo uploads. The backend endpoint `POST /api/upload-player` handles the server-side player/photo persistence path. Re-import behaviour for existing player records is implemented server-side; preserve the intended update semantics and existing photo handling.

Player import completion reports a summary including loaded players, successful photo uploads, dummy/fallback images, failed player saves and duplicate rows. A single success notification should be emitted for a successful upload; `App.js`'s `onPlayersLoad` callback should update application state and must not duplicate the importer's completion toast.

### Team CSV

Current documented headers:
- `Team Name`
- `Owner Name`
- `Total Points`
- `Total Players to Buy` (verify accepted aliases in `validateTeamCSV`)
- Optional owner-retained player, retention price and owner category columns.

### CSV safety

- Keep CSV parsing/validation in `csvUtils.js` and import orchestration in `FileUpload.js`.
- Keep backend persistence and photo storage in `server.js`.
- Do not silently accept malformed required data.
- Preserve support for optional metadata and blank values.
- Avoid changing column names without updating sample downloads, validation, mapping, backend payload and this guide.

## 8. Backend API and image storage

The backend entry point is `server.js`. It creates an Express app, enables CORS and JSON request bodies (currently configured for large base64 image payloads), and creates a Supabase client using the service-role key.

The backend's key responsibilities include:
- Downloading player photos from supported public Google Drive links.
- Detecting actual image MIME type from file signature/magic bytes rather than trusting the remote Content-Type header.
- Uploading images to Supabase Storage with upsert enabled.
- Returning public storage URLs for frontend player records.
- Authenticated player photo upload/update flows.
- Reset-related server operations that delete the user's tournament player rows and associated images, subject to the route's authentication and ownership checks.

Known frontend API configuration:
- `REACT_APP_API_BASE_URL` — deployed backend base URL.
- Some components have a fallback to the current Render backend host. Prefer centralising future API configuration rather than adding more independent hardcoded hosts.

When modifying endpoints, search both the route definition in `server.js` and all frontend `fetch()` call sites. Keep request and response payloads compatible. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

### Storage

- Default bucket: `player-images` (overridable in backend with `SUPABASE_BUCKET_NAME`).
- Photos are stored in Supabase Storage, not as permanent files in the repository.
- Public photo URLs are referenced by player records.
- Reset logic may remove storage objects as well as database rows; treat this as destructive and test ownership boundaries carefully.

## 9. Supabase database contract

The following schema was supplied by the project owner from the active Supabase project and should be treated as the current baseline schema. It is more authoritative than assumptions inferred from old migration scripts. If the live schema changes, update this section.

### 9.1 `public.auction_data` — private auction backup

| Column | Type | Nullability / default | Purpose |
|---|---|---|---|
| `user_id` | uuid | NOT NULL, primary key, FK → `auth.users(id)`, ON DELETE CASCADE | One private auction workspace per authenticated account |
| `user_email` | text | nullable | Email snapshot for account/admin reference |
| `tournament_name` | text | nullable | Tournament name for quick reference |
| `data` | jsonb | NOT NULL, default `{}` | Complete versioned auction-state snapshot |
| `updated_at` | timestamptz | NOT NULL, default `now()` | Last update time |

**Application contract:** `usePersistence.js` upserts this table with `onConflict: 'user_id'`. The application writes `user_id`, `user_email`, `tournament_name`, `data` and `updated_at`. The primary key is therefore essential. The `data` JSONB contains the full private auction backup and must not be exposed to public viewers.

### 9.2 `public.auction_viewer_data` — public spectator snapshot

| Column | Type | Nullability / default | Purpose |
|---|---|---|---|
| `user_id` | uuid | NOT NULL, primary key, FK → `auth.users(id)`, ON DELETE CASCADE | Associates viewer data with the auction owner |
| `data` | jsonb | NOT NULL, default `{}` | Reduced public-safe viewer payload |
| `updated_at` | timestamptz | NOT NULL, default `now()` | Last publish time |

**Application contract:** `usePersistence.js` upserts this table with `onConflict: 'user_id'`. The payload is produced by `buildViewerPayload()` in `src/utils/viewerPayload.js`. The viewer reads this table rather than `auction_data`. Public SELECT access is intentional for spectator links, but the JSONB must contain only information intended for public display. Authenticated writes should be restricted to the matching owner via RLS.

### 9.3 `public.players` — player metadata and photo records

| Column | Type | Nullability / default | Purpose |
|---|---|---|---|
| `id` | uuid | NOT NULL, default `gen_random_uuid()`, primary key | Player row identifier |
| `user_id` | uuid | NOT NULL, FK → `auth.users(id)`, ON DELETE CASCADE | Owner account |
| `name` | text | NOT NULL | Player name |
| `skill` | text | nullable | Player skillset |
| `category` | text | nullable | Auction category |
| `photo_url` | text | nullable | Public Supabase Storage photo URL |
| `cricheroes_profile` | text | nullable | External CricHeroes profile URL |
| `sold` | boolean | nullable, default `false` | Sold status |
| `sold_to` | text | nullable | Team name or status such as Unsold |
| `sold_price` | bigint | nullable, default `0` | Sale amount |
| `tournament_name` | text | nullable | Tournament association |
| `created_at` | timestamptz | nullable, default `now()` | Creation time |
| `updated_at` | timestamptz | nullable, default `now()` | Last update time |
| `bowling_style` | text | nullable | Optional bowling style |
| `wicketkeeper` | text | nullable; CHECK allows NULL, `Yes`, `No` | Optional wicketkeeper flag |

Indexes supplied:
- `players_user_id_idx` on `user_id`
- `players_category_idx` on `category`
- `players_sold_idx` on `sold`
- `players_tournament_idx` on `tournament_name`

**Application contract:** backend upload/update and reset endpoints use `user_id` and `tournament_name` to scope player records. The reset endpoint reads player photo URLs, removes associated objects from Storage, and then deletes the matching player rows. Preserve the ownership and tournament filters. The frontend CSV import supports optional bowling style and wicketkeeper metadata; blank optional values must remain NULL. The database CHECK constraint accepts only NULL, `Yes` or `No` for `wicketkeeper`.

### 9.4 `public.users` — application user metadata

| Column | Type | Nullability | Purpose |
|---|---|---|---|
| `user_id` | uuid | NOT NULL, primary key | User identifier |
| `email` | text | nullable | User email |
| `role` | text | nullable | Application role |
| `created_at` | timestamptz | nullable | Record creation time |

This table is separate from Supabase's `auth.users` authentication table. Do not confuse the two. The supplied definition does not declare a foreign key from `public.users.user_id` to `auth.users.id`; do not assume one exists without checking the live database and application code.

### 9.5 Supabase Storage — `player-images` bucket

**Project:** `ikyuyyhsefijngajznec`  
**Bucket:** `player-images`  
**Dashboard:** [Supabase Storage → Buckets](https://supabase.com/dashboard/project/ikyuyyhsefijngajznec/storage/files)

Player images are stored in this bucket. The backend reads the bucket name from `SUPABASE_BUCKET_NAME`, defaulting to `player-images`. The upload path uses Supabase Storage with `upsert: true`, and player rows store the resulting public URL in `players.photo_url`.

Important:
- The bucket name must match the backend configuration.
- The backend service-role key is used server-side for privileged storage operations; never expose it in frontend code.
- The reset endpoint derives object paths from each player's `photo_url`, removes objects in batches of up to 100, and only then proceeds with player-row deletion.
- If the bucket is private or its policies change, public photo URL behaviour must be reviewed. The current application expects browser-readable player image URLs.
- Do not delete or rename the bucket without migrating existing photo references and updating backend configuration.

### 9.6 Audit logging dependency

The current `src/hooks/usePersistence.js` still attempts best-effort inserts into `public.auction_audit_logs` for audit events. The owner-provided schema above does not include this table. Its former migration file has been removed from the repository at the owner's request.

This audit table is **not one of the four tables defined above**, but the application code still references it. If the table exists in the live Supabase project, audit logging continues. If it does not exist, audit inserts will fail and be logged in the browser console; the audit helper is designed not to block the main reset/save workflow. Before removing the code or relying on audit history, verify whether `auction_audit_logs` exists in the live database.

### 9.7 RLS and security considerations

The table definitions provided here do not show Row Level Security (RLS) enablement or policies. Do not infer security posture from the table DDL alone. Verify the live policies in Supabase before changing access patterns.

Expected security model:
- `auction_data`: authenticated owner can read/write only their own row.
- `auction_viewer_data`: public SELECT may be enabled for spectator links, but only the owner should be able to publish/update their row.
- `players`: private owner-scoped access; backend service-role operations must validate the user's access token and scope queries by `user_id`.
- `users`: restrict access to appropriate authenticated/admin roles based on actual product requirements.
- Storage `player-images`: browser-readable public URLs are currently expected; upload/delete privileges should remain server-side unless an explicit secure policy design is implemented.

### 9.8 Migration-file cleanup and provisioning warning

The SQL files under `supabase/migrations/` were removed from Git at the owner's request. Deleting a migration file from Git does **not** roll back or remove the corresponding table, column, index, policy, function or trigger from the live Supabase project. It only removes the versioned setup script from this repository.

The schema in this section documents the owner-provided baseline; it is not an executable migration. A new Supabase environment must be provisioned with the required schema, indexes, RLS policies and Storage bucket configuration through an approved SQL/setup process. The separate `supabase/auction_viewer_data.sql` file remains in the repository as a setup reference, but it should be checked against the actual schema before reuse.

## 10. Cloud persistence, auto-save and restore

### Save path

`usePersistence.js` is the single persistence boundary:
1. Verify a signed-in user exists.
2. Verify the active Supabase session matches the current workspace account.
3. Queue saves so concurrent auction actions are serialized.
4. Build a versioned snapshot with timestamp/revision.
5. Upsert the full private snapshot to `auction_data`.
6. Build and publish the compact viewer snapshot to `auction_viewer_data`.
7. Update the last-confirmed-save time only after the private cloud save succeeds.

The private auction save is the authoritative backup. If publishing the public viewer snapshot fails, the private save remains successful; log the viewer-staleness risk rather than claiming the private save failed.

### Auto-save

`useAutoSave.js` starts only when the user is authenticated, tournament setup is complete and account initialization is ready. It checks for meaningful auction progress and periodically saves (currently every two minutes). It also attempts a final save on page unload when there is meaningful progress.

The console message “Auto-save not started: waiting for authentication and tournament setup” can be an expected transient message during initial authentication/restore. It is not, by itself, a save failure. Check subsequent “Starting auto-save” and cloud confirmation/error messages.

### Startup restore

`useStartupRestore.js` checks cloud state once per authenticated account and presents a restore choice when saved player/team data exists. The restore path rehydrates players, teams, tournament branding, WhatsApp settings, category configuration and auction progress. Preserve account scoping and cancellation guards when changing this hook.

### Save safety rules

- Do not introduce localStorage as an alternative source of truth for private auction state without an explicit product decision.
- Do not overwrite a confirmed cloud snapshot after a failed save.
- Do not allow one user's state to be restored into another user's session.
- Serialize writes; avoid racing a reset against a pending save.
- Treat reset as destructive and retain its audit trail.
- Keep the public viewer payload minimal and free of private account/session data.

## 11. Public auction viewer

The viewer is a read-only spectator surface addressed by a hash route shaped like `#/viewer/USER_ID`. It does not require the spectator to sign in. It reads the compact row from `auction_viewer_data` and renders current tournament/auction/player/team summaries.

`src/utils/viewerPayload.js` is the projection boundary:
- Derives player status totals and selected-category stats.
- Includes only the current player details needed for the viewer.
- Compacts team data to the public fields needed by the UI.
- Must not copy the complete private backup object to the public table.

When changing viewer fields, update the payload builder and viewer UI together, and consider payload size and privacy. Public SELECT on this table is intentional; never add sensitive data to its JSONB payload.

## 12. Player and team business workflows

### Sale and unsold

Use `useAuctionBusinessLogic.js` and `centralizedTeamData.js` for all sale-related state transitions. Sale actions update both the canonical player list and team roster/purse. Unsold actions update status and queue progression. Later sale of an unsold player must use the dedicated business path rather than a UI-only patch.

### Retention

Owner retention is a distinct workflow and is tagged in player metadata (for example, `retentionSource`). Retention should update the team roster and purse consistently and should not be treated as a normal auction bid when determining whether bidding has begun.

### Transfer and team corrections

Transfers and manual purse/player price edits affect multiple related records. Use shared helper functions and ensure both the player record and team roster remain consistent.

### Booster points

The points-per-booster setting is tournament-wide. A team-specific booster count multiplied by the shared points-per-booster value contributes to team financial calculations. Do not reintroduce a per-team points-per-booster field.

### Max bid

`maxBidCalculator.js` is the shared calculation source used by the Max Bid page and player info summary. Keep the two presentations aligned by reusing the same calculation helper. When changing the formula, document assumptions and test edge cases: no remaining roster slots, category quota already fulfilled, zero purse, and remaining slots requiring reserved budget.

## 13. Export and sharing

### Team exports

- CSV export uses the shared team export helper in `constants.js`.
- Team image generation is canvas-based in `teamImageExport.js`; it avoids DOM screenshot dependencies.
- Export (Image) creates one PNG per team and packages the files into a ZIP.
- Export (CSV) creates a downloadable team CSV.
- Export actions are wired through the shared export custom event and must work from both Auction and Team Summary.
- Exported image header shows tournament title and sponsor name when configured; team name is shown inside the team card. Footer credit currently reads “Auction Dugout • Designed with ❤️ by Amit Gandhi”.

When adding export fields, update canvas drawing dimensions/layout and verify large team rosters, long names, missing sponsor and empty squads.

### WhatsApp

`useWhatsAppIntegration.js` owns settings and send orchestration. `whatsappUtils.js` formats auction, unsold and team-summary messages, validates phone numbers and exposes browser share/open flows. WhatsApp availability and browser/device support vary; do not promise background sending unless the current implementation and target environment support it.

### Spin wheels and jersey assignment

`SpinWheelPage.js` contains table/jersey spin wheel modes. Jersey options are stored in browser localStorage under a namespaced key; this is a small utility preference, not the private auction backup. Team page utilities include player/team spin and random jersey colour assignment.

### CricHeroes profiles

CricHeroes blocks iframe embedding via its Content Security Policy. The profile action therefore opens the external profile in a separate resizable popup window using `window.open`. The browser may open a tab instead, depending on browser settings, fullscreen state and popup policy. The user's existing browser login session is reused because navigation occurs in the same browser profile. A click gesture is required to avoid popup blocking.

## 14. Reset auction — destructive operation

Reset is a destructive, account-scoped workflow. Current implementation spans `App.js`, `ResetConfirmation.js`, `usePersistence.js` and backend reset endpoint(s).

Expected responsibilities:
- Require explicit operator confirmation.
- Prevent duplicate concurrent reset requests.
- Show an in-progress indicator while server/database/storage cleanup runs.
- Record reset audit events best-effort.
- Remove the intended user's tournament player data and associated storage objects.
- Clear in-memory player/team/category/auction/tournament state only after the reset workflow reaches its completion path.
- Surface failures; do not silently report a successful clean reset if storage/database cleanup reports errors.

The progress bar is indeterminate unless the backend exposes real progress events. Do not display a fabricated percentage. Before changing reset code, inspect the full request chain and ensure a pending auto-save cannot repopulate deleted data.

## 15. Environment variables and local development

### Frontend

| Variable | Purpose |
|---|---|
| `REACT_APP_SUPABASE_URL` | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Public anon key used by browser client |
| `REACT_APP_API_BASE_URL` | Express backend base URL |

### Backend

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only elevated Supabase key |
| `SUPABASE_BUCKET_NAME` | Storage bucket; defaults to `player-images` |
| `PORT` | Express port; defaults to 5000 |

Never commit real credentials. Never expose the service-role key to the frontend. CRA frontend variables are embedded into the client build; only public values belong in `REACT_APP_*`.

### Local setup

```bash
npm install
```

Run frontend in one terminal:

```bash
npm start
```

Run backend in another terminal:

```bash
node server.js
```

Production build:

```bash
npm run build
```

There is no dedicated test script declared in the current `package.json`. Do not claim automated tests ran unless a test command or external CI run is actually executed and verified.

## 16. Deployment model

### Frontend (Vercel)
- Deploy the React app from the repository/branch configured in Vercel.
- Configure the frontend environment variables in Vercel project settings.
- Each push to the connected production branch normally triggers a deployment.
- Verify the Vercel build and deployed smoke test; a Git commit alone is not proof of a successful deployment.

### Backend (Render)
- Deploy `server.js` as a Node service using the repository's Node runtime configuration.
- Configure backend-only Supabase secrets in Render.
- Ensure the frontend `REACT_APP_API_BASE_URL` points to the deployed backend.
- Confirm CORS and route availability after backend changes.

### Release verification checklist
1. Check GitHub commit and changed file list.
2. Check Vercel build status for frontend changes.
3. Check Render deploy status for backend changes.
4. Verify authentication and account isolation.
5. Verify player/team import and photo upload when affected.
6. Verify sale, unsold, retention and purse values when auction logic changes.
7. Verify cloud save and startup restore when persistence changes.
8. Verify viewer link and public read when viewer data changes.
9. Verify destructive reset only with a safe test account/tournament.
10. Review browser console and backend logs for errors.

## 17. Coding standards and AI-agent instructions

Any AI tool working in this repository should follow these rules:

1. **Read before editing.** Read this guide, `package.json`, `App.js`, and the exact target component/hook/utility before making changes.
2. **Trace the full flow.** Follow UI → callback/event → hook/business helper → API/Supabase and back. Do not patch only the visible component when state is owned elsewhere.
3. **Preserve shared business logic.** Do not duplicate purse, max-bid, category, sale, retention or transfer calculations in UI components.
4. **Preserve data contracts.** Treat database table/column names, JSON snapshot keys, CSV headers, API payloads, custom event names and player/team object shapes as contracts.
5. **Keep user/account boundaries.** Every private read/write/delete must be scoped to the authenticated user and verified session.
6. **Treat public data as public.** Anything written to `auction_viewer_data` may be read without authentication.
7. **Keep service secrets server-side.** Never move service-role credentials into React code.
8. **Protect destructive operations.** Reset/delete operations require confirmation, ownership validation, duplicate-request protection and clear failure handling.
9. **Do not remove database setup artefacts casually.** SQL files may create tables, columns, indexes, policies, triggers or functions used at runtime. Removing a script from Git does not remove its live database objects, but it does affect fresh environment setup.
10. **Keep import semantics stable.** Validate required columns, preserve optional metadata, handle duplicate rows and maintain photo update behaviour.
11. **Use one source of truth.** Reuse `centralizedTeamData.js`, `maxBidCalculator.js`, `viewerPayload.js` and other shared utilities where applicable.
12. **Respect async lifecycle.** Handle stale requests, cleanup timers/listeners, avoid duplicate event listeners and serialize persistence operations.
13. **Avoid speculative progress.** Show real progress only when the backend reports it; otherwise use an indeterminate indicator.
14. **Do not claim unverified results.** Distinguish code committed, build passed, deployment completed and feature tested.
15. **Update this README.** When adding/removing pages, API endpoints, database fields, environment variables, workflows or dependencies, update the relevant section in this guide.
16. **Make focused commits.** Keep changes scoped, provide a concise summary and include commit SHA(s).
17. **Never invent schema.** Verify current Supabase schema and deployed environment before changing SQL or database assumptions. This README is a repository-level handoff document, not a live schema introspection tool.

### Safe change workflow

1. Identify the feature and expected behaviour.
2. Search for all references to the relevant state key, event, API route, DB table or helper.
3. Read the caller and callee implementations.
4. Identify backward compatibility requirements (existing saved snapshots, CSV files, player records and viewer links).
5. Implement the smallest coherent change.
6. Review the diff for unintended changes and duplicate handlers/listeners.
7. Run `npm run build` or the applicable checks when possible.
8. Commit and report exactly what was and was not verified.
9. Update this guide if architecture or contracts changed.

## 18. Important current implementation notes

- The full auction backup is cloud-authoritative; public viewer state is a separate compact projection.
- `auction_data` and `auction_viewer_data` are separate persistence targets with different privacy expectations.
- Player photos are stored in Supabase Storage; database rows hold metadata/URLs.
- Bowling style and wicketkeeper metadata are optional. Blank values must remain blank/NULL.
- Player CSV duplicate-name validation normalizes whitespace/certain invisible Unicode characters before comparing names.
- Export ZIP generation is implemented without an additional ZIP dependency.
- CricHeroes cannot be embedded in an iframe; use the external popup launch.
- Team image exports display sponsor branding when supplied and the team name within the team card.
- Reset progress is indeterminate unless a future backend progress API is introduced.
- The app has several utilities that intentionally use localStorage (e.g. spin-wheel configuration); do not confuse these with private auction-state persistence.

---

**Auction Dugout** — Built for professional cricket auctions.  
**Product credit:** Designed with ❤️ by Amit Gandhi.
