# 週報

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

## HTML・PDFの生成

スキルの `references/setup.md` に従い、取得したスキルの `tools/` で依存パッケージを復元して専用エンジンを使う。標準のMarpエクスポートだけでは独自の `schedule` ブロックを描画できない。

```sh
npm ci
npx marp "/path/to/週報/YYYY-MM-DD/feedback.md" --engine ./marp-engine.cjs --html -o "/path/to/週報/YYYY-MM-DD/feedback.html"
npx marp "/path/to/週報/YYYY-MM-DD/feedback.md" --engine ./marp-engine.cjs --html --pdf --allow-local-files -o "/path/to/週報/YYYY-MM-DD/feedback.pdf"
```

新規作成時と内容修正後は、ユーザーからPDF不要の明示がない限り、Markdown・HTML・PDFの3形式を保存する。PDFのページ数・16:9の用紙サイズと表示を確認する。HTMLを配布する場合は `assets/` も一緒に渡す。
