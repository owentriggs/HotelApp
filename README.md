# HotelApp

Desktop app for managing bookings, guests, rooms, and a restaurant/food POS at a
small hotel. Built with Electron + React + TypeScript + SQLite.

## Why Electron 25

The app must keep running on an old Mac still on **macOS High Sierra (10.13)**.
Electron dropped support for 10.13/10.14 starting at v26, so this project is
pinned to **Electron 25.x** and should not be upgraded past it while that Mac
is still in use. See `.npmrc` (`target=25.9.8`) and `package.json`.

## Getting started

```bash
npm install
npm start            # builds everything and launches the app — self-contained, no dev server needed
```

For live-reloading development against Vite instead (rebuild renderer on save):

```bash
npm run dev           # terminal 1: starts the Vite dev server on :5173
npm run dev:electron  # terminal 2: launches Electron pointed at that dev server
```

Default login on first run: **admin** / **admin** (change the password via
Settings → Users once you're in — or make yourself a named account and
deactivate the default one).

## Project layout

- `src/main` — Electron main process (window creation, app lifecycle)
- `src/preload` — contextBridge-exposed API surface (`window.api`)
- `src/db` — SQLite schema + per-entity repositories, only ever imported from main
- `src/shared` — types and IPC channel names shared between main and renderer
- `src/renderer` — the React app (routes under `app/`, features under `features/*`)

Data lives in a single SQLite file under the OS user-data folder (see
Settings → Backup & data for the exact path, or use "Reveal in folder").

## Building installers

```bash
npm run build         # compiles renderer (vite) + main/preload/db (tsc)
npm run dist:mac      # macOS dmg/zip, x64 only (High Sierra predates Apple Silicon)
npm run dist:win      # Windows nsis installer
```

**Build each platform on that platform.** `better-sqlite3` is a native module;
cross-compiling it for a different OS from this repo isn't set up (and isn't
generally reliable). Build the mac installer on a Mac, the Windows installer
on Windows.

### Windows: "Cannot create symbolic link" during `npm run dist:win`

electron-builder downloads a `winCodeSign` helper archive that contains
symlinks (for macOS code-signing tools it ships regardless of target). On a
standard non-admin Windows account, extracting those symlinks fails with:

```
ERROR: Cannot create symbolic link : A required privilege is not held by the client.
```

Fix: turn on **Developer Mode** (Settings → Privacy & Security → For
developers → Developer Mode) or run the terminal as Administrator once, then
retry `npm run dist:win`. This is a one-time machine setting, not a project
bug.

### macOS: notarization

The mac target in `electron-builder.yml` intentionally skips notarization
(`hardenedRuntime: false`, no `afterSign` hook) since it targets High Sierra,
which predates current notarization requirements. If you also want a signed
build for newer Macs, that needs a separate signing/notarization pass with an
Apple Developer ID.

## Native module note

`better-sqlite3` is installed against Electron's ABI (see `.npmrc`:
`runtime=electron`, `target=25.9.8`). If `npm install` ever falls back to
compiling from source and fails because Visual Studio Build Tools / Xcode
Command Line Tools aren't installed, check that `.npmrc` is present and
matches the Electron version in `package.json` — the prebuilt binary path
should avoid needing a local compiler at all.
