# zoom-images要素の表示問題 修正レポート

## 概要

`zoom-images`要素内で、`active`クラスを持つ要素ではなく`hidden`クラスを持つ要素が画面に表示されてしまう問題を修正しました。

## 問題の原因

### 1. offsetLeftが負の値になっていた

**調査結果：**
- active要素（index 0）の`offsetLeft`: `-1194px`
- hidden要素（index 3）の`offsetLeft`: `0px`
- その結果、hidden要素が画面内に表示され、active要素が画面外に配置されていた

**根本原因：**
親要素（`zoom-images`）のCSS設定：
```css
zoom-images {
  display: flex;
  flex-direction: row;
  justify-content: center;  /* ← これが原因 */
  align-items: center;
}
```

`justify-content: center`により、子要素が中央に配置されていたため：
- 親要素の幅: `398px`
- 子要素の総幅: `1592px`（7個 × 398px）
- 中央配置により、最初の要素が親要素の左端より左側（`-1194px`）に配置されていた

## 修正内容

### 修正1: justify-contentをflex-startに変更

**修正前：**
```css
zoom-images {
  justify-content: center;  /* 中央配置 */
}
```

**修正後：**
```css
zoom-images {
  justify-content: flex-start !important;  /* 左揃え */
}
```

**効果：**
- 最初の子要素の`offsetLeft`が`0`から始まるようになった
- 各要素が`0, 398, 796, 1194, 1592, 1990, 2388`と順番に配置されるようになった

### 修正2: hidden要素の視覚的な非表示（一時的）

**問題：**
- hidden要素が画面に表示されてしまう

**修正：**
```css
zoom-images .media--hidden {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

zoom-images .media--active {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}
```

### 修正3: すべての要素を常に表示状態にする（最終修正）

**要件：**
- active/hiddenの切り替えをなくす
- すべての要素を常にactiveと同じ表示状態にする

**修正：**
```css
/* すべての要素を常に表示状態にする（active/hiddenの切り替えをなくす） */
zoom-images .product__slide {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

/* offsetLeftを0から始めるようにjustify-contentをflex-startに変更 */
zoom-images {
  justify-content: flex-start !important;
  overflow-x: scroll !important;
  overflow-y: hidden !important;
  -webkit-overflow-scrolling: touch !important;
}
```

**UX改善：**
active/hiddenの切り替えを無くすことで、以下のUX改善が実現されました：

**修正前の問題：**
- スクロール中はhidden要素が`opacity: 0`、`visibility: hidden`で非表示
- スクロールが終了してからJavaScriptがactive/hiddenクラスを切り替える
- その結果、スクロール中は次の画像が見えず、スクロール終了後に突然表示される

**修正後の改善：**
- すべての要素が常に`opacity: 1`、`visibility: visible`で表示される
- スクロール中も次の画像が常に見える状態になる
- スムーズなスクロール体験が実現される
- ユーザーはスクロール中に次の画像を確認できるため、操作性が向上

**技術的な理由：**
- active/hiddenの切り替えには、スクロールイベントの終了を検知してからクラスを変更する処理が必要
- この処理により、スクロール中はhidden要素が非表示になり、スクロール終了後にactive要素に切り替わってから表示される
- すべての要素を常に表示状態にすることで、この遅延を排除し、リアルタイムで画像が表示される

## 修正結果

### offsetLeftの変化

**修正前：**
- index 0（active要素）: `offsetLeft: -1194px`
- index 1: `offsetLeft: -796px`
- index 2: `offsetLeft: -398px`
- index 3: `offsetLeft: 0px` ← 画面内に表示
- index 4: `offsetLeft: 398px`
- index 5: `offsetLeft: 796px`
- index 6: `offsetLeft: 1194px`

**修正後：**
- index 0（active要素）: `offsetLeft: 0px` ← 画面内に表示
- index 1: `offsetLeft: 398px`
- index 2: `offsetLeft: 796px`
- index 3: `offsetLeft: 1194px`
- index 4: `offsetLeft: 1592px`
- index 5: `offsetLeft: 1990px`
- index 6: `offsetLeft: 2388px`

### 表示状態

**修正後：**
- すべての要素が`visibility: visible`、`opacity: 1`で表示される
- スワイプでスクロールすると、すべての画像が表示されたまま移動する
- active/hiddenの切り替えによる非表示は発生しない

### UX改善：スクロール中の画像表示

**修正前の問題：**
- active/hiddenの切り替えにより、スクロール中はhidden要素が非表示
- スクロール終了後にJavaScriptがクラスを切り替えてから画像が表示される
- ユーザーはスクロール中に次の画像を確認できない

**修正後の改善：**
- すべての要素が常に表示状態のため、スクロール中も次の画像が見える
- スムーズで連続的なスクロール体験が実現される
- ユーザーはスクロール中に次の画像を確認できるため、操作性が大幅に向上

## 適用したCSS（最終版）

```css
/* すべての要素を常に表示状態にする（active/hiddenの切り替えをなくす） */
zoom-images .product__slide {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

/* offsetLeftを0から始めるようにjustify-contentをflex-startに変更 */
zoom-images {
  justify-content: flex-start !important;
  overflow-x: scroll !important;
  overflow-y: hidden !important;
  -webkit-overflow-scrolling: touch !important;
}
```

## 技術的な詳細

### offsetLeftの決定要因

`offsetLeft`は以下の要因で決まります：
1. 親要素の`padding-left`
2. 要素自身の`margin-left`
3. 前の兄弟要素の幅とマージン
4. **Flexboxの`justifyContent`による配置** ← 今回の修正ポイント
5. `scrollLeft`の値（スクロール可能な場合）

### justify-contentの影響

- `justify-content: center`: 子要素を中央に配置 → `offsetLeft`が負の値になる可能性
- `justify-content: flex-start`: 子要素を左端から配置 → `offsetLeft`が0から始まる

## 検証方法

修正後、以下を確認：
1. **offsetLeftが0から始まっているか**
   ```javascript
   const zoomImages = document.querySelector('zoom-images');
   const firstChild = zoomImages.firstElementChild;
   console.log(firstChild.offsetLeft); // 0であることを確認
   ```

2. **すべての要素が表示されているか**
   ```javascript
   const children = Array.from(zoomImages.children);
   children.forEach(child => {
     const style = window.getComputedStyle(child);
     console.log({
       visibility: style.visibility,  // "visible"
       opacity: style.opacity,         // "1"
       pointerEvents: style.pointerEvents // "auto"
     });
   });
   ```

3. **スワイプ機能が動作するか**
   - 画像をスワイプして、すべての画像が表示されたまま移動することを確認

## まとめ

`justify-content: center`を`flex-start`に変更することで、`offsetLeft`が0から始まるようになり、active要素が正しく画面内に表示されるようになりました。さらに、すべての要素を常に表示状態にすることで、以下の改善が実現されました：

1. **スワイプ時にすべての画像が表示されたまま移動する**
2. **スクロール中も次の画像が見える状態になり、スムーズなスクロール体験が実現される**
3. **active/hiddenの切り替えによる表示遅延がなくなり、リアルタイムで画像が表示される**

これにより、ユーザーはスクロール中に次の画像を確認できるため、操作性が大幅に向上しました。

## 修正日

2025年1月27日

