# FORJA — Super prompt de construcción

You are the autonomous senior product designer, game UX designer, pixel artist, frontend engineer, offline-first architect and QA owner for FORJA.

Build the product. Do not merely describe it.

Before changing files, read completely:

1. `PRODUCT_BRIEF.md`
2. `ARCHITECTURE.md`
3. `ROUTINE.md`
4. `DEPLOYMENT.md`
5. `../reference/Manual_hipertrofia_Nahuel_y_Carlos.docx`

Use the DOCX as the source of truth for exercise technique, positioning, mistakes and alternatives.

## Mission

Create FORJA, an original mobile-first, offline-first Progressive Web App that turns a six-week hypertrophy program into a 16-bit industrial-fantasy RPG campaign.

The product must be delightful enough to feel like a real game product and fast enough to use between hard gym sets.

All user-facing copy must be natural Spanish.

Make strong decisions and continue working through implementation, visual review, tests and production build. Do not stop after planning, scaffolding, a landing page or a static mockup.

## Product priorities

In order:

1. A visually exceptional and original mobile interface.
2. A sub-five-second set logging flow.
3. Reliable local persistence.
4. Full workout use without connectivity.
5. Clear weekly adherence and safe gamification.
6. Installability and GitHub Pages compatibility.
7. Optional remote sync architecture without making it a v1 dependency.

If a decorative idea makes training slower, remove or simplify it.

## Core user outcomes

On opening the app, a user instantly understands:

- Today’s scheduled workout.
- Weekly progress.
- The next action.
- Whether data is safely stored locally.

During a workout, the user can:

- See one exercise at a time.
- See the prescription and previous performance.
- Enter weight, repetitions and RIR with one hand.
- Save a set locally before receiving success feedback.
- Start an accurate rest timer.
- Read one useful technique cue.
- Choose an alternative or record discomfort.
- Recover the workout after refresh, backgrounding or app restart.

## Visual mandate

This is not a normal fitness app with a pixel font added afterward.

Create an authored visual system based on:

- Original 16-bit handheld RPG aesthetics.
- Industrial fantasy.
- Forged steel, warm embers, gym machinery and campaign maps.
- A mature, compact and highly legible tone.

Use the palette and rules in `PRODUCT_BRIEF.md` as design tokens.

Create reusable visual primitives and original local pixel assets:

- PixelFrame.
- PixelButton.
- PixelIcon.
- AvatarSprite for Nahuel and Carlos.
- Animated FlameSprite.
- Campfire sprite.
- Anvil/flame app icon.
- Mission nodes with locked, available, complete, adapted and missed states.
- StatusChip.
- XPBar.
- PixelModal.
- Bottom navigation icons.
- Completion effects.

Use crisp integer-aligned geometry, two-pixel borders, hard shadows and small stepped corners. Use a display pixel font sparingly and a readable sans-serif for exercise data and forms. Bundle fonts and artwork locally.

Never use:

- Emoji as product icons.
- Copyrighted game characters or copied interfaces.
- Stock photography.
- Glassmorphism.
- Purple AI gradients.
- Large soft shadows.
- Generic floating cards.
- A default component-library appearance.
- Excessive rounded pills.
- Placeholder lorem ipsum.

Respect reduced motion. Keep optional sound and haptics muted or clearly controllable.

## Required screens

### Today

Build a composed launch-quality screen for 390×844 first, then verify at 360×800 and 430×932.

Include:

- Avatar, profile name and cosmetic level.
- Discreet local/sync indicator.
- Llama de la Forja with current consecutive completed weeks.
- Current chapter in the six-week campaign.
- Seven-day mission path with campfires on rest days.
- Dominant `MISIÓN DE HOY` card.
- Workout focus, duration, exercise count and working-set count.
- Primary `EMPEZAR MISIÓN` action that remains enabled offline.
- Bottom navigation: Hoy, Campaña, Progreso, Códice and Perfil.

Do not push today’s workout below the fold with vanity metrics.

### Active workout

Include:

- Compact sticky header.
- Workout and exercise progress.
- Exercise name and prescription.
- Previous performance.
- Suggested load only when evidence exists.
- Large weight and repetition controls.
- Direct numeric entry.
- RIR selector from 0 to 4+.
- `GUARDAR SERIE` as the primary action.
- Technique, machine occupied, alternative, discomfort and skip-with-reason actions.
- Visible local-save confirmation.

Destructive or skip actions must not sit next to the main save action.

### Rest state

- Countdown based on a persisted absolute timestamp.
- Pause, add 15 seconds and skip.
- Next set preview.
- One technique cue.
- Optional sound/vibration.
- Calm JRPG preparation composition.
- Accurate recovery after backgrounding.

### Mission completion

- Brief original forge/chest reveal.
- Working sets completed.
- Exercises progressed.
- Honest RIR summary.
- Hitos.
- XP gained.
- Weekly progress.
- Pending-sync state.
- Primary `VOLVER A LA FORJA` action.

Never trap the user in a long animation.

### Campaign

- Six chapters.
- Weekly targets.
- Completed, adapted, pending and missed missions.
- Weekly flame state.
- Week six as a checkpoint/evaluation, not a maximum-strength boss fight.

### Progress

- Exercise load and repetition progression.
- Weekly adherence.
- Training volume.
- RIR consistency.
- Discomfort/adaptation history.
- Personal milestones.

Charts must use crisp lines, square points, accessible labels and the project palette. Do not create a generic analytics dashboard.

### Códice

For every exercise show the structured content extracted from the manual: rationale, setup, execution, mistakes, alternatives and recent performance.

### Profile and data

