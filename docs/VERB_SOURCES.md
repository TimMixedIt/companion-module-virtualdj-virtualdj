# VDJScript verb sourcing

This module only sends VDJScript verbs that appear in VirtualDJ's **official
VDJScript verbs appendix**
(`https://www.virtualdj.com/manuals/virtualdj/appendix/vdjscriptverbs.html`,
mirrored by the VDJPedia wiki). No verb was invented. Every verb the module
uses is tagged `CONFIRMED` or `UNCONFIRMED` right above its definition in
`src/vdj/scripts/*.ts`, using the rule below - this file is the detailed
citation trail behind those tags.

## Why not fetch the manual directly

This module was built in a sandboxed environment whose network egress does
not reach `virtualdj.com` (or generic scraping proxies) at all, only an
allowlist that includes GitHub. So instead of one direct fetch, the verb list
was cross-checked from several reachable, independent angles:

1. **Anthropic's web-search backend** (reaches the live VirtualDJ manual/wiki
   and forum independently of this sandbox's egress) - used at the start of
   this work to spot-check basic syntax (deck scoping, `play`/`pause`,
   `loop`, `hot_cue`, `crossfader`, `eq_high`/`mid`/`low`,
   `eq_crossfader_*`, `pfl`, `get_bpm`, `get_time`, `effect_active`) against
   the real official pages, and to confirm the Network Control plugin's
   `/execute` and `/query` endpoints, auth scheme and response format
   directly from `NetworkControlPlugin.html`.
2. **`github.com/monomadic/virtualdj-api-reference`** - a community,
   evidence-graded reference (cloned locally over the GitHub-allowlisted
   egress) that re-fetched the *live* official appendix on 2026-06-30 and
   audited its own coverage against it (991/991 official names accounted
   for, 0 missing - see its `docs/Official VDJScript Coverage Audit.md`).
   Its `docs/HTTP Control Interface.md` and `docs/Remote Protocol.md`
   additionally record **first-party local tests against a real, running
   VirtualDJ 2026 install** (build/version noted per entry) reproducing
   exact request/response pairs, which is genuinely independent empirical
   evidence rather than a second reading of the same documentation.

For sourcing purposes this module treats "the current official VirtualDJ
manual/appendix" as one source, and "an independently reproduced local test
against a running VirtualDJ instance" (or a shipped built-in skin/pad page
using the verb the same way, or a VirtualDJ staff forum post) as a
**second, different kind of source**. A verb backed by both is `CONFIRMED`.
A verb that only ever showed up in the official appendix, with no local test
or independent corroboration this module's author could find, is
`UNCONFIRMED` - it is still included (the vendor's own docs are a credible
source on their own), but flagged so you test it yourself before trusting it
live. Nothing that could not be found in the official appendix at all was
used; see "Verbs deliberately left out" below for names that looked
plausible but aren't real, official verbs.

## Confidence table

