# 研究ロードマップの設計

2026-10-23。画像は仮データによる構成検討。日付・金額・学会情報の出典ではない。

## 参照と採用理由

| 参照 | 採用する点 |
|---|---|
| [Linear](https://linear.app/changelog/2024-02-29-milestones-on-the-timeline) | 実時間に比例する期間と節目、選択した案件の詳細 |
| [Preceden](https://www.preceden.com/research) | 分野別レーン、概算日付、面談用の図 |
| [Markwhen](https://docs.markwhen.com/visualizations/timeline/) | 全期間・年・月の視点切り替え |
| [PhD Planner](https://github.com/haseenanaji/phd-planner) | 着想・執筆・投稿・査読・出版の段階 |
| [Academic Gantt](https://github.com/MaiwulanjiangMaiming/academic-gantt) | 管理画面と発表用図の区別。コードは転用しない |
| [研究者のブログ](https://mooholl.github.io/posts/2020/04/my_work_routine/) | 研究、渡航、資金の準備を逆算 |
| [The Pudding](https://pudding.cool/2020/03/census-history/) | 罫線と図形で時間を読む構成 |

GitHubの例は動作保証された製品として推奨したものではない。

## 視覚仕様

背景 #F8F7F3、本文 #242A2E、補助文字 #626765。研究 #0072B2、論文 #D55E00、学会・留学 #009E73、申請・資金 #9E5481、学位・進路 #9B7400。色は固定し、帯・節目・凡例に使う。本文と補助文字の背景に対するコントラストは約13.55:1、5.37:1。朱・青緑・黄土は本文色に使わない。

- 期間は帯、正式締切は塗った菱形、目標日は白抜き菱形、開催日は丸、実際の提出はチェック。文字ラベルも必ず付ける。
- 未確定・月だけ決定は破線と「予定」「月内」。日付未定は別一覧に置き、勝手に日付を埋めない。
- IBM Plex Sans JP / IBM Plex Sans。本文16px、補助13px以上。日付は等幅数字。
- 区切りは細い罫線と余白。角丸4px。カードの反復、グラデーション、飾りの数値、無関係なアイコンを使わない。
- 見出しは「研究ロードマップ」「次の90日」など機能名にする。余計なコピーや詩的なコピーを載せない。

参考：[Datawrapper](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides)、[IBM Plex](https://github.com/IBM/plex)、[文字コントラスト](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)、[色だけに依存しない](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)。[生成UIの画一化について](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#frontend-design)は問題の参考であり「AIらしさ」の客観的尺度ではない。

## 画像からの調整

`concept-overview.png` と `concept-90days.png` は組み込み画像生成による構成案。プロンプトは `image-prompts.txt`。画像内の文言・日付は実装仕様を上書きしない。

全期間はテーマと主要成果を優先。90日では関連する準備、申請、締切を表示する。生成案の学年境界・今日の日付・ラベル位置には誤差があるため、実装で日付計算する。全期間案の「B4から、その先へ。」は不採用。二次ナビゲーションを増やさず、表示範囲と選択案件に操作を集約する。

## 保存・共有

Sites D1に計画を保存。revisionを使って競合を検出し、変更履歴を同じトランザクションに残す。編集権は最初に本人専用Siteで初期化した所有者のSite内ユーザーIDに固定する。所有者の初期化前にSiteの公開範囲を拡大しない。

案件の共有先メールと節目ごとの共有可否で投影する。面談用はテーマ・メモ・研究レーンをサーバーで除外し、明示した共有用名称だけ返す。画面の非表示だけに依存しない。PDFはこのサーバー投影を使う横長印刷画面から出力する。

Google Calendarは会話から一方向同期。対象に選んだ日付確定済みの項目だけを同期。安定した識別マーカーとイベントIDを保存。書き込みが不明な場合はマーカー検索で確認し、確認できるまで再作成しない。通知はカレンダー既定値。実カレンダーに仮データをテスト登録しない。
