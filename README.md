# Bitfocus Companion module: VirtualDJ

Controls and shows the live state of [VirtualDJ](https://www.virtualdj.com/) from a
Stream Deck (or any Companion-driven surface) via VirtualDJ's official
[Network Control plugin](https://virtualdj.com/wiki/NetworkControlPlugin.html)
(VirtualDJ 2023+, Pro license).

Built on the `@companion-module/base` TypeScript module template/structure
(`src/main.ts`, `src/config.ts`, `src/actions/`, `src/feedbacks/`,
`src/variables.ts`, `src/presets.ts`, `src/upgrades.ts`,
`companion/manifest.json`).

## What's covered

- **Transport & deck**: play, pause, play/pause, stop, cue, cue+play, sync,
  load selected/next/previous, unload - with Playing / Loaded / Has-Error
  feedback per deck.
- **Mixer**: crossfader, per-deck volume/gain, mute, PFL, 3-band EQ + EQ
  kill (with feedback), master/booth/headphone volume, crossfader
  assignment.
- **Loops & hot cues**: set/exit loop, in/out, double/half, loop roll, 8 hot
  cue slots per deck with set/jump/delete and a "hot cue is set" feedback,
  numbered cue jump.
- **Effects**: toggle/select/adjust deck FX slots 1-3 with an "FX active"
  feedback, Mix FX toggle/select with feedback.
- **Browser & Automix**: scroll, search, clear search, load selected track,
  automix start/stop with feedback, skip, mix now, add to playlist.
- **Sampler**: play/stop (single + all), trigger visible pad, change
  pad page/bank, per-slot "sample loaded" feedback, "any sample playing"
  feedback.
- **Master & recording**: record/broadcast toggle with feedback, broadcast
  message.
- **Variables** per deck: title, artist, BPM, remaining time, pitch, key.
  Plus global crossfader position, automix active, recording time.
- **~25 presets** for the buttons you reach for most: transport, hot cues
  1-4, an 8-beat loop, EQ kill x3, mute, PFL, FX slot 1, automix and
  recording toggles.

Every action/feedback whose VDJScript verb is documented (and could be
confirmed) to also work as a query has a matching feedback. See
`docs/VERB_SOURCES.md` for exactly which verbs are `CONFIRMED` (backed by
the official manual **and** independent evidence) vs. `UNCONFIRMED`
(official manual only - not independently verified, included anyway but
flagged both in that file and right above the verb in the source code).
Verbs that could not be confirmed to exist *at all* were left out entirely;
that list is also in `docs/VERB_SOURCES.md`.

## VirtualDJ setup

1. `Config → Extensions → Effects → Other → Network Control` → install and
   enable it.
2. Open its settings (gear icon, reachable from the Master panel's "Master
   Effect" Auto-Start list once installed) and note the **port** (80 by
   default) and, if you set one, the **password**.
3. Keep it running (add it to Auto-Start).

## Companion setup

Add a new **VirtualDJ** connection, then fill in:

| Field | Meaning |
| --- | --- |
| VirtualDJ Host / IP | Where VirtualDJ is running (`127.0.0.1` if it's the same machine as Companion) |
| Network Control Port | The port from VirtualDJ setup step 2 (default `80`) |
| Bearer Token | The password from step 2, if you set one - leave blank otherwise |
| Poll Interval (ms) | How often to refresh fast-changing state; see `docs/POLLING.md` |
| Number of Decks | 1-4 |

## Development

```sh
npm install
npm run build   # tsc -> dist/
npm run lint    # eslint (prettier + typescript-eslint), zero errors
npm test        # vitest, runs everything below against a mock server
```

## How this was verified (no real VirtualDJ install available)

The four completion criteria from the brief, and exactly how each was
checked:

1. **"Builds and lints without errors."** `npm run build` (`tsc -p
   tsconfig.build.json`) and `npm run lint` (`eslint .`, prettier +
   typescript-eslint via `@companion-module/tools`) both exit 0 with no
   output. Re-run these two commands to reproduce.

2. **"Loadable as a Companion connection, showing actions/feedbacks/
   variables/presets."** This can't be driven through the real Companion UI
   here (no display, no Companion host), so it's proven at the API boundary
   instead: `tests/module.spec.ts` instantiates the actual
   `ModuleInstance` class (the same file the manifest points Companion at)
   against a fake but *structurally real* host context (satisfies
   `@companion-module/base`'s own `isInstanceContext` runtime check - not a
   loose mock) and asserts that `setActionDefinitions`,
   `setFeedbackDefinitions`, `setVariableDefinitions` and
   `setPresetDefinitions` were called with non-empty, correctly-shaped data
   for a representative action/feedback/variable/preset from every
   category. `companion/manifest.json` was hand-checked against the
   official schema shape shown by the current `companion-module-template-ts`
   template it's based on.

3. **"Every action sends the right request; every feedback reacts correctly
   to a simulated response."** `tests/mockVdjServer.ts` reimplements just
   the HTTP surface of the real Network Control plugin (documented
   `/execute` and `/query` behaviour, including the "HTTP 200 with an
   `error:` body for an unrecognized script" quirk - see
   `docs/VERB_SOURCES.md`) plus an in-memory simulated deck/mixer/etc.
   state. `tests/module.spec.ts` and `tests/api.spec.ts` run real actions
   through it and assert the exact VDJScript string sent
   (`deck 2 play`, `deck 1 eq_kill_high`, ...), and run real feedbacks
   against manipulated cached state and assert the boolean they return.
   `tests/poller.spec.ts` additionally proves the *polling* engine's
   behaviour (request counts, tiering, self-pacing) against the same mock
   - see `docs/POLLING.md` for the measured numbers.

4. **"Connection loss, wrong token and HTTP errors land as module status,
   not a crash."** `tests/module.spec.ts` has one test per failure mode:
   wrong bearer token against a server that requires one → the mock
   returns 401 → asserted `InstanceStatus.AuthenticationFailure`;
   connecting to a port nothing listens on → asserted
   `InstanceStatus.ConnectionFailure`; the mock forced to return HTTP 503 →
   asserted `InstanceStatus.UnknownError`; and a recovery test where a
   forced failure clears and status returns to `InstanceStatus.Ok`. None of
   these throw or reject - `tests/api.spec.ts` also exercises the
   lower-level `VdjClient` directly for the same four outcomes (including a
   client-side timeout).

Run `npm test` to reproduce all of the above; `npx vitest run <file>` for
just one area.

## What still needs a real VirtualDJ + Stream Deck to verify

Everything above was checked against a protocol-accurate mock, not the real
application - the following can only be confirmed on real hardware:

- [ ] Every `UNCONFIRMED` verb in `docs/VERB_SOURCES.md` actually does what
      the official manual says on your VirtualDJ version (start with the
      ones you'll actually use live).
- [ ] The exact boolean spelling VirtualDJ returns for each queried verb
      (this module accepts `true/false`, `yes/no`, `on/off`, `1/0`
      case-insensitively - real responses were only cross-checked from
      documentation excerpts and forum/skin examples, not exhaustively
      probed against a live install for every single verb).
- [ ] End-to-end feel on a real Stream Deck: button press → LED feedback
      latency at your chosen poll interval, and whether that interval is
      fast enough for your use (e.g. play/pause LED) without straining your
      VirtualDJ machine.
- [ ] Whether your VirtualDJ build's Network Control plugin returns HTTP 401
      or some other status for a wrong bearer token (documented only as "an
      HTTP error code" - this module treats 401 *and* 403 as an auth
      failure, but hasn't been checked against a real wrong-password
      response).
- [ ] Multi-deck behavior beyond 2 decks (4-deck VirtualDJ setups), and any
      deck-numbering quirks (e.g. `deck master`) this module doesn't use.
- [ ] Sampler/FX slot numbering matches your actual sampler bank / FX rack
      layout - this module assumes slots 1-16 (sampler) and 1-3 (deck FX),
      matching the documented defaults.
- [ ] `bearerToken` is stored as a plain Companion config field (not
      Companion's separate secrets store) - reasonable for a local-network
      password but worth knowing if that matters for your setup.

## Project layout

```
src/
  main.ts                 ModuleInstance - wires everything together
  config.ts                Connection config fields
  state.ts                 Cached VirtualDJ state (written by the poller, read by feedbacks/variables)
  poller.ts                 The polling engine (see docs/POLLING.md)
  jobs.ts                    Builds the poll job list from the configured deck count
  optionHelpers.ts            Shared dropdown/number option builders
  upgrades.ts                  Companion upgrade scripts (empty for v1)
  vdj/
    client.ts                  HTTP client for the Network Control plugin
    parse.ts                     Response parsing helpers
    scripts/                      VDJScript string builders, one file per domain, each verb annotated
  actions/                          One file per domain + an index that merges them
  feedbacks/                         Same structure as actions/
  variables.ts                       Per-deck + global variable definitions
  presets.ts                          Button presets
companion/
  manifest.json                       Companion module manifest
  HELP.md                              In-app help text
docs/
  VERB_SOURCES.md                      Full VDJScript sourcing/citation trail
  POLLING.md                          Polling design + measured numbers
tests/
  mockVdjServer.ts                    Protocol-accurate mock of the Network Control plugin
  testHarness.ts                       Instantiates the real ModuleInstance against a fake host
  *.spec.ts                           Vitest test suites
```
