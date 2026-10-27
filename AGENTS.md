# Repository working agreements

## Gallery data and privileged writes

- Read `docs/ONBOARDING.md`, `supabase/README.md` and `docs/decisions/supabase-client-server-split.md` before changing data access.
- The default-branch app reads works and inserts vote_events through the vote API; the DB trigger maintains votes_count. Preserve that contract rather than updating counts independently.
- Keep privileged credentials in server-only code. Never expose SUPABASE_SERVICE_ROLE_KEY to public clients, browser bundles, logs, docs or commits. Do not read or print `.env` values.
- Do not apply `supabase/schema.sql`, seed data, vote against live data, or change DB policies merely to verify a docs/code edit. These operations can modify real data and require explicit scope and authorization.
- Verify the selected backend and actual branch before work. A separate SQLite feature checkout may contain uncommitted work; do not overwrite it or claim its features are merged.
- Use npm/package-lock.json. For relevant code changes use the existing `npm run lint` and `npm run build` scripts with non-production inputs. Use `npm test` for SQLite list/vote tests and `npm run test:init` for isolated Python initializer tests. Report untested live Supabase coverage separately.
- Work on a dedicated branch and PR against `main`. Production publication and database operations require their own approval.

## Review and local verification

- Known, isolated low-risk edits with reversible effects (not just Git-revertible): affected checks and final diff; independent review/UAT docs optional. Size/extension alone is not low risk; high-risk gates and stricter domain rules override this exemption.
- Other behavior changes: affected tests, changed-path check and one independent review. Build/integration/UAT only where affected. Record results in PR or existing UAT; update changed acceptance contracts.
- Auth/permissions/secrets/billing/migrations, external send/publish controls, live-data/processed-state writes, scheduler execution controls (including retry/exit gating), production or broad high impact: independent specialist/domain and rollback scrutiny, related full suite/build and relevant UAT. Investigate unknown impact before granting a low-risk exemption.
- Choose model/effort for risk; briefly report scope/results/untested coverage. Failed reviews do not count or waive required scope. Re-review material changes only. Required-check failures and correctness/safety/requirement findings block; optional polish does not.
- Local checks first; optional Actions default off subject to enforced rules/domain exceptions. Preserve triggers; [skip ci] only when allowed, no default dispatch/reruns. No execution = NOT_RUN, never PASS. Existing merge/deletion/deploy/publication/paid-operation approvals remain.
