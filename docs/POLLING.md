# Polling design and measurements

VirtualDJ's Network Control plugin has **no push/event channel** - confirmed
locally: a WebSocket upgrade is ignored, and `GET /events` returns 404 (see
`docs/VERB_SOURCES.md`). Every piece of state (transport, mixer, loops, hot
cues, FX, sampler, automix, recording) can only be obtained by polling
`/query`. This document explains the design used to do that without
overloading VirtualDJ, and the actual measurements behind it (from
`tests/poller.spec.ts`, run against a mock server) - not assumptions.

## The three things that keep this safe

1. **Concurrency 1, always.** The poller (`src/poller.ts`) never has more
   than one HTTP request in flight. It awaits each request before starting
   the next, with a small fixed gap (5ms default) between them. This alone
   rules out ever bursting a pile of parallel connections at a plugin that
   almost certainly is not built to handle many concurrent connections
   gracefully (it speaks HTTP/1.0 - see `docs/VERB_SOURCES.md`).

2. **Two polling tiers.** Jobs are split into:
   - **fast**: transport play/loaded state, mute, PFL, EQ kill x3, loop
     active, FX slot active x3, Mix FX active, crossfader position - state a
     performer expects to see change on a button essentially immediately.
     Polled every pass.
   - **slow**: track metadata (title/artist/BPM/key/pitch/remaining time),
     hot cue existence (x8), FX names, sampler slot loaded state (x16),
     automix/record/broadcast state - state that only changes when a track
     loads or something is (re)programmed. Polled only on every 5th pass
     (`slowTierMultiplier`, hard-coded - deliberately not another config
     field, since the module can make this call for you).

   Measured job counts (`src/jobs.ts`, via `buildPollJobs`):

   | Decks | Fast jobs/pass | Slow jobs (every 5th pass) | Total on a "heavy" pass |
   | --- | ---: | ---: | ---: |
   | 1 | 13 | 39 | 52 |
   | 2 | 25 | 57 | 82 |
   | 4 | 49 | 93 | 142 |

   Over any 5 consecutive passes, total requests = `fast x 5 + slow`, not
   `(fast + slow) x 5`. For 2 decks that's 182 requests instead of 410 - a
   56% cut in steady-state request volume, for free, with no extra config
   field. `tests/poller.spec.ts` asserts this ratio directly (it fails if a
   future change accidentally polls the slow tier every pass).

3. **Self-pacing, never `setInterval`.** The poller schedules its next pass
   with `setTimeout` only *after* the current pass (including every request
   in it) has fully finished, waiting `max(0, pollIntervalMs - lastPassDurationMs)`.
   If VirtualDJ or the network is slow, passes simply space out further -
   they can never pile up or overlap. `tests/poller.spec.ts` proves this by
   forcing an artificial per-request delay longer than the configured
   interval and asserting consecutive pass-completion timestamps are never
   closer together than the passes' own minimum possible duration.

   A transport-level failure (network error, timeout, HTTP error, wrong
   bearer token) aborts the rest of that pass immediately - there is no
   point sending the remaining ~40-140 requests to a server that just
   refused or dropped the first one. The next pass still starts after the
   normal interval, so a recovered connection is noticed within one
   interval, and `onConnectionFailure`/`onConnectionOk` each fire exactly
   once per state transition, not once per failing pass (also asserted in
   `tests/poller.spec.ts`) - so the module's connection status doesn't
   flap or spam the log while VirtualDJ is down.

## What this means at the default settings

Default config: 2 decks, 300ms poll interval.

- Steady state (4 out of every 5 passes): 25 sequential requests roughly
  every 300ms.
- Every 5th pass (~once every 1.5s): 82 sequential requests instead of 25,
  to refresh track metadata / hot cues / sampler slots / automix state.
- Every request is sequential with a 5ms floor between them, so even the
  heavy pass never opens more than one connection to VirtualDJ at a time.

If this is still too much for a given setup (e.g. many decks, or VirtualDJ
running on a machine that's also doing heavy audio processing), raise the
poll interval in the connection config - everything above scales linearly
with it, and nothing else needs to change.

## How to re-measure this yourself

`tests/poller.spec.ts` runs the real `Poller` class (the same one `main.ts`
uses) against `tests/mockVdjServer.ts`, a minimal stand-in for the Network
Control plugin's HTTP behaviour, and asserts on the actual request log
(counts, ordering, timing) rather than on the poller's own internal state.
Run it with `npm test` (or `npx vitest run tests/poller.spec.ts` for just
this file). If VirtualDJ's real plugin turns out to behave differently
under load than this mock assumes, that is exactly the kind of thing worth
re-measuring against a real installation and adjusting `slowTierMultiplier`/
`interRequestGapMs` in `src/poller.ts` for.
