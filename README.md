# クイズアプリ

リアルタイムクイズアプリケーション。管理者がタイミングを制御しながら進行するライブクイズシステムです。

## アーキテクチャ

| サービス | 技術 | 役割 |
|---------|------|------|
| `nginx` | Nginx | リバースプロキシ / TLS終端 |
| `frontend` | React + Vite + Nginx | クイズUI (スマートフォン対応) |
| `backend` | FastAPI + Python | REST API + WebSocket |
| `redis` | Redis | クイズ状態・回答データ保存 |

## クイックスタート

### 1. 環境変数の設定

```bash
cp .env.example .env
# .env を編集して ADMIN_PASSWORD を設定
```

### 2. クイズ内容の編集

`quiz-content/quiz_data.json` を編集してクイズを設定します。

```json
{
  "quiz_title": "クイズ大会",
  "theme_color": "#7C3AED",
  "questions": [
    {
      "id": 0,
      "title": "第1問",
      "body": "問題文を入力",
      "choices": [
        { "id": "A", "image": "/images/q1_a.jpg", "label": "選択肢A" },
        { "id": "B", "image": "/images/q1_b.jpg", "label": "選択肢B" },
        { "id": "C", "image": "/images/q1_c.jpg", "label": "選択肢C" },
        { "id": "D", "image": "/images/q1_d.jpg", "label": "選択肢D" }
      ],
      "correct_answer": "A"
    }
  ]
}
```

画像ファイルは `quiz-content/images/` に配置してください。

### 3. 起動

```bash
docker compose up -d --build
```

ブラウザで http://localhost を開きます。

管理者画面: http://localhost/admin

---

## HTTPS (TLS) 設定

1. 証明書ファイルを `nginx/certs/` に配置:
   - `fullchain.pem` — 証明書 + チェーン
   - `privkey.pem` — 秘密鍵

2. `nginx/nginx.conf` のTLSセクションをアンコメント

3. HTTPSリダイレクトブロックをアンコメント (任意)

4. コンテナを再起動:
   ```bash
   docker compose restart nginx
   ```

---

## テーマカラーの変更

`quiz-content/quiz_data.json` の `theme_color` を任意の16進数カラーコードに変更します。

例: `"#FF6B6B"` (レッド), `"#10B981"` (グリーン), `"#F59E0B"` (アンバー)

---

## 管理者操作フロー

1. `/admin` にアクセスしてパスワードでログイン
2. 参加者が `/` からアクセスして名前を登録
3. 管理者が **クイズ開始** ボタンを押す
4. 参加者に第1問が表示され回答を受け付ける
5. 管理者が **次の問題** で次問へ進む (一時停止も可能)
6. 全問終了後、参加者に結果が表示される
7. 管理者画面でリアルタイムにスコアを確認できる
