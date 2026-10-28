---
name: weekly-progress-report
description: 尾崎さんとの毎週の1on1用週報を作成・更新する。研究ロードマップの予定と前回の記録を参照し、MTG後のフィードバック・次の作業を反映する。Markdown・HTML・PDFを同じ日付フォルダへ保存する。
---

# 週報の出力

この週報は、尾崎さんとの毎週の1on1 MTGで、進捗・相談事項・次の作業を確認するための資料である。

研究報告の構成と描画には、[Mission-Design-Labのweekly-progress-report](https://github.com/Mission-Design-Lab/mdl-ai-skills/tree/main/skills/weekly-progress-report)を使用する。保存先と共通の運用は[週報README](../../README.md)に従い、以下をこのフォルダの出力方針として適用する。

## MTG前：予定と前回の対応を確認する

- [研究ロードマップ](https://edu-planning.taichi-uchida-offici.chatgpt.site/)を参照する。接続済みの「研究ロードマップ」の `list_projects`・`list_tasks` を読み、対象の研究・関連タスク・作業記録・取得済みの1on1予定を確認する。詳細が必要な項目は `get_project`・`get_task` で取得する。
- GitHubのリモートブランチは実装・計算の実績、ロードマップは今後の予定と記録の参照先として使う。タスクの正本・同期方向は[連携手順](../../../docs/integrations.md)に従う。
- 前回の1on1で得たフィードバック、合意した作業、その対応状況を確認する。本人の検討メモやAIの提案を、尾崎さんの発言・合意に置き換えない。未確認の発言者や開催実績は未確認のままにする。
- 4か月スケジュールにはロードマップの登録済み予定を優先する。正式締切・本人の目標・仮の日付・期間未定を区別し、目標日しかない作業に開始日を作ってバーを描かない。単日の目標は `@event` と目標である旨を使う。
- `sources.md` と `provenance.json` に、SiteのURL・確認時刻・revision・参照したproject/task ID・日付の確度を記録する。取得失敗を「予定なし」と扱わず、最後に確認できた内容と未確認範囲を示す。

## MTG中・MTG後：フィードバックを次の作業へつなぐ

- 同じ日付フォルダの `meeting-notes.md` に、開催予定と実際の開催、フィードバック、発言者、合意事項、次の作業、未決事項を記録する。提案と採用済みの作業を分ける。
- 研究ロードマップへの反映時は `get_planning_schema` と最新の `list_tasks` を取得する。既存タスクをID・目的・プロジェクトで照合し、重複するタスクや記録を作らない。
- フィードバックは関連タスクの `record_worklog` に記録する。発言者・MTG日・週報の該当ページ・根拠・合意した次の作業を保持し、実装や計算をしていない記録を完了実績にしない。
- 本人が明示した次の作業は `queue_task`、未採用の提案は `propose_changes` を使う。既存タスクの最新の全フィールドを保持して必要箇所だけを変更し、期限・見積もり・状態を推測で確定しない。会話で取りやめた案を追加しない。
- `planning_mutate` は毎回最新のrevisionで順番に行い、競合時は再取得して差分を確認する。記録IDは同じMTG・同じ内容の再実行で重複しないようにする。通信結果不明時は再取得して確認する。
- 保存後に再取得し、反映したtask/worklog/change IDと状態を `meeting-notes.md` に残す。Siteに保存済み、GitHubへの反映待ち、外部同期完了を区別する。GitHub・Trello・Calendarへ実際に同期する場合は[連携手順](../../../docs/integrations.md)を使う。
- Siteの共有範囲を変更したり、尾崎さんへメッセージを送ったりすることは、この運用の一部として自動で行わない。資料にはMTGで必要な予定・記録のみを載せ、無関係な個人情報や内部設定を混在させない。
- 次回の週報は、この記録とロードマップから前回の合意事項・対応状況を引き継ぐ。予定の参照とフィードバック反映は会話の作業として行い、定期実行は別途依頼がある場合に設定する。

## 必須の保存形式

- 新規作成時と内容修正後は、同じ日付フォルダに `feedback.md`・`feedback.html`・`feedback.pdf` を保存する。ユーザーからPDF不要の明示がない限り、追加の依頼を待たずにPDFも生成する。
- HTMLとPDFは、同じ最新のMarkdownから同じ専用Marpエンジンで生成する。原稿を修正したら両方を再生成し、古いPDFを完成版として残さない。
- 独自の `schedule` ブロックがあるため、標準のMarpエクスポートだけで代用しない。元スキルの `tools/marp-engine.cjs` を指定する。

## 生成

元スキルの `tools/` で実行する。依存パッケージが未導入の場合は先に `npm ci` を行う。入力・出力は対象の日付フォルダの絶対パスへ置き換える。

```sh
npx marp "/path/to/週報/YYYY-MM-DD/feedback.md" --engine ./marp-engine.cjs --html -o "/path/to/週報/YYYY-MM-DD/feedback.html"
npx marp "/path/to/週報/YYYY-MM-DD/feedback.md" --engine ./marp-engine.cjs --html --pdf --allow-local-files -o "/path/to/週報/YYYY-MM-DD/feedback.pdf"
```

## 確認

- PDFのページ数が原稿・HTMLと一致し、全ページが16:9であることを確認する。
- 生成したPDFを画像に変換し、図・日本語・スケジュール・ページ番号・はみ出しを確認する。新規作成時は全ページ、部分修正時は変更ページを表示確認する。
- PDFの生成・確認が失敗した場合は原因を解消して再出力する。解消できない場合は、失敗した形式と理由を明記し、PDF生成済みとは報告しない。
