---
name: PAROS codegen workflow
description: How to run orval codegen and what to do after OpenAPI spec changes
---

## Codegen Command
`pnpm --filter @workspace/api-spec run codegen`

Writes to lib/api-client-react/src/generated/ and lib/api-zod/src/generated/, then runs typecheck:libs automatically.

**Why:** Any OpenAPI spec change requires re-running codegen. If Vite throws "Failed to load url /@fs/.../lib/api-client-react/src/generated/api.ts", the generated files were cleared — run codegen again to restore them.

## Known Issue: Zod Date Coercion in Query Params
Generated ListXxxQueryParams schemas use `zod.date()` for date query string params, so URL query strings (plain strings) fail safeParse silently. Workaround: always convert to String before passing to Drizzle gte/lte: `String(q.dateFrom)`.
