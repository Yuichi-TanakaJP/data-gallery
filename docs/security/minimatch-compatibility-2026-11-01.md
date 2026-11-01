# Data Gallery minimatch互換更新（2026-11-01）

対象base 2a06bff8ed29cfcdbf100d5e11e5bc6ac38fa655。GitHub Reviewed GHSA-g3hv-75wg-m249の<11.0.1を、公式minimatch11.0.3へ更新する。元3/9はESLint/Next設定・plugins・typescript-estreeのdev経路。問題の前処理は3に存在せず、9は既定level1、現在の設定にlevel2や外部入力globは見つからないが、将来を含む不該当認定はしない。

## 互換方式

Next15の公式lint構成にはESLint9までのpeer制約と、minimatch3のcallable/default export/Windows区切りを使う親がある。ESLint10へのpeer強制やlint規則の削除を避け、ESLint/Nextルールの版・方針を維持した。親6個は検証済みの厳密版に限定してminimatch11.0.3をoverride、typescript-estreeも対象版に限定。直接ESLint/eslintrcの範囲は既存解決版へ固定し、版自体は更新しない。

監査slotを別名のlocal packageに置換する方式は採用しない。lockに公式registryのminimatch11.0.3が解決され、その上に別名@local/minimatch-legacy-bridgeが必要な旧callable/ESM default/Minimatch Windows区切りだけを仲介する。旧親21ファイルのimport文字列だけをnpm postinstallで接続する。tooling/minimatch-patches.jsonは親版と元/適用後SHA256を固定、全ファイルを検証してから書き、未知の版/ソース/パスは停止する。繰返し適用は同一hashなら無変更。npm ci --ignore-scriptsの場合はnpm run prepare:dependenciesを明示実行し、npm run test:dependenciesが適用済みを検査する。

汎用minimatch3互換ではない。旧makeReのRegExpを11のmatchで代用すると許可範囲が変わるため、makeReは明示的にthrowする。現在import/no-internal-modulesは無効、将来allow/forbid付きで有効化すると診断付きで停止する。親をmatcher APIへ移行するまで有効化できない制限を受け入れる。旧globの内部APIはbridge対象外。親版更新時はimport APIとhashを再レビューし、単に新hashへ追従させない。

## 検証

Windows Node22.23.4/npm10.9.9の標準npm ci（postinstall含む）、互換7件、lint、SQLite3件、Python初期化7件、Next build、npm audit0がPASS。Linux Node22.23.4でも標準ci/postinstall・互換7件・lint・SQLite3件・audit0を確認。変更後のtamperテストは最初の親を未適用状態、最後を未知ソースにし、途中まで書換えないことを確認する。公開ESM両入口、Windows相対/絶対globの非0列挙、実Next hooks/a11yとReact wildcard規則、非対応RegExp設定時の停止を検査。

アプリ/Next/React/DBアクセス契約は変更しない。テストとbuildは秘密.envなしの分離worktree、合成Supabase設定のみ。本番Supabase read/write・投票は実行しない。Nodeは検証済み^22.23.4（23未満）を指定し、Vercelが未検証majorを選ぶのを防ぐ。

## 反映と復旧

実装gpt-6.1-sol、別モデルのsecurity/API/インストール時処理/rollbackレビューを受け、結果はPRへ記録。マージ・Vercel本番配備はユーザー直前承認後。承認後に対象commit/配備/公開資産を確認し、更新後の検査結果を保存済み履歴と突合する。

rollbackはmanifest/lock、postinstall、bridgeとhashレシピの変更一式を戻してclean ci/build、公開物は直前正常deploymentへ。node_modulesにはpatch済みソースが残るためmanifestだけを戻して使い回さない。旧依存へ戻すと監査指摘が再発する。DB移行不要。ブラウザーの本番投票UAT/実rollbackは未実施。

根拠: https://github.com/advisories/GHSA-g3hv-75wg-m249 、公開npm各親の配布コードとmanifest（2026-11-01確認）。

## 独立レビュー後の境界強化

旧globの`..`を最適化しないdefaultを明示し、CJS/ESM実親APIで検証。準備前に全親から同一bridgeと公式11.0.3 backendのロードを照合する。共有hardlinkは全書込み前に拒否する。欠落bridge/backend、共有ファイル、dev省略、未知sourceの回帰テストを含め11件。失敗時は依存ファイルを手修正せず通常npm ciで再構築する。


追加レビューの境界修正: bridgeの3ファイルを独立したtooling/minimatch-bridge-hashes.jsonへ固定する（GitのCRLF/LF差だけ正規化）。npmのfile linkでsourceとinstallが同一でも改変を検出する。node_modules rootのsymlink/junctionとrealpath相違を全書込み前に拒否し、共有hardlink拒否と合わせて他checkoutへの副作用を防ぐ。POSIX文字クラスはv3と11で判定が違うため、限定bridgeではMINIMATCH_LEGACY_POSIX_UNSUPPORTEDで明示停止する。bridge更新はhashだけを追従せず親APIの意味を再レビューする。回帰テストは14件（実CJS/ESM親、改変bridge、共有rootを含む）。
