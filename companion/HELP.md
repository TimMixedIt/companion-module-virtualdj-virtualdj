## VirtualDJ

Controls VirtualDJ over its official **Network Control** plugin (VirtualDJ 2023+, Pro license).

### VirtualDJ setup

1. In VirtualDJ: **Config → Extensions → Effects → Other → Network Control** → install/enable it.
2. Open its settings (cog wheel next to it in the Master effect's "Auto-Start" list) and note the **port**
   (80 by default) and, if you set one, the **password**.
3. Make sure it is running (add it to Auto-Start so it survives a VirtualDJ restart).

### Companion setup

Enter the VirtualDJ machine's host/IP, the port from step 2, and the password (if any) as the bearer
token. Set how many decks you use and how often to poll.

### Notes

- State only ever arrives by polling - the plugin has no push/event channel. See the module's
  `docs/VERB_SOURCES.md` for how polling is paced so it doesn't overload VirtualDJ.
- Some actions/feedbacks are marked **UNCONFIRMED** in their description. That means the underlying
  VDJScript verb is documented in VirtualDJ's official appendix but this module's authors could not find
  independent confirmation that it behaves as documented. They are included because the appendix is a
  credible source on its own, but test them on your own VirtualDJ build before relying on them live.
