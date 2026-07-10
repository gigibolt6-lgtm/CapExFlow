# CapExFlow アプリ構成・機能・業務フロー再定義

## 0. 本書の目的

本書は、現行の CapExFlow を設備投資案件の「入力フォーム集」から、次の業務を一貫して支援するアプリへ再定義する。

1. 現状工程・原価・能力の把握
2. 複数の設備導入案の設計
3. 投資額、効果額、能力、損益分岐点、投資回収の比較
4. 稟議資料の作成
5. 審査状況と修正履歴の管理
6. 過去案件・設備・見積情報の再利用

実装は全面破棄ではなく、現行データを移行しながら段階的に置き換える。

---

# 1. 現行アプリの構成

## 1.1 現行技術構成

| 領域 | 現状 |
|---|---|
| Frontend | React 19 / Vite / TypeScript / Tailwind CSS / Recharts / Motion |
| Frontend実装 | `src/App.tsx` に型、状態、画面、計算、帳票を集中実装 |
| Frontend保存 | 案件、設備、ラインユニット、設備構造定義を `localStorage` に保存 |
| Backend | Node.js / Express / TypeScript |
| Backend保存 | `backend/data/projects.json` |
| Backend API | 案件CRUD、複製、アーカイブ、計算ユニットCRUD |
| 帳票 | ブラウザ印刷 `window.print()` によるPDF保存 |
| 検証 | TypeScript型のみ。実行時スキーマ検証なし |
| テスト | 自動テストなし |

## 1.2 現行画面構成

### グローバル画面

- 案件一覧
- 設備DB・見積DB
- ラインユニットDB
- 統計・分析
- 設備構造定義（管理者モード）
- 設定
- テンプレート、出力履歴、バックアップは未実装表示

### 案件編集

案件編集は以下の3カテゴリに分かれている。

1. プロジェクト共通情報
   - 管理情報
   - 稟議内容・議題
   - 生産条件
2. 対策案・シナリオ
   - 現状
   - A案、B案、C案
   - ラインユニット
   - 購入設備・費用
   - 導入効果
   - 投資回収
   - 損益分岐点
   - 労務費差異
   - 総合結論
3. レポート作成
   - 出力項目設定
   - プレビュー
   - 印刷/PDF保存

## 1.3 現行実装済み機能

### 案件管理

- 新規案件作成
- サンプルデータ投入
- 案件一覧表示
- 案件編集・保存
- draft / submitted / approved の表示用ステータス

### 設備・見積マスタ

- 設備カテゴリ、中分類、小分類
- 動的仕様項目
- 設備マスタ
- 複数見積
- 推奨見積
- 償却方法、耐用年数、残存価額率
- 設備仕様の案件への参照
- マスタ値の案件リソースへの同期

### ライン構成

- ラインユニット
- 前工程・次工程
- バッファ
- 人員、設備、エネルギー等のリソース
- SPM、数量、時間単価、稼働率、使用時間
- ラインユニットマスタ

### 投資案比較

- 現状案と複数対策案
- 設備費・追加費用
- 多通貨入力
- 為替換算
- 投資額
- 年間効果額
- 回収年数
- NPV
- IRR
- ROI
- 損益分岐点
- 労務費比較
- シナリオ比較表
- キャッシュフローグラフ

### レポート

- 出力項目選択
- HTMLプレビュー
- 印刷によるPDF保存
- シナリオ比較
- 管理情報、稟議理由、財務指標等の出力

---

# 2. 現行実装の主要問題

## 2.1 最優先の構造問題

### P0-1. FrontendとBackendが別アプリとして存在する

Frontendは `localStorage` を正本として動作し、Backendの `/api/projects` を使用していない。

さらに、Frontendの `MockProject` とBackendの `Project` は構造が異なる。現状では次の問題が発生する。

- Backendへ保存してもFrontendに反映されない
- ブラウザ変更・キャッシュ削除でデータが失われる
- データ移行ルールがない
- 計算結果と保存結果の再現性が保証されない
- Backend側のバックアップが実質利用されない

