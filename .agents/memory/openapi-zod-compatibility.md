---
name: OpenAPI/Zod compatibility
description: Avoid generator output that targets Zod APIs newer than the API schema package supports.
---

When `@workspace/api-zod` uses Zod 3, OpenAPI `integer` and `uuid` formats can make Orval generate Zod 4-only calls such as `zod.int()` and `zod.uuid()`. Prefer compatible `number` and plain `string` schemas unless the generator and Zod dependency are intentionally upgraded together.

**Why:** A codegen run can succeed while the generated library fails its TypeScript build, blocking all API client and server work.

**How to apply:** After editing `lib/api-spec/openapi.yaml`, run API codegen and the library typecheck before building routes or UI.
