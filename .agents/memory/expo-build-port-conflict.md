---
name: Expo build port conflict
description: The Samba static build uses Metro port 8081, which can conflict with the mockup preview workflow.
---

The Samba static deployment build must have exclusive access to Metro port 8081; stop the mockup preview workflow before running the build, then restart the preview workflow afterward.

**Why:** The Expo build script starts a non-interactive Metro process on 8081 and cannot answer the port-conflict prompt if the mockup Vite server is already there.

**How to apply:** Before `pnpm --filter @workspace/samba run build`, stop `artifacts/mockup-sandbox: Component Preview Server`; restore it after the build completes.