**再定義:** BackendのJSONストアを唯一の正本とし、Frontendの業務データ保存をAPI経由へ統一する。`localStorage` はテーマ等のUI設定と移行前データの読取りに限定する。

### P0-2. `App.tsx` が約15,000行の単一ファイル

型定義、マスタ、状態管理、計算式、画面、帳票が同一ファイルにある。

- 変更影響範囲を特定しにくい
- 計算ロジックをテストできない
- UIと業務ロジックが密結合
- 同じ計算が編集画面とレポートで重複する
- Codexによる部分改修時に回帰不具合が起きやすい

**再定義:** ドメイン、計算、API、画面、帳票へ分割する。計算結果は共通エンジンのみから取得し、画面内で再計算しない。

### P0-3. 金額単位が円と万円で混在

現行コードでは、入力時の「万円」、設備見積の「円」、計算途中の `×10000` / `÷10000`、レポート表示単位が混在している。

**再定義:** 保存・計算は通貨の基本単位で統一する。表示上の「円・千円・万円・百万円」は表示フォーマットとしてのみ扱い、データへ `unitMultiplier` を混入させない。

### P0-4. 計算定義が画面表示名と一致していない

- ROIは年次ROIではなく、計算期間累計の単純収益率
- 回収不能時に0年と表示され得る
- IRR探索上限が100%で固定
- NPVは毎年一定効果のみ
- 税、立上げ率、残存価額、運転資本、更新費を扱わない

**再定義:** 指標名、数式、前提、単位、適用条件を明示し、算出不能は `null` と理由コードを返す。

## 2.2 計算ロジックの問題

### P0-5. 導入効果がシナリオ別売上差を十分に表現できない

対象製品と売上条件がプロジェクト共通であるため、案ごとの能力差、需要充足率、増産売上を年間効果へ反映しにくい。

**再定義:** 各シナリオで以下を算出する。

- 月間理論能力
- 稼働率反映能力
- 需要充足数量
- 未充足数量
- 販売数量
- 売上
- 材料費
- 変動加工費
- 固定費
- 営業キャッシュ効果

年間効果は「対策案の年間キャッシュ貢献 − 現状案の年間キャッシュ貢献」とする。

### P0-6. 設備時間単価と電力費が混同される

設備リソースの時間単価は償却費として算出される箇所と、保存時に電力単価へ上書きされる箇所がある。さらに電力リソースでも電力費を計算するため、二重計上または計算条件の不一致が起きる。

**再定義:** コストを明確に分離する。

- 設備減価償却費
- 設備保全費
- 人件費
- 電力費
- 消耗品費
- 外注費
- その他固定費
- その他変動費

設備リソースの `hourlyRate` に複数意味を持たせない。

### P0-7. 損益分岐点の固定費・能力計算が不足

現行BEPは主に減価償却費を固定費とし、最大能力に稼働率、段取、良品率、同時取数等を十分反映していない。

**再定義:** 能力計算とBEP計算を独立モジュール化する。

### P0-8. 減価償却方式の式が箇所により異なる

定率法の計算式が、時間単価計算とBEP計算で一致していない。

**再定義:** 財務計算モジュールで一元化し、税務償却と管理会計償却を区別できる構造にする。

## 2.3 業務フロー上の問題

### P1-1. 「稟議申請」ボタンが機能しない

ステータスは存在するが、申請、差戻し、承認、却下、再申請の遷移と履歴がない。

### P1-2. 完成度・警告・必須入力が体系化されていない

保存は可能だが、どこまで入力すれば比較・申請・出力できるかが不明確。

### P1-3. 現状案と対策案の役割が曖昧

現状案も設備購入費や投資指標を持てる構造で、比較基準と提案案の区別が弱い。

### P1-4. マスタ更新が過去案件へ影響し得る

案件内設備を設備名またはIDで検索し、最新マスタ値を同期する。過去案件の計算根拠を保持するスナップショット設計が不足している。

