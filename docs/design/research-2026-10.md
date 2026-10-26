# 画面・文言の調査（2026-10-26）

対象コミット: `52749b1`。日本語6例、英語6例。公式の製品説明、利用画面の掲載例、デザインシステム、ヘルプを対象とした。ログインが必要な製品の全機能を操作した調査ではない。

## 現状監査

| 問題 | 観察・根拠 | 比較案での対応 |
| --- | --- | --- |
| 空のカテゴリーが画面を占める | `components/timeline.tsx`は各レーンに最低高を割り当てる。予定がなくても5分類を描画する | 予定のある行だけ展開し、分類は凡例・フィルターとして残す |
| 時間軸の前に操作が分散する | ヘッダー、期間、プロジェクト、分類、検索が別々の横段に並ぶ | グローバル操作と表示操作を分け、期間・対象・検索を一つの領域に集める |
| 未見積もりの尺度まで0点が並ぶ | `components/planning-board.tsx`はすべての尺度を表示する | 見積もりがある尺度のみ集計し、未入力の件数を別に表示する |
| 保存の操作名が長い | 「変更を反映待ちに保存」など、内部処理と操作名が一体化する | 操作は「保存」。結果には「Siteに保存済み」「GitHubへの反映待ち」を明示する |
| 日本語と英語が混在する | Blocker、Feedback、pt、案件、プロジェクトが同じ画面に現れる | 日英の用語表を作り、表示言語と保存値を分ける |
| 密度の高い箇所と空白の多い箇所が隣接する | タスクの表と大きなカテゴリー図が縦に続く | 同じデータで、一覧・図・週間計画の3方向を比較する |

これは使いやすさについての仮説であり、見た目からAIの使用を判定した結果ではない。

## 日本語の参考6例

