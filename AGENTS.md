# Repository working agreements

## Gallery data and privileged writes

- Read `docs/ONBOARDING.md`, `supabase/README.md` and `docs/decisions/supabase-client-server-split.md` before changing data access.
- The default-branch app reads works and inserts vote_events through the vote API; the DB trigger maintains votes_count. Preserve that contract rather than updating counts independently.
- Keep privileged credentials in server-only code. Never expose SUPABASE_SERVICE_ROLE_KEY to public clients, browser bundles, logs, docs or commits. Do not read or print `.env` values.
- Do not apply `supabase/schema.sql`, seed data, vote against live data, or change DB policies merely to verify a docs/code edit. These operations can modify real data and require explicit scope and authorization.
- Verify the selected backend and actual branch before work. A separate SQLite feature checkout may contain uncommitted work; do not overwrite it or claim its features are merged.
- Use npm/package-lock.json. For relevant code changes use the existing `npm run lint` and `npm run build` scripts with non-production inputs. No test script is currently defined; report unavailable runtime/data coverage rather than inventing a passing gate.
- Work on a dedicated branch and PR against `main`. Production publication and database operations require their own approval.

## Review and verification defaults

- **省略可**: 意味・動作・運用判断・契約・実行手順を変えないdocs/comment等。最終diffと関連syntax/link/outputを確認する。
- **通常**: 動作を変えるcode/UI/API/config/schedule/external I/O。独立レビューを1回行う。
- **重点**: auth/permission/secrets/billing/DB migration/production operation/広い影響。独立レビューに専門・security・rollback観点を含める。
- model/profile/reasoning effortはagentがリスクと不確実性から選ぶ。レビューの起動失敗・quota・認証・model利用不能は完了ではなく、その失敗だけを理由にdepthを下げない。利用可能な別手段で必要な結果を満たす。変更内容の再評価でdepthを変える場合は理由を記録する。
- 意味のあるレビュー後修正だけ再レビューする。typo/comment/evidenceだけなら最終diff確認とする。PRにdepthと理由・実施結果を記録する。
- ローカルのリスク相応の検証を主とし、Actionsは任意・既定スキップ。未実行やbilling停止はNOT_RUNでありPASSではない。それだけでmergeを止めないが、ローカル失敗・未解決指摘・必須証拠不足はHOLD。実際の強制branch ruleと明示のrepo例外を確認し、無断でbypassしない。
- この方針は削除・本番deploy・公開・課金・mergeの承認を代替しない。既存の固有安全・データ・UAT条件は保持する。