### P1-5. シナリオA/B/Cが固定的

新規案件作成時にA/B/Cを固定作成するが、案件によって案数は異なる。

## 2.4 未実装・部分実装機能

| 機能 | 状態 |
|---|---|
| 統計・分析 | 画面枠中心 |
| テンプレート | 未実装 |
| 出力履歴 | 未実装 |
| バックアップUI | 未実装 |
| 添付ファイル | データ構造のみ、業務利用未実装 |
| 電子承認 | 未実装 |
| 申請履歴 | 未実装 |
| 入力検証一覧 | 未実装 |
| ライン能力・余力 | プレースホルダーあり |
| PDFファイル直接生成 | 未実装。ブラウザ印刷のみ |
| インポート/エクスポート | 未実装 |
| スキーマ移行 | 未実装 |
| 自動テスト | 未実装 |

---

# 3. 再定義するプロダクトの境界

## 3.1 プロダクト名称

**CapExFlow — Capital Expenditure Planning & Approval Pack Builder**

## 3.2 MVPで実現する範囲

- 設備投資案件の登録
- 現状工程の登録
- 任意数の対策案作成
- 設備・ライン・見積マスタの利用
- 能力、原価、効果、投資指標の自動計算
- シナリオ比較
- 入力整合性検証
- 稟議資料プレビュー・PDF出力
- 文書ステータスと変更履歴
- JSONバックアップ、エクスポート、復元

## 3.3 MVP対象外

- SSO、社内アカウント認証
- 法的な電子署名
- ERP・会計システムとの自動連携
- 複数ユーザー同時編集
- 為替レートの外部API自動取得
- 税務会計の完全再現

文書ステータスは管理するが、正式な電子承認そのものは対象外とする。

---

# 4. 利用者と責務

| 役割 | 主な操作 |
|---|---|
| 起案者 | 案件作成、現状入力、対策案作成、計算確認、レポート作成 |
| 技術確認者 | ライン能力、設備仕様、工事条件、リスクの確認 |
| 財務確認者 | 投資額、償却、効果、NPV、IRR、回収年数の確認 |
| 承認者 | 外部稟議結果の記録、コメント、承認・却下ステータス更新 |
| 管理者 | 設備分類、設備、見積、ラインテンプレート、会社標準値の管理 |

認証機能がないMVPでは、役割は操作権限ではなく「担当種別」として記録する。

---

# 5. 再定義する業務フロー

## Step 1. 案件作成

入力項目:

- 案件番号
- 件名
- 起案部署
- 起案者
- 工場・設置場所
- 投資目的
- 希望承認日、発注日、設置日、量産日
- 基準通貨
- 計算期間
- 割引率

作成時に自動生成するもの:

- `projectId`
- 初期ステータス `draft`
- 現状シナリオ `baseline`
- 変更履歴

対策案は自動でA/B/Cを固定作成せず、必要時に追加する。

## Step 2. 現状条件の定義

- 対象製品
- 需要数量
- 売価
- 材料費
- 現状ライン
- 工程順
- 人員
- 設備
- SPM/サイクルタイム
- 稼働率
- 良品率
- 段取時間
- 稼働日数・稼働時間
- 現状固定費・変動費

この情報を全対策案の比較基準とする。

## Step 3. 対策案作成

任意数の対策案を作成する。

作成方法:

- 空の案を作成
- 現状案から複製
- 他の対策案から複製
- ラインユニットテンプレートから作成

各案で設定する内容:

- ライン構成
- 新規設備
- 既存設備流用
- 見積選択
- 工事費
- 輸送費
- 治具費
- 初期消耗品
- 教育費
- 撤去費
- 売却・残存価額
- 年間保全費
- 人員
- 電力
- 増産効果
- 品質効果
- 外注削減
- リスク

## Step 4. 技術評価

自動計算:

- 各工程の理論能力
- 稼働率反映能力
- 良品能力
- ボトルネック
- 月間ライン能力
- 需要充足率
- 工程余力
- 必要人員
- 消費電力量

