# 設備導入稟議作成アプリ Backend (Phase 2)

## Phase 2の目的
本フェーズでは、案件データの登録・保存・更新・削除・複製を行うための「データ管理基盤」を構築しました。
ブラウザ内保存ではなく、サーバー(Node.js/Express)側のファイルシステム上にJSON形式でデータを保持し、信頼性を高めています。

## 技術スタック
- **Runtime**: Node.js
- **Framework**: Express (FastAPIの代わりに、既存のNode環境を活かして構築)
- **Tooling**: `tsx` (TypeScriptでの直接実行)

## 起動方法
以下のコマンドで開発サーバーが起動します（Reactフロントエンドも同時に動作します）。
```bash
npm run dev
```

## API一覧
各APIは `http://localhost:3000/api` から利用可能です。

- `GET /api/health`: ヘルスチェック
- `GET /api/projects`: 案件一覧（サマリー）の取得
- `GET /api/projects/:projectId`: 案件詳細の取得
- `POST /api/projects`: 新規案件の作成
- `PUT /api/projects/:projectId`: 案件の更新
- `POST /api/projects/:projectId/duplicate`: 案件の複製
- `POST /api/projects/:projectId/archive`: 案件のアーカイブ
- `DELETE /api/projects/:projectId`: 案件の物理削除
- `POST /api/projects/:projectId/units`: 計算ユニットの追加
- `PUT /api/projects/:projectId/units/:unitId`: 計算ユニットの更新
- `DELETE /api/projects/:projectId/units/:unitId`: 計算ユニットの削除

## projects.json の保存場所
案件データは以下の場所に保存されます。
`backend/data/projects.json`

## バックアップ仕様
保存アクションが発生するたびに、保存前の状態が `backend/backup/` フォルダへコピーされます。
ファイル名形式: `projects_YYYYMMDDHHMMSS.json`

## 注意事項
- 本フェーズでは、Node.js/TypeScriptを使用して実装しています。これはAI Studioの標準環境との親和性および既存依存関係（express等）を尊重した判断です。
- 保存操作は自動バックアップを伴います。
- `projectId` および `unitId` は重複しないよう自動採番されます。

## 今後のPhase 3以降で実装する内容
- **Phase 3**: Reactによる案件編集画面・計算ユニット詳細UIの本格実装。
- **Phase 4**: 投資回収・損益分岐点の計算エンジンの実装。
- **Phase 5**: PDF出力機能の実装。