| 参考・確認先 | 採用候補 | 合わない点・適用範囲 |
| --- | --- | --- |
| [Backlogのガントチャート](https://backlog.com/ja/function/ganttchart/) | 左の作業一覧と右の時間軸の行を対応させる。期間と担当・状態を同時に読む | 紹介ページの大きな見出しや導入コピーは管理画面へ移さない。掲載スクリーンショットを目視確認。実サービスの編集操作は未検証 |
| [SmartHRのデザインパターン](https://smarthr.design/products/design-patterns/)・[UIテキスト](https://smarthr.design/products/contents/ui-text/) | 操作、入力、状態、結果を分ける。一覧の行高と補助文字に役割を持たせる | 人事業務の語彙やブランドカラーは転用しない。OSSのサンプルとブランド素材の利用条件を区別する |
| [デジタル庁の表](https://design.digital.go.jp/dads/components/table/usage/)・[書体](https://design.digital.go.jp/dads/foundations/typography/) | 表の境界、列の整列、日本語の読みやすさ、見出しと本文の役割 | 行政手続き用の文章量を研究用の管理画面に持ち込まない。表・入力・状態の公式サンプルを再現練習に使う |
| [Science Tokyoのライティング](https://design-system.isct.ac.jp/ja/documents/writing-guidelines) | 日本語・英語それぞれの用語、日付、所属、学年の表記を決める | 広報記事の文体や大学固有の名称をUI全体へ適用しない。研究・業務の語彙の確認に使う |
| [ほぼ日手帳weeks](https://www.1101.com/store/techo/ja/magazine/contents/weeks/) | 週間予定と記録を並べる。細い罫線と小面積の色で日付を区切る | 日々の言葉、商品写真、イラストは採用しない。紙面の考え方を参照し、製品の複製はしない |
| [kintoneの操作・エラーのヘルプ](https://jp.kintone.help/k/ja/trouble_shooting/app_trouble) | 操作対象を名前で示し、保存できない理由と修正箇所を対応させる | 「レコード」「アプリ」など製品固有の概念を研究プロジェクトに置き換えない。公式ヘルプの記述を確認。ログイン後の挙動は未検証 |

## 英語の参考6例

| 参考・確認先 | 採用候補 | 合わない点・適用範囲 |
| --- | --- | --- |
| [Linearの再設計](https://linear.app/now/how-we-redesigned-the-linear-ui) | ナビゲーションと内容の境界、ヘッダーの強弱、詳細パネルとの接続 | 暗色・小文字・開発者向け語彙をそのまま日本語へ移さない。Linearだけを全画面の参照元にしない |
| [Primer DataTable](https://primer.style/product/components/data-table/)・[Empty states](https://primer.style/product/ui-patterns/empty-states/) | 表の操作と選択、空の状態、必要に応じた詳細表示 | GitHubのロゴ、製品画面、独自文言はOSSの許諾に含まれるとは扱わない |
| [Thingsの日付別一覧](https://culturedcode.com/things/support/articles/4001304/) | 日付とプロジェクトという二つの視点で同じタスクを見る。予定と作業を近くに配置する | 将来の日付がある作業を単純に隠す規則は、正式締切のある研究計画にそのまま適用しない |
| [Basecamp](https://basecamp.com/) | プロジェクト内で作業・予定・記録をまとめ、操作対象を明示する | 製品紹介の口語・宣伝文句やイラストを採用しない。掲載例による観察であり実アカウントでの操作テストではない |
| [The Puddingの時系列図](https://pudding.cool/2020/03/census-history/) | 年を大きな手掛かりにし、注釈を図の近くに置く。長期間を段階的に読む | スクロール演出や物語の文章を毎日の作業画面へ移さない。面談図・博士全体の図に限定して検討する |
| [GOV.UKのUIライティング](https://www.gov.uk/service-manual/design/writing-for-user-interfaces) | 操作を短く直接示し、同じ概念に同じ語を使う。説明文を追加する前に操作自体を整理する | 英語の文法・敬語・大小文字の規則を日本語へ一律に適用しない |

## 「AIっぽさ」を検討する方法

- [Web制作の画一化を扱う研究](https://www.microsoft.com/en-us/research/publication/interrogating-design-homogenization-in-web-vibe-coding/)は、生成の過程で既定の表現へ寄る問題を論じている。特定の配色の禁止を実証する研究ではない。
- [CHI 2024の画像による発想支援の実験](https://qiushi-zhou.github.io/PDF/CHI-2024-AI.pdf)は、初心者の画像生成を使った発想に固定化が起きる可能性を示す。研究条件を日本語UI一般へ拡張しない。
- 色、書体、角丸、影を単独で「AIの印」とはしない。目的に合わない反復、すべて同じ強さの見出し、不要な数値、抽象的な言葉を具体的に指摘する。
- 3案は同じデータ・機能で比較する。生成元や参照ブランドを伏せ、探しやすさ、研究・業務への自然さ、継続利用したいかを本人が評価する。
- 配色は使用面積と意味、書体は日英・数字・長い名称、形状は操作・選択・図の記号という役割で評価する。

## 再現練習の範囲と権利

3画面はDADSのテーブル、SmartHR UIの一覧サンプル、Primerの表サンプルを対象とする。出典の版・ライセンス・寸法・差分を`studies/manifest.json`へ記録する。取得できない元画面を「完全一致」と報告しない。再現物は比較用であり、製品画面へそのまま組み込まない。

| 対象 | 条件・確認先 | 扱い |
| --- | --- | --- |
| DADS | [利用上の注意](https://design.digital.go.jp/dads/introduction/notices/): コードMIT、FigmaデータCC BY 4.0等 | 対象コードの許諾表示を保持。文書、デザインデータ、アイコンの条件を別々に記録 |
| SmartHR UI | [MIT](https://github.com/kufu/smarthr-ui/blob/master/LICENSE)・[ブランド素材等の規約](https://smarthr.design/terms/) | OSSサンプルの構成・寸法のみ。ロゴ、イラスト、ブランドカラー一式、製品キャプチャは転用しない |
| Primer React | [MIT](https://github.com/primer/react/blob/main/LICENSE) | 許諾表示を保持。GitHubのロゴ・製品そのものと区別する |
| 書体 | Noto、IBM Plex、Sourceの各配布元のOFLを確認 | フォント名、利用ウェイト、提供元を記録。Figmaで利用できることを再配布の許諾とは扱わない |
| 独自の比較案 | このリポジトリで作成したコード・仮データ | 第三者のブランドや研究者の実計画を含めない |

非公開の研究計画・Issue本文・予定・認証情報をFigma、Canva、公開リポジトリへコピーしない。