警告:

- 前後工程未接続
- 循環参照
- SPM未入力
- 能力不足
- 稼働率範囲外
- 設備仕様未確定
- 見積有効期限切れ

## Step 5. 財務評価

自動計算:

- 初期投資額
- 償却対象額
- 非償却費
- 年間売上差
- 年間材料費差
- 年間労務費差
- 年間電力費差
- 年間保全費差
- 年間品質損失差
- 年間外注費差
- 年間ネット効果
- 単純回収年数
- 割引回収年数
- 年次ROI
- 累計ROI
- NPV
- IRR
- 損益分岐点数量
- 損益分岐点売上
- 損益分岐点稼働率

## Step 6. シナリオ比較・採用案選定

比較軸:

- 投資額
- 能力
- 需要充足率
- 年間効果
- 回収年数
- NPV
- IRR
- BEP稼働率
- 実施期間
- 技術リスク
- 保全性
- 拡張性

ユーザーは採用候補案を1つ選択する。選択は結論であり、他案を削除しない。

## Step 7. レビュー準備

検証レベル:

- Error: 申請不可
- Warning: 申請可能だが要確認
- Info: 推奨入力

`ready_for_review` へ進める条件:

- 必須管理情報が入力済み
- 現状案が存在
- 対策案が1件以上
- 採用候補案が選択済み
- 投資額と年間効果の計算が成立
- Errorが0件

## Step 8. 稟議資料出力

- 出力テンプレート選択
- 出力項目選択
- プレビュー
- PDF出力
- JSONスナップショット出力
- 出力履歴保存

## Step 9. ステータス管理

状態遷移:

```text
draft
  -> ready_for_review
  -> submitted
  -> approved
  -> archived

submitted -> rejected -> draft
ready_for_review -> draft
approved -> archived
```

各変更で記録するもの:

- 日時
- 操作者名
- 変更前後ステータス
- コメント
- データバージョン

---

# 6. 再定義する画面レイアウト

## 6.1 アプリ全体

### 左グローバルナビゲーション

- ダッシュボード
- 案件
- 設備・見積マスタ
- ラインテンプレート
- 分析
- 設定

「設備構造定義」は設備マスタ配下の管理機能へ統合する。

### ヘッダー

- パンくず
- 現在案件名
- 保存状態
- 文書ステータス
- 検証エラー数
- 保存
- レビュー準備
- PDF出力

## 6.2 案件一覧

カード中心ではなく、比較・検索しやすいテーブルを基本にする。

列:

- 案件番号
- 件名
- 部署
- 起案者
- ステータス
- 採用候補案
- 投資額
- 回収年数
- 更新日
- 操作

上部:

- キーワード検索
- ステータス
- 部署
- 投資目的
- 更新期間
- アーカイブ表示
- 新規案件

## 6.3 案件編集シェル

### 左: 案件ステップナビ

1. 概要
2. 現状条件
3. 対策案
4. 評価・比較
5. 実施計画・リスク
6. レポート

各項目に以下を表示する。

- 完了
- 未入力
- 警告
- エラー

### 中央: 編集領域

選択中ステップの入力・比較画面。

### 右: Sticky評価サマリー

- 選択中シナリオ
- 投資額
- 年間ネット効果
- 回収年数
- NPV
- IRR
- 能力
- 需要充足率
- エラー/警告

画面幅が狭い場合は右パネルを折りたたむ。

## 6.4 対策案画面

上部にシナリオタブを置く。

- 現状
- 対策案1
- 対策案2
- `+ 対策案追加`

現状は削除不可。対策案は名称変更、複製、並べ替え、アーカイブを可能にする。

対策案内のサブ画面:

1. ライン設計
2. 設備・見積
3. 初期費用
4. 運用費・効果
5. 能力結果

投資回収、BEP、労務費差異は個別の手入力タブではなく、入力データから得る評価結果へ統合する。

## 6.5 評価・比較画面

