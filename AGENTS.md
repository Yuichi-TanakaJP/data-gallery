# Repository working agreements

## Gallery data and privileged writes

- Read `docs/ONBOARDING.md`, `supabase/README.md` and `docs/decisions/supabase-client-server-split.md` before changing data access.
- The default-branch app reads works and inserts vote_events through the vote API; the DB trigger maintains votes_count. Preserve that contract rather than updating counts independently.
- Keep privileged credentials in server-only code. Never expose SUPABASE_SERVICE_ROLE_KEY to public clients, browser bundles, logs, docs or commits. Do not read or print `.env` values.
- Do not apply `supabase/schema.sql`, seed data, vote against live data, or change DB policies merely to verify a docs/code edit. These operations can modify real data and require explicit scope and authorization.
- Verify the selected backend and actual branch before work. A separate SQLite feature checkout may contain uncommitted work; do not overwrite it or claim its features are merged.
- Use npm/package-lock.json. For relevant code changes use the existing `npm run lint` and `npm run build` scripts with non-production inputs. No test script is currently defined; report unavailable runtime/data coverage rather than inventing a passing gate.
- Work on a dedicated branch and PR against `main`. Production publication and database operations require their own approval.

## Review and local verification

- Meaning-preserving edits: final diff and relevant syntax/link/output checks. Behavior changes: one independent review. Auth/permissions/secrets/billing/migrations/production or broad impact: heightened review with specialist and rollback scrutiny.
- The agent chooses model/profile/effort and records review depth/reason in the PR. Failed invocations are not reviews and alone do not justify lowering depth; use an available method. Reassessed depth needs a reason. Re-review material changes, not typo/comment/evidence-only followups.
- Use affected repository checks; do not add dependencies or unrelated full suites just for verification. Failures, unresolved findings and missing required evidence block merge. Report untested coverage.
- Local validation is primary; optional Actions are skipped by default after checking enforced rules and repo exceptions. Existing automatic triggers remain: use [skip ci] only when permitted; do not dispatch/re-run by default. Record real run outcomes, using NOT_RUN only for no execution. Approval for merge, deletion, publication, deployment and paid operations remains required.
