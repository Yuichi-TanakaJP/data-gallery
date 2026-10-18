# 学習用SQLiteの手動バックアップ

適用範囲は新PC上の学習用作業DB。mainのSupabase版とは別で、SQLiteのアプリ復旧コードは既存ローカルcheckoutに未コミットで残っている。本PRはそのコードを取り込まない。

以前の救出原本だけでは、復旧後の投票などを戻せない。作業DBから検証付きの世代コピーを作る手動コマンドを追加する。

```powershell
python scripts/backup-local-db.py --source "$env:USERPROFILE/dev/_data/data-gallery/gallery.sqlite" --backup-root "$env:USERPROFILE/dev/_data/data-gallery/backups"
python -m unittest discover -s tests -p 'test_backup_local_db.py'
```

- 入力：既存作業DB。read-only接続からSQLite online backupでWAL内の確定データも取得する。
- 出力：同期対象外の`dev/_data/data-gallery/backups/<UTC日時>-<一意ID>/gallery.sqlite`と`receipt.json`。原本の内容は表示しない。
- 検証：integrity_check、foreign_key_check、作品/投票の件数、別接続での読み戻し、SHA-256。失敗時は非ゼロ終了し、世代ディレクトリ全体を`.partial`として残す。DBとreceiptの両方を読み戻した後だけ世代名を確定する。
- 更新：必要な作業の前後に手動実行。既存世代の上書き・自動削除・自動起動・クラウド送信はしない。コピー処理の期限は30秒（最大300秒まで指定可能）。後続の整合性検証・ハッシュ計算の時間は別。
- 復元：まず別の作業パスへコピーし、アプリ停止中に起動設定の`GALLERY_SQLITE_PATH`で切り替える。ツールは現用DBを復元・上書きしない。元の起動設定に戻せば切り戻せる。
- 保持：手動保管、削除は別途判断。同じPC内のコピーなのでPC故障対策は未解決。古い救出原本は引き続き別保持する。

構成記録とDB索引はworkspace-core側で管理する。秘密情報やSQLite本体をGitへ追加しない。
