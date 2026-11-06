# 週報

尾崎さんとの毎週の1on1 MTGに用いる進捗報告・相談資料を保存する。

報告日ごとに `YYYY-MM-DD/` を作成し、その週のフィードバックスライドを保存する。過去の報告は上書きしない。通常は前回の報告から今回までを対象とし、複数週をまとめる場合は表紙に対象期間を明記する。

```text
週報/
├── AGENTS.md
├── README.md
├── skills/
│   └── weekly-progress-report/
│       └── SKILL.md       # このフォルダの出力・確認手順
└── YYYY-MM-DD/
    ├── feedback.md       # 編集用のMarpスライド
    ├── feedback.html     # ブラウザで閲覧するスライド
    ├── feedback.pdf      # 閲覧・配布用PDF
    ├── meeting-notes.md  # 1on1の記録とロードマップへの反映状況
    ├── reading-list.md   # 読む論文、読む目的、Driveリンク
    ├── references/       # 提供された参考PDFのローカル控え
    ├── assets/           # スライドで使用する図
    ├── sources.md        # 根拠、確認範囲、未確認事項
    └── provenance.json   # 確認時刻、ブランチ、コミット、画像のハッシュ
```

個人の研究内容・予定を公開リポジトリへ含めないため、日付別フォルダはこのディレクトリの `.gitignore` で除外する。コミットするのは保存方法などの共通文書のみ。日付別フォルダの保管・バックアップはGitとは別に行う。

## 作成方法

[ローカル週報スキル](skills/weekly-progress-report/SKILL.md)に従い、[Mission-Design-Labのweekly-progress-reportスキル](https://github.com/Mission-Design-Lab/mdl-ai-skills/tree/main/skills/weekly-progress-report) のテンプレートと専用Marpエンジンを使用する。全スライドは16:9とし、複数研究では研究ごとに全体像・実施事項・結果・相談事項をまとめる。共通の4か月スケジュールとGitHub対応状況を末尾に置く。

- リモートの全ブランチを確認し、確認時点のコミットを記録する。本人の作業と他メンバーの作業を区別し、同じコミットを重複集計しない。
- 結果の条件・単位・参照先を示す。計算の終了、収束、独立再検証を区別する。
- 前回の助言や予定が確認できない場合は未確認と記す。相談案・予定案を合意済みとして扱わない。
- 図は元データの縦横比を維持する。根拠と画像の保存元を記録し、閲覧用HTML・PDFを生成して確認する。

## 研究ロードマップとの往復

[研究ロードマップ](https://edu-planning.taichi-uchida-offici.chatgpt.site/)と連携し、次の流れで運用する。具体的な接続ツールと保存手順は[ローカル週報スキル](skills/weekly-progress-report/SKILL.md)、タスクの正本と外部同期は[連携手順](../docs/integrations.md)を参照する。

1. **MTG前：** ロードマップの登録済み予定・目標・タスクと前回のフィードバックを確認し、週報の今後の予定と前回の対応状況へ反映する。
2. **MTG中・MTG後：** 得たフィードバック、合意した次の作業、未決事項を日付フォルダに記録し、ロードマップの関連する作業記録・タスク・変更案へ反映する。
3. **次回：** ロードマップと前回の記録を再取得し、合意事項に対して何を実施したかを報告する。

本人の検討メモと尾崎さんのフィードバックを区別する。既存タスクを重複作成せず、仮目標を正式締切へ変更しない。保存後の再取得で反映を確認し、Site保存とGitHubへの同期を分けて記録する。個人のMTG記録と取得した計画も日付フォルダに保存し、公開Gitへ含めない。

読む論文は日付フォルダの `reading-list.md` とスライドに載せる。Driveへの保存を依頼されたPDFは、既存の「研究参考論文」フォルダを確認し、研究ごとに1論文1PDFで保存する。書誌情報・読む目的・推薦者・確認済みのDriveリンクを残し、書誌情報が不明な推薦は未特定と記す。

## HTML・PDFの生成

スキルの `references/setup.md` に従い、取得したスキルの `tools/` で依存パッケージを復元して専用エンジンを使う。標準のMarpエクスポートだけでは独自の `schedule` ブロックを描画できない。

```sh
npm ci
npx marp "/path/to/週報/YYYY-MM-DD/feedback.md" --engine ./marp-engine.cjs --html -o "/path/to/週報/YYYY-MM-DD/feedback.html"
npx marp "/path/to/週報/YYYY-MM-DD/feedback.md" --engine ./marp-engine.cjs --html --pdf --allow-local-files -o "/path/to/週報/YYYY-MM-DD/feedback.pdf"
```

新規作成時と内容修正後は、ユーザーからPDF不要の明示がない限り、Markdown・HTML・PDFの3形式を保存する。PDFのページ数・16:9の用紙サイズと表示を確認する。HTMLを配布する場合は `assets/` も一緒に渡す。