| Verb (as sent) | Kind | Confidence | Basis |
| --- | --- | --- | --- |
| `deck <n> <verb>` scoping | syntax | CONFIRMED | Official appendix ("Deck Specification") + local test: `deck 1 play`/`deck 2 load_next` sent as actions, `deck 1 play`/`deck 2 loaded` read back the expected state change over `/query`. |
| `play` | action+query | CONFIRMED | Official appendix; local test: querying `deck 1 play` flips `no`→`yes` after the action runs. |
| `pause` | action | CONFIRMED | Official appendix; local test: `deck 1 play` flips `yes`→`no` after `deck 1 pause` runs. |
| `play_pause`, `stop`, `cue`, `cue_play`, `sync` | action | UNCONFIRMED | Official appendix only. |
| `unload` | action | CONFIRMED | Official appendix; independently proven to exist via a live HTTP existence sweep (`E_NOTIMPL` = recognized, action-only). |
| `load_next`, `load_previous` | action | UNCONFIRMED (`load_next` partially) | `load_next` was exercised as part of a local test (drove `loaded` from `no`→`yes`); `load_previous` was not itself tested. Both kept UNCONFIRMED to be conservative since the local test targeted the *effect*, not the verb name directly. |
| `browser_enter` | action | CONFIRMED | Official appendix; proven to exist via the same live HTTP existence sweep as `unload`. |
| `load '<path>'` | action | CONFIRMED | Official appendix; local test: `deck 2 load "<absolute path>"` loaded the file directly. |
| `loaded` | query | CONFIRMED | Local test (see `deck <n> <verb>` scoping above). |
| `get_title`, `get_artist`, `get_bpm` | query | CONFIRMED | Official appendix; local test: all three were pushed with the correct new values within the same second a track was loaded. |
| `get_key`, `get_pitch_value` | query | UNCONFIRMED | Official appendix only. |
| `get_time` | query | CONFIRMED | Official appendix (documents it as returning milliseconds regardless of arguments) + confirmed live on a real VirtualDJ install: a user-reported raw millisecond count (e.g. `188307`) on a button using this module's `deck1_remaining` variable, which the module now formats client-side (`formatMsAsClock`/`formatVdjTimeLikeValue` in `src/vdj/parse.ts`) instead of trusting an unverified `'short'` argument to pre-format it. |
| `deck_has_error` | query | CONFIRMED | Official appendix; dedicated local pad-page fixture: stayed off in normal use, turned on after a deliberately missing file load, cleared after a later successful load. |
| `crossfader` (bare = query, with `%` = action) | action+query | CONFIRMED | Official appendix; local test: `crossfader 100%` moved it, the bare form read back the new position. |
| `volume`, `gain`, `mute`, `pfl`, `master_volume`, `booth_volume`, `headphone_volume`, `headphone_mix`, `cross_assign`, `get_level` | action/query | UNCONFIRMED | Official appendix only. Query-capability of `mute`/`pfl` specifically (used for the paired feedbacks) was **not** independently confirmed either - verify on your own VirtualDJ build. |
| `eq_high`, `eq_mid`, `eq_low` | action+query | CONFIRMED | Official appendix explicitly lists a `SkinQuery` surface; shipped built-in skins bind these to center-origin sliders and reset with `eq_* 50%`. |
| `eq_kill_high`, `eq_kill_mid`, `eq_kill_low` | action+query | CONFIRMED | Same as above, plus a shipped built-in skin literally uses `<button action="eq_kill_high" query="eq_kill_high">`. |
| `loop`, `loop_in`, `loop_out`, `loop_exit`, `reloop`, `loop_double`, `loop_half`, `loop_roll`, `get_active_loop` | action/query | UNCONFIRMED | Official appendix only. |
| `hot_cue`, `goto_cue`, `delete_cue`, `has_cue`, `cue_color`, `cue_name` | action/query | UNCONFIRMED | Official appendix only. |
| `effect_active` | action+query | CONFIRMED | Official appendix + VirtualDJ staff ("Adion", CTO) forum guidance + independent community example + a local pad-page test. |
| `effect_select` | action | CONFIRMED | Official appendix; used directly inside an independently reproduced local pad-page test pattern. |
| `effect_slider`, `effect_disable_all 'padfx'` | action | UNCONFIRMED | Official appendix only. |
| `get_effect_name` | query | CONFIRMED | Local test against a live install: matched the GUI's selected effect name exactly. |
| `effect_mixfx_activate`, `get_mixfx_active` | action+query | CONFIRMED | Local pad-page test: the query mirrored the action while switching the selected Mix FX between Filter and Echo. |
| `effect_mixfx_select` | action | CONFIRMED | Local test: both direct and indirect selected-state queries confirmed working. |
| `browser_scroll`, `clear_search`, `automix`, `automix_skip`, `get_automix`, `mix_now`, `playlist_add` | action/query | UNCONFIRMED | Official appendix only. |
| `search` | action | CONFIRMED | Official appendix + independently observed in a published third-party VirtualDJ skin using it the same way. |
| `sampler_play`, `sampler_stop`, `sampler_pad`, `sampler_bank`, `get_sampler_bank`, `sampler_used` | action/query | UNCONFIRMED | Official appendix only. |
| `sampler_pad_page` | action+query | CONFIRMED | Local pad/skin testing observed it returning the expected 8-pad window labels (e.g. `"1 to 8"`, `"9 to 16"`). |
| `sampler_loaded` | query | CONFIRMED | Official guidance + local testing explicitly validate this as the correct absolute-slot loaded/visibility check (as opposed to the paged/"auto" form). |
| `record`, `broadcast`, `get_record_time`, `broadcast_message` | action/query | UNCONFIRMED | Official appendix only. `get_record_time`'s return format (raw milliseconds like `get_time`, or already-formatted text) is not confirmed either way, so the module detects the shape at runtime (`formatVdjTimeLikeValue`) rather than assuming - see the `get_time` note above for why guessing this once already went wrong. |

