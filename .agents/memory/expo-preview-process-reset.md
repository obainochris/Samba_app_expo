---
name: Expo preview process reset
description: Recovering Samba's Expo web preview when managed restarts leave duplicate port processes or stale route frames.
---

When an Expo preview restart reports that the app port is already in use, stop the managed artifact workflow first, then restart it once and refresh logs before taking another preview snapshot.

**Why:** Repeated managed restarts can leave competing Expo processes on the configured port; the preview may then show a stale route or blank frame even when the current bundle and type check are healthy.

**How to apply:** Use the managed workflow stop/restart controls rather than killing arbitrary processes, and treat the missing React Native DevTools GLib library warning as non-blocking unless the app itself fails to load.