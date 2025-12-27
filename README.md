# 画像サイズ整数化 修正レポート

このリポジトリには、商品一覧ページのカルーセル画像サイズを整数化するための修正レポートが含まれています。

## ファイル構成

- `画像サイズ整数化_修正レポート.md` - 詳細な修正レポート

## GitHubリポジトリへのアップロード手順

### 1. GitHubでリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」ボタンをクリック → 「New repository」を選択
3. リポジトリ名を入力（例: `image-size-integer-fix-report`）
4. 「Public」または「Private」を選択
5. 「Initialize this repository with a README」は**チェックしない**（既にローカルにリポジトリがあるため）
6. 「Create repository」をクリック

### 2. リモートリポジトリを追加してプッシュ

GitHubでリポジトリを作成したら、表示されるURLを使用して以下のコマンドを実行：

```bash
# リモートリポジトリを追加（YOUR_USERNAMEとREPO_NAMEを置き換えてください）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# ブランチ名をmainに変更（GitHubのデフォルトに合わせる）
git branch -M main

# リモートリポジトリにプッシュ
git push -u origin main
```

### 3. 認証

初回プッシュ時は、GitHubの認証情報（ユーザー名とパスワード/トークン）が求められます。

**注意**: パスワードの代わりにPersonal Access Token（PAT）を使用する必要がある場合があります。
- GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
- でトークンを生成して使用してください。

## 内容

詳細な修正内容については、`画像サイズ整数化_修正レポート.md`を参照してください。

