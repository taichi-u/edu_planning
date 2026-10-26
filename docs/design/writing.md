# 日英の文言・会話・文書

対象はedu_planningのUI、通知文の見本、この制作に関する会話・計画書。他の制作で利用する場合は、この文書を選んで参照する。個人全体の既定値は変更しない。

## 日本語

研究・業務の語彙を用いる。操作は対象と動作、状態は何がどこまで済んだかを示す。同じ概念の表記を揃える。専門用語を無理に言い換えない。

| 概念 | 日本語 | English | 注意 |
| --- | --- | --- | --- |
| project | プロジェクト | Project | 「案件」と混在させない |
| work log | 作業記録 | Work log | 成果とフィードバックを含められる |
| retrospective | 振り返り | Review | 過去の作業の確認。変更の採用とは分ける |
| official deadline | 正式締切 | Submission deadline | 自分の目標日と区別 |
| target | 目標日 | Target date | 正式締切へ自動変換しない |
| preparation start | 準備開始日 | Preparation starts | 締切が先でも今週の作業に含みうる |
| submitted | 提出日 | Submitted on | 予定・目標と実績を分ける |
| blocker | 進行上の課題 | Blocker | 未着手・返答待ち・中止を同じ意味にしない |
| feedback | フィードバック | Feedback | 自分の成果評価点とは分ける |
| pending update | GitHubへの反映待ち | GitHub update pending | 保存済みと外部更新済みを区別 |
| estimate | 見積もり | Estimate | ポイントは時間・重要度と換算しない |
| unestimated | 未見積もり | Not estimated | 0点と表示しない |
| cancellation | 取りやめ | Cancelled | 完了・削除と区別 |

見出しは「研究計画」「今週の作業」「作業記録」「連携状況」など内容を示す名詞。操作は「保存」「記録を追加」「今日を表示」など結果が予測できる言葉にする。

## 保存と失敗

ボタンは「保存」。操作後は保存先を表示する。

- Siteへの保存成功: `Siteに保存済み。GitHubへの反映待ちです。`
- 外部更新の確認後: `GitHubへの反映を確認しました。`
- 競合: `別の変更が保存されています。最新の内容を確認してください。`
- 取得失敗: `GitHubから取得できませんでした。前回取得した内容を表示しています。`

同期の成功を確認する前に「更新しました」「完了しました」と表示しない。取得失敗を「タスクはありません」に置き換えない。

## English

Short, specific labels; sentence case; consistent research and planning terminology. Use “Save”, “Add work log”, “Go to today”, “GitHub update pending”. Avoid promotional claims such as “Unlock your potential” or “Seamlessly manage everything”.

An error states the problem and the next action. Example: “Another change has been saved. Reload to review the latest version.” Saving to the site and publishing an update to GitHub are separate states.

Language switching changes application-owned labels, dates, status messages and accessible names. It does not translate or overwrite research titles, Issue bodies, comments, or work logs. Dates use unambiguous month names in English; the time zone remains Japan time unless explicitly changed by a later requirement.

## 会話・計画書

| 避ける例 | 修正例 |
| --- | --- |
| 研究活動をより効率的に推進するための基盤を構築します | 研究計画と今週の作業を同じ画面で確認できるようにします |
| 情報を一元化し、シームレスな体験を実現します | Issueと予定の取得結果を保存し、確認時刻を表示します |
| 重要なのは、単なる管理ではなく成長の可視化です | 完了条件、実施内容、次の変更を記録します |
| 検証済みです | 型検査と28件のテストが通りました。実カレンダーへの書き込みは未確認です |
| AIっぽくない洗練された画面にします | 空の行を圧縮し、正式締切と目標日を異なる記号で表示します |

最初に対象・変更・確認できた結果を書く。理由と未確認事項を続ける。根拠のない賞賛、強い形容、一般論の前置き、詩的なコピー、同義反復を加えない。箇条書きや見出しは比較・手順・参照に必要な場合に使う。

参考: [SmartHRの基本的な考え方](https://smarthr.design/products/contents/writing-style/)、[Science Tokyo](https://design-system.isct.ac.jp/ja/documents/writing-guidelines)、[GOV.UK](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)。各組織の語彙・文体を丸ごと採用するのではなく、今回の操作と研究業務に合わせて検討した。