- 全案比較表
- 財務前提
- キャッシュフロー
- 能力比較
- コスト内訳
- 感度分析
- 採用候補選択
- 総合所見

## 6.6 レポート画面

左:

- テンプレート
- 出力項目ツリー
- 表示通貨
- 表示単位
- 案の選択

右:

- A4プレビュー
- ページ一覧
- PDF出力
- JSONスナップショット出力

---

# 7. 再定義するデータモデル

## 7.1 基本原則

1. FrontendとBackendで同じZodスキーマを使用する
2. 保存値と計算値を分ける
3. 金額の表示単位を保存データへ含めない
4. 計算結果は再計算可能な派生値とする
5. マスタ参照時は案件内にスナップショットを保持する
6. ID参照を使用し、設備名等の文字列参照を廃止する
7. 日付はISO 8601で保存する
8. スキーマバージョンを持つ

## 7.2 Project

```ts
interface Project {
  id: string;
  projectNo: string;
  title: string;
  status: ProjectStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;

  owner: PartyRef;
  reviewers: PartyRef[];
  common: ProjectCommon;
  baseline: Scenario;
  proposals: Scenario[];
  selectedProposalId?: string;
  risks: RiskItem[];
  schedule: ScheduleItem[];
  attachments: AttachmentMeta[];
  reportConfig: ReportConfig;
  auditLog: AuditEntry[];
}
```

## 7.3 Scenario

```ts
interface Scenario {
  id: string;
  kind: "baseline" | "proposal";
  name: string;
  description?: string;
  lineUnits: LineUnit[];
  capexItems: CapexItem[];
  operatingAdjustments: OperatingAdjustment[];
  revenueAdjustments: RevenueAdjustment[];
  assumptionsOverride?: ScenarioAssumptions;
}
```

## 7.4 Money

```ts
interface Money {
  amount: number;
  currency: CurrencyCode;
}
```

`amount` は通貨の通常単位で保存する。JPY 65,000,000円は `65000000`、CNY 1,000,000元は `1000000` とする。

表示単位は次で管理する。

```ts
interface MoneyDisplayPreference {
  currency: CurrencyCode;
  scale: "unit" | "thousand" | "ten_thousand" | "million";
}
```

## 7.5 為替

```ts
interface ExchangeRateSet {
  id: string;
  baseCurrency: CurrencyCode;
  effectiveDate: string;
  source: string;
  rates: Record<CurrencyCode, number>;
}
```

案件作成時または評価確定時に使用した為替セットIDとスナップショットを案件へ保存する。

## 7.6 EquipmentSnapshot

```ts
interface EquipmentSnapshot {
  masterEquipmentId?: string;
  masterRevision?: number;
  capturedAt: string;
  name: string;
  maker?: string;
  model?: string;
  categoryPath: string[];
  specs: Record<string, string | number>;
  quoteSnapshot?: QuoteSnapshot;
  depreciation?: DepreciationAssumption;
}
```

設備マスタ更新時に案件を自動変更しない。「マスタとの差分を確認」後、明示操作で更新する。

## 7.7 保存値と計算値

保存対象:

- ユーザー入力
- 選択したマスタのスナップショット
- 計算前提
- ステータス履歴
- 出力履歴

原則保存しない派生値:

- 投資総額
- 年間効果
- 能力
- NPV
- IRR
- ROI
- BEP

性能上キャッシュする場合は、入力ハッシュ、計算エンジンバージョン、計算日時を必須とする。

---

# 8. 計算エンジン再定義

## 8.1 モジュール

```text
capacityEngine
costEngine
cashFlowEngine
financialMetricsEngine
breakEvenEngine
validationEngine
comparisonEngine
```

各エンジンはReactに依存しない純粋関数とする。

## 8.2 ライン能力

工程ごとの月間良品能力:

```text
theoreticalPcsPerMonth
= speedPcsPerMinute
  × availableMinutesPerMonth
  × simultaneousOutput

netPcsPerMonth
= theoreticalPcsPerMonth
  × operatingRate
  × yieldRate
  × changeoverAvailability
```

