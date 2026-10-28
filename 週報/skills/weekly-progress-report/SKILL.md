---
name: weekly-progress-report
description: 週報フォルダのMarpスライドを作成・更新し、同じ日付フォルダへMarkdown・HTML・PDFを保存する。週報の新規作成と既存スライドの内容修正に使用する。
---

# 週報の出力

研究報告の構成と描画には、[Mission-Design-Labのweekly-progress-report](https://github.com/Mission-Design-Lab/mdl-ai-skills/tree/main/skills/weekly-progress-report)を使用する。保存先と共通の運用は[週報README](../../README.md)に従い、以下をこのフォルダの出力方針として適用する。

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