- Profile switcher for the two seeded demo profiles.
- Weekly target.
- Sound, vibration and reduced-animation preferences.
- PWA install guidance.
- Export local data to JSON.
- Import a valid backup with explicit confirmation.
- Database and routine version information.

## Gamification rules

Implement a weekly streak, never a daily streak.

- Nahuel completes a chapter with five planned sessions.
- Carlos completes a chapter with three planned sessions.
- Rest days never break the flame.
- Extra workouts, extra sets or training through pain grant no bonus XP.
- Cosmetic levels never alter prescriptions.
- A safely adapted session may preserve adherence without marking skipped sets complete.
- Reward honest logging, planned completion and legitimate progression.

Do not reward low RIR, failure training or excessive volume.

## Discomfort flow

Offer a simple 0–10 input and categories:

- 0–2: tolerable.
- 3–4: modify load, range or variant.
- Above 4 or acute pain: stop the exercise.

Show the documented exercise alternative where available. Never diagnose or present the app as medical care.

## Progression suggestions

Create a conservative suggestion engine:

- All prescribed sets at the top of the range with target RIR: suggest a small increase next time.
- Within the range: keep load.
- Below the range: keep or slightly reduce.
- Significant discomfort: disable progression suggestion for that exercise.

Never modify the prescription automatically. The user confirms every adjustment. Load increments must be configurable.

## Implementation architecture

If the app has not yet been scaffolded, use the current stable versions of:

- React.
- TypeScript.
- Vite.
- React Router with HashRouter.
- Dexie and dexie-react-hooks.
- vite-plugin-pwa.
- Workbox.
- Vitest.
- Playwright when browser testing is available.

Avoid a heavy visual component library. Custom UI is a core deliverable.

Use IndexedDB as the local source of truth. Structured entities and requirements are defined in `ARCHITECTURE.md`.

Every user mutation is local-first. Never wait for a server to open a workout, save a set, complete a workout, view history or update weekly progress.

Create a remote sync adapter boundary with a fully working local-only adapter. Do not provision Supabase in this phase unless explicitly authorized.

## PWA behavior

Precache the complete application shell and every resource required for an offline workout:

- JavaScript and CSS.
- Local fonts.
- Icons and sprite sheets.
- Essential routine data.
- Offline route.
- Required sound assets, if any.

Use correct cache strategies and a non-blocking operation queue as specified in `ARCHITECTURE.md`.

The installed app must reopen offline after its first successful load.

Handle service-worker updates gracefully. Never force an update while a workout is active.

## GitHub Pages compatibility

Prepare the application for `https://gavilanbe.github.io/forja/`.

- Development base: `/`.
- Production base from `VITE_BASE_PATH=/forja/`.
- Use HashRouter.
- Ensure manifest paths, scope, start URL, icons and service worker work from the subpath.
- The existing Pages workflow is the deployment contract.

Do not create the remote repository or push without explicit authorization.

## Accessibility

- At least 44 px touch targets.
- Visible keyboard focus.
- Semantic form controls and labels.
- Strong contrast.
- Do not rely only on color.
- Readable at 200% zoom.
- `prefers-reduced-motion` support.
- Mobile numeric keyboards for numeric fields.
- Screen-reader friendly saved, timer and sync states without noisy repeated announcements.

Pixel art must never make critical workout data difficult to read.

## Required state design

Design and implement:

- First launch.
- Rest day.
- No previous performance.
- Active workout recovery.
- Offline with no pending changes.
- Offline with pending changes.
- Sync failure with local data safe.
- Update available.
- Exercise unavailable.
- Partially completed workout.
- Import failure.
- Empty progress history.
- Discomfort/adapted session.

No visible button may be dead.

## Execution process

Work in checkpoints, but continue autonomously:

1. Inspect all source documents and the repository.
2. Establish types, local schema, design tokens and routing.
3. Build the full visual component language and an internal design-system view.
4. Build and visually polish Today.
5. Build the active workout, local set logging and rest timer.
6. Add session recovery and offline database behavior.
7. Build Campaign, Progress, Códice and Profile.
8. Add PWA installation and service-worker behavior.
9. Implement progression and gamification.
10. Add unit and end-to-end tests.
11. Run the production build.
12. Inspect screenshots at 360×800, 390×844 and 430×932.
13. Correct clipping, hierarchy, spacing, contrast, generic-looking components and inconsistent pixel geometry.
14. Test the built application offline, including refresh and reopen.
15. Repeat until Definition of Done passes.

Maintain a short progress log naming the current checkpoint, verified evidence, remaining work and genuine blockers.

## Definition of Done

Do not declare completion until all are true:

1. The production build succeeds.
2. Automated tests pass.
3. After one online load, the built PWA opens and remains useful offline.
4. Today’s workout is available offline.
5. Multiple sets can be logged offline.
6. Data survives refresh, close and reopen.
7. The rest timer survives backgrounding.
8. A complete mission can be finished offline.
9. Weekly progress and XP update offline.
10. No workout action waits for authentication or sync.
11. Pending sync operations are visibly safe.
12. No principal mobile screen overflows horizontally.
13. Core controls are usable one-handed.
14. Every control has working behavior.
15. The interface is fully Spanish.
16. The routine matches `ROUTINE.md`.
17. Nahuel and Carlos follow their correct schedules.
18. Reduced-motion behavior works.
19. Manifest, icons, scope and service worker are correct for `/forja/`.
20. Mobile screenshots look like a polished original game product, not a prototype or template.
21. README explains setup, architecture, offline testing and deployment.
22. No remote repository, push or deployment has been performed without approval.

At completion, report what was built, key architecture choices, tests and offline scenarios verified, important files, remaining limitations and the exact commands to run and inspect the app locally.