ライン能力は直列工程の最小値とする。並列工程はグループ構造を明示して合算する。

## 8.3 年間ネット効果

```text
annualNetBenefit
= revenueIncrease
+ laborCostReduction
+ materialLossReduction
+ qualityLossReduction
+ outsourcingReduction
+ otherBenefits
- electricityIncrease
- maintenanceIncrease
- consumablesIncrease
- logisticsIncrease
- otherRecurringCosts
```

現状と対策案の差分は、同一費目を同じルールで算出した後に比較する。

## 8.4 投資額

```text
initialInvestment
= equipment
+ tooling
+ engineering
+ construction
+ installation
+ freight
+ insurance
+ training
+ initialSpareParts
+ removal
+ otherCapex
- subsidy
- assetSaleProceeds
```

税の扱いは「投資額へ含む/含まない」を会社設定で指定する。

## 8.5 指標

### 単純回収年数

```text
initialInvestment / annualNetBenefit
```

`annualNetBenefit <= 0` は `null` とし、`NOT_RECOVERABLE` を返す。

### 年次ROI

```text
annualNetBenefit / initialInvestment × 100
```

### 累計ROI

```text
(sum(netCashFlow over horizon) - initialInvestment) / initialInvestment × 100
```

表示上、年次ROIと累計ROIを混同しない。

### NPV

```text
NPV = Σ CF_t / (1+r)^t
```

年0の初期投資を含む年次キャッシュフロー配列から算出する。

### IRR

- キャッシュフローに正負両方がある場合のみ算出
- 解が複数存在し得る場合は警告
- 算出不能時は `null`
- 100%で探索を打ち切らない

### 割引回収年数

割引後累積CFが0以上となる時点を線形補間する。

## 8.6 損益分岐点

```text
contributionMarginPerUnit
= sellingPricePerUnit - variableCostPerUnit

breakEvenVolume
= monthlyFixedCost / contributionMarginPerUnit

breakEvenOperatingRate
= breakEvenVolume / netMonthlyCapacity
```

複数製品の場合:

- 製品別BEP
- 販売構成比による加重平均BEP

のどちらを使ったか明示する。

## 8.7 感度分析

MVPでは次の3変数を対象とする。

- 生産数量 ±10%, ±20%
- 投資額 ±10%, ±20%
- 年間効果 ±10%, ±20%

結果:

- NPV
- 回収年数
- IRR

---

# 9. 入力検証

## 9.1 エラー例

- 案件番号重複
- 現状シナリオなし
- 対策案なし
- 採用候補未選択
- 通貨未定義
- 為替レートなし
- 投資額が負数
- 工程ID重複
- 工程接続が循環
- 能力計算不能
- NPV計算期間0年
- 割引率が-100%以下

## 9.2 警告例

- 見積期限切れ
- 投資回収10年以上
- 能力余力5%未満
- 需要未充足
- IRRが資本コスト未満
- 採用案のリスク対策未入力
- 設備マスタ更新あり
- 手入力金額に根拠添付なし

## 9.3 完成度

完成度は単純な入力項目数ではなく、ステップごとの必須条件充足率で算出する。

---

# 10. 保存・API・バックアップ

## 10.1 保存方針

MVPはローカル単一ユーザーを前提とし、Node/Express + JSONを継続採用する。

ただし次を必須とする。

- Backendを唯一の正本とする
- Zod検証
- 一時ファイルへ書込み後にrenameする原子的保存
- 書込みMutex
- 自動バックアップ
- バックアップ世代管理
- スキーマバージョン
- マイグレーション
- エクスポート/インポート

## 10.2 API

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
POST   /api/projects/:id/duplicate
POST   /api/projects/:id/status-transitions
POST   /api/projects/:id/validate
GET    /api/projects/:id/evaluation
POST   /api/projects/:id/export
POST   /api/projects/import

