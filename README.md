# Ember — Ghost Study Sessions

A responsive, installable study app built with React and Vite. The Firebase web app is **Ember Study**, inside **planning-with-ai-cb2ae**. Its separate Hosting site is **ember-study-cb2ae**.

Live app: https://ember-study-cb2ae.web.app

Source repository: https://github.com/HrishikeshSriramoju/ember-study

## iPhone / iPad installation

1. Open the live HTTPS URL in Safari.
2. Tap **Share** (or **… → Share**), then **Add to Home Screen**.
3. Keep **Open as Web App** enabled if shown, then tap **Add**.

The app includes a manifest, PNG app icons, Apple touch icon, standalone display metadata, safe-area padding, touch controls, and an offline service worker. Installation help is also available inside the app. The OS controls the installation prompt; the app cannot automatically install itself. See [WebKit's web app guidance](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).

Load the app once online before using solo study offline. Home Screen storage may be separate from Safari storage. Export and restore your local backup when moving between browser contexts. Do not clear browser data without a backup.

## Included

- Subject selection, custom subjects, 25/45/60-minute sessions, optional task intention.
- Wall-clock timer, automatic five-minute check-ins, explicit distraction/resume control, optional brown-noise audio, and screen wake lock where supported.
- Local best ghost for each subject **and duration**, interpolated ghost race bars, saved per-minute scores, results, proof of work, and private distraction counts.
- XP formula, daily 300 XP cap including pact bonuses, no XP below 10 minutes, progressive levels, streak multipliers, three unlockable themes, and badges.
- Daily intention goal; a weekly rest day preserves a streak without adding an artificial studied day. After a break, the streak starts fresh.
- Weekly report with Chart.js graphs and html2canvas PNG export / native sharing where available.
- Optional focus reflection (place, distraction, sleep) and cautious environment comparisons after enough observations.
- Firebase anonymous sign-in, friend codes, best ghost sharing, friend ghost races, and weekly circle standings.
- Live rooms for up to eight people, synchronized host start, individual races, combined team scores, and a co-op target.
- Two-person commitment pacts with a daily session or 3-hour weekly goal, daily check-ins, shared streak, one cover token per member per week, and up to 15 XP when both check in. A nudge opens the device's Share menu or copies a message; it never sends automatically.
- Backup export and restore, responsive layout, reduced-motion support, labeled form inputs and focus-trapped dialogs.

## How honest focus works

Four focus points accrue per focused minute. A five-minute check-in pauses points at its due time until you answer. Switching away from the app pauses focus points; returning asks for another check-in. The timer continues. Reload recovery uses the last saved heartbeat and resumes with focus paused, so a closed app does not earn unattended points. A saved ghost must be a fully completed session of the same subject and duration.

This is a self-reported habit tool, not an attention detector or a phone blocker. Firebase clients enforce owner access and bounded fields; scores and check-ins are not independently verified by a trusted server. League points reward focused minutes, completed sessions, beating a personal ghost, and improvement over previous average focus. Circle standings refresh when friends share and when you press Refresh. They reset by the viewer's local Monday.

## Data and identity

`localStorage["ember-study-v1"]` holds personal sessions, task text, proof, reflections, XP, settings, friend list, active timer, and pact bonus receipts. No seeded or fake user progress is included.

Firestore uses the namespace `ember/v1`:

- `profiles/{uid}`: chosen name, friend code, shared ghost trajectories, weekly league totals.
- `codes/{code}`: friend code → anonymous user ID. Exact lookups only.
- `rooms/{code}/members/{uid}`: member names, team, score, finished state.
- `pacts/{code}` with `checkins` and `covers`: shared pact goal and check-in status.

Tasks, proof of work, sleep, place, and distractions never enter Firestore. Knowing a code lets an authenticated user find a profile or join an available room/pact. Room score lists and pact check-ins are readable only by participants. Anonymous identity stays in Firebase browser storage. Clearing it generates a new friend identity. Local backups restore study progress, not Firebase authentication identity. Losing local storage can also lose local pact bonus receipts; this is a personal honor-system app.

## Deployment

The app has its own Hosting target so deployments do not overwrite your existing Planning With AI site.

```sh
firebase login
npm run build
firebase deploy --only hosting:ember --project planning-with-ai-cb2ae
```

`firestore.rules` includes the project's previous expired rule verbatim, plus Ember's scoped rules. Rules are project-wide: before deploying future rules edits, retrieve and merge any rules another app has changed in the meantime. Use `firebase deploy --only firestore:rules --project planning-with-ai-cb2ae` only after that review. Anonymous Authentication was already enabled and remains enabled. No billing plan change was made.

## Validation and remaining polish

Automated engine tests cover XP caps, interruption scoring, clock recovery assumptions, ghost selection, streak rest days, local week boundaries, and levels. Browser checks exercise solo study, results, reflections, anonymous identity, friend add, ghost sharing, two-device rooms, pacts, report export, and offline loading. Narrow mobile layouts are checked for horizontal overflow. Physical iPhone testing is still needed for the OS Share sheet, Home Screen installation, wake-lock differences, and audio background behavior.

Formal invite-only 5–8-person leagues, advanced best-study-window predictions, avatar upgrades, push reminders, and automatic Sunday notifications are future enhancements. Weekly reports can be shared manually at any time. Squad races are implemented inside live rooms rather than persistent clubs.