## Protocol-level facts (not verbs, but load-bearing for this module)

All `CONFIRMED` via a local test against a real, running VirtualDJ 2026
install with the Network Control plugin enabled:

- `POST /execute` and `POST /query`, script as the raw `text/plain` body,
  work identically to the `GET ?script=` form documented on the wiki page.
- `/execute` replies literally `true` or `false`.
- An unrecognized `/query` script still returns **HTTP 200** with a body
  like `error:-2147467259` - the HTTP status alone never tells you whether a
  script was valid, only whether the *request* was well-formed.
- A missing `script` parameter returns HTTP 4xx.
- The server does not keep the connection alive and offers no push/event
  channel (`GET /events` → 404, a WebSocket upgrade is ignored) - state can
  only be obtained by polling `/query`, which is why this module's poller
  exists at all (see `docs/POLLING.md`).

## Verbs deliberately left out (no credible source found)

These names were considered (they look plausible, or a search engine
surfaces them) but could not be confirmed to be real, current VDJScript
verbs from any source available to this module's author, so they are **not**
used anywhere in this module:

- `browser_filter`, `browser_search` - explicitly tested against a live
  VirtualDJ install by a third party and confirmed **not to exist** on that
  build (`browser_sort` is the real verb for sorting).
- `stem_volume`, `sampler_inputgain`, `masterbpm`, `master_beat_num`,
  `get_pad_page_name`, `pad_page_insplit`, `pad_page_favorite`,
  `pad_page_split`, `is_colorfx`, `effect_beats_sliderindex` - these surface
  in VirtualDJ's *compiled binary* (a hidden, non-public taxonomy) but are
  absent from the official, public VDJScript verbs appendix. They may work,
  but using an undocumented, unofficial internal name in a public module
  risks breaking silently on a future VirtualDJ build, so none of them are
  used here.
- Anything from the "flag1-hidden"/binary-only candidate list (e.g.
  `flip_*`, `rane_*`, `phase_*`, `djc_*`, `v7_status`, `gemini_waveform_*`,
  hardware-vendor-specific helpers) - these are either hardware-specific
  (Rane/Denon/Pioneer/Numark controller integrations this module has no way
  to test) or only ever seen inside the app binary, never in the public
  appendix.

If you need any of the above, please verify it yourself against your own
VirtualDJ build first (the `/query` endpoint is a cheap way to probe: an
`error:-2147024809` or `error:-2147467263` body means the name is
recognized; `error:-2147467259` means it is not, or at least did not
evaluate in that context).

## If something here turns out to be wrong

VirtualDJ's own manual is not perfectly stable release to release; a few
verbs have changed behavior or been renamed historically. If you find a
`CONFIRMED` verb that doesn't work on your build, or an `UNCONFIRMED` one
that does (or doesn't), please open an issue - this file should track
reality, not just first impressions.