GET    /api/equipment
POST   /api/equipment
PUT    /api/equipment/:id
GET    /api/line-templates
POST   /api/line-templates

GET    /api/settings
PUT    /api/settings
GET    /api/backups
POST   /api/backups/:id/restore
```

## 10.3 自動保存

- 編集はFrontend stateへ即時反映
- 1.5秒のdebounceでAPI保存
- 明示保存ボタンも提供
- 保存中、保存済み、保存失敗を表示
- 保存失敗時は未保存データをブラウザ内の一時キューへ保持

---

# 11. 推奨コード構成

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  features/
    dashboard/
    projects/
    project-editor/
    scenarios/
    equipment-master/
    line-templates/
    reports/
    settings/
  components/
    layout/
    forms/
    tables/
    feedback/
  domain/
    schemas/
    calculations/
    validation/
    migrations/
  services/
    api/
    storage/
  styles/

backend/
  api/
    projects.ts
    equipment.ts
    settings.ts
    backups.ts
  repositories/
    projectRepository.ts
    equipmentRepository.ts
    settingsRepository.ts
  services/
    backupService.ts
    migrationService.ts
    exportService.ts
  data/
  backup/

shared/
  schemas/
  types/
  constants/

tests/
  unit/
  integration/
  fixtures/
```

`src/App.tsx` はルーティングとProvider接続のみとし、500行未満を目標にする。

---

# 12. 実装優先順位

## Phase 0: 安定化

- 現行データのfixtures化
- 型チェックを通す
- 計算結果のゴールデンテスト作成
- 現行localStorageエクスポート機能
- `App.tsx` の責務分割開始

## Phase 1: 共通ドメイン・保存統一

- Zodスキーマ
- Frontend/Backend共通型
- API client
- Backend JSONを正本化
- localStorage移行
- 原子的保存・バックアップ

## Phase 2: 新業務フローUI

- 案件一覧テーブル
- 案件編集シェル
- 現状条件
- 任意数シナリオ
- 評価サマリー
- 検証一覧

## Phase 3: 計算エンジン

- 能力
- 原価
- 年間効果
- キャッシュフロー
- NPV/IRR/ROI/回収
- BEP
- 感度分析

## Phase 4: マスタ・スナップショット

- 設備・見積マスタ
- ラインテンプレート
- マスタ改訂番号
- 差分確認付き同期

## Phase 5: レポート・履歴

- 出力テンプレート
- 条件付き表示
- PDF生成
- 出力履歴
- ステータス履歴
- JSONスナップショット

## Phase 6: 分析

- 部署別投資額
- 投資目的別
- 承認状況
- 回収年数分布
- 計画対実績は将来拡張

---

# 13. 完了条件

## 機能

- ブラウザ更新後もBackend保存データが復元される
- 既存localStorage案件を移行できる
- 現状と任意数の対策案を比較できる
- 同一入力から画面と帳票で同一計算結果が表示される
- 円/万円の切替で計算結果が変わらない
- 設備マスタ変更で既存案件が無断変更されない
- エラーがある案件をレビュー準備へ進められない
- PDFとJSONスナップショットを出力できる

## 品質

- `npm run lint` 成功
- `npm run test` 成功
- `npm run build` 成功
- 主要計算にユニットテスト
- APIに統合テスト
- `any` をドメイン層から排除
- 主要画面で空状態、読込中、保存失敗を表示

## 移行

- 現行データを削除しない
- 変換前バックアップを作成
- 移行結果件数と警告を表示
- 移行は再実行しても重複しない

---

# 14. 実装上の禁止事項

- `App.tsx` へ新機能を追加し続けない
- UIコンポーネント内に財務計算式を書かない
- 円と万円を計算途中で暗黙変換しない
- 設備名を参照キーにしない
- マスタ更新を既存案件へ自動反映しない
- 算出不能な指標を0として表示しない
- BackendとFrontendで別のProject型を持たない
- localStorageを業務データの正本にしない
- レポート内で独自に再計算しない
