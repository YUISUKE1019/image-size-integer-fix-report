# PC画面スワイプ対応 - 実装レポート

## 概要

PC画面でも商品カルーセルをスワイプ（ドラッグ）で操作できるようにするため、マウスイベント（mousedown, mousemove, mouseup）を追加する必要があります。

## 問題の原因

### 現在の実装状況

**`theme.js`のカルーセル実装:**
- タッチイベント（touchstart, touchmove, touchend）のみ実装されている
- マウスイベント（mousedown, mousemove, mouseup）が実装されていない
- PC画面ではタッチイベントが発火しないため、スワイプ操作ができない

### 問題箇所

**`theme.js`のカルーセル初期化処理:**
```javascript
// 現在のコード（推測）
gal.addEventListener('touchstart', onStart);
gal.addEventListener('touchmove', onMove);
gal.addEventListener('touchend', onEnd);
// マウスイベントが追加されていない
```

## 修正が必要な箇所

### ファイル: `theme.js`

#### 修正箇所1: マウスイベントの追加

**現在のコード構造（推測）:**
```javascript
// カルーセルの初期化処理
function initCarousel(gal) {
  const track = gal.querySelector('.card-gallery__track');
  let dragging = false;
  let startX = 0;
  let curX = 0;
  let index = 0;
  
  // タッチイベントのみ
  gal.addEventListener('touchstart', onStart);
  gal.addEventListener('touchmove', onMove);
  gal.addEventListener('touchend', onEnd);
  
  // マウスイベントが追加されていない ❌
}
```

**修正後のコード:**
```javascript
// カルーセルの初期化処理
function initCarousel(gal) {
  const track = gal.querySelector('.card-gallery__track');
  let dragging = false;
  let startX = 0;
  let curX = 0;
  let index = 0;
  
  // タッチイベント
  gal.addEventListener('touchstart', onStart);
  gal.addEventListener('touchmove', onMove);
  gal.addEventListener('touchend', onEnd);
  
  // マウスイベントを追加（PC画面対応）
  gal.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  gal.addEventListener('mouseleave', onEnd); // マウスが要素の外に出た場合
}
```

**変更内容:**
- `mousedown`イベントを追加（`touchstart`と同じ処理）
- `mousemove`イベントを追加（`touchmove`と同じ処理）
- `mouseup`イベントを追加（`touchend`と同じ処理）
- `mouseleave`イベントを追加（マウスが要素の外に出た場合の処理）

**理由:**
- PC画面ではタッチイベントが発火しないため、マウスイベントが必要
- タッチイベントとマウスイベントで同じ処理を使用することで、コードの重複を避ける

#### 修正箇所2: イベントハンドラーの統一

**現在のコード構造（推測）:**
```javascript
function onStart(e) {
  // e.touches を使用（タッチイベント専用）
  if (e.touches) {
    startX = e.touches[0].clientX;
  }
  // マウスイベントの処理がない ❌
}

function onMove(e) {
  // e.touches を使用（タッチイベント専用）
  if (e.touches) {
    curX = e.touches[0].clientX;
  }
  // マウスイベントの処理がない ❌
}
```

**修正後のコード:**
```javascript
function onStart(e) {
  // タッチイベントとマウスイベントの両方に対応
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  
  // マウスイベントの場合、左クリックのみ（右クリックや中クリックは無視）
  if (e.button !== undefined && e.button !== 0) return;
  
  dragging = true;
  startX = clientX;
  curX = clientX;
  track.style.transition = '';
  
  // テキスト選択を防ぐ
  e.preventDefault();
  
  // カーソルを変更（マウスイベントの場合）
  if (!e.touches) {
    gal.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }
}

function onMove(e) {
  if (!dragging) return;
  
  // タッチイベントとマウスイベントの両方に対応
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  
  curX = clientX;
  const dx = curX - startX;
  const imageWidth = getImageWidth(); // 整数値の画像幅
  const base = -index * imageWidth;
  track.style.transform = `translateX(${base + dx}px)`;
  
  // テキスト選択を防ぐ
  e.preventDefault();
}

function onEnd(e) {
  if (!dragging) return;
  
  dragging = false;
  const dx = curX - startX;
  const imageWidth = getImageWidth(); // 整数値の画像幅
  const threshold = imageWidth * 0.18;
  
  if (dx < -threshold && index < count - 1) index++;
  if (dx > threshold && index > 0) index--;
  
  setActive(index);
  
  // カーソルを元に戻す（マウスイベントの場合）
  if (!e.touches) {
    gal.style.cursor = '';
    document.body.style.userSelect = '';
  }
}
```

**変更内容:**
- `e.touches ? e.touches[0].clientX : e.clientX`で、タッチイベントとマウスイベントの両方に対応
- マウスイベントの場合、左クリックのみ処理（`e.button !== 0`で除外）
- マウスイベントの場合、カーソルスタイルとテキスト選択を制御

**理由:**
- タッチイベントとマウスイベントで同じ処理を使用することで、コードの重複を避ける
- PC画面でもスワイプ操作が可能になる

#### 修正箇所3: カーソルスタイルの設定

**現在のコード構造（推測）:**
```javascript
// カーソルスタイルの設定がない
```

**修正後のコード:**
```css
/* theme.css に追加 */
.product-item__image.card-gallery.my-card-gallery {
  cursor: grab; /* デフォルトのカーソル */
}

.product-item__image.card-gallery.my-card-gallery:active {
  cursor: grabbing; /* ドラッグ中のカーソル */
}
```

**または、JavaScriptで設定:**
```javascript
// カルーセル初期化時に設定
gal.style.cursor = 'grab';

// ドラッグ開始時
gal.style.cursor = 'grabbing';

// ドラッグ終了時
gal.style.cursor = 'grab';
```

**変更内容:**
- デフォルトのカーソルを`grab`に設定（ドラッグ可能であることを示す）
- ドラッグ中のカーソルを`grabbing`に設定（ドラッグ中であることを示す）

**理由:**
- ユーザーにドラッグ可能であることを視覚的に示す
- UXの向上

## 実装の優先順位

### 優先度: 高
1. **マウスイベントの追加**
   - PC画面でもスワイプ操作が可能になる
   - 基本的な機能

2. **イベントハンドラーの統一**
   - タッチイベントとマウスイベントで同じ処理を使用
   - コードの重複を避ける

### 優先度: 中
3. **カーソルスタイルの設定**
   - UXの向上
   - ドラッグ可能であることを視覚的に示す

## 実装の注意点

### 1. イベントの競合を避ける
- タッチイベントとマウスイベントが同時に発火しないようにする
- `e.preventDefault()`を使用して、デフォルトの動作を防ぐ

### 2. テキスト選択の防止
- ドラッグ中はテキスト選択を防ぐ
- `document.body.style.userSelect = 'none'`を使用

### 3. マウスが要素の外に出た場合
- `mouseleave`イベントでドラッグを終了する
- ドラッグが途中で終了した場合の処理

### 4. 整数値の画像幅を使用
- 移動量の計算で整数値の画像幅を使用する
- `--image-width-integer`CSS変数から取得、または`Math.ceil(gal.clientWidth)`で計算

## まとめ

PC画面でもスワイプ操作を可能にするため、以下の対応が必要です：

1. **`theme.js`の変更**
   - マウスイベント（mousedown, mousemove, mouseup）を追加
   - イベントハンドラーをタッチイベントとマウスイベントの両方に対応
   - カーソルスタイルの設定

2. **`theme.css`の変更（オプション）**
   - カーソルスタイルの設定（`cursor: grab`）

これらの変更を実装することで、PC画面でもスワイプ操作が可能になります。
