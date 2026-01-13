# Grid列幅整数化 - 必要な対応レポート

## 調査日
2026年1月13日

## 目的
どの環境でも整数化を実現するため、配布されているCSS/JSファイルのどの部分をどう変更する必要があるかを明確にする。

## 問題の根本原因

### 1. CSS Gridの自動計算による小数値の発生
CSS Gridエンジンが自動的に列幅を計算する際、以下の計算式で小数値が発生する：
```
列幅 = (Grid幅 - Gap × (列数 - 1)) / 列数
```
この計算結果が小数値になる場合、CSS Gridエンジンは小数値の列幅を適用する。

### 2. JavaScriptでの移動量計算が小数値を使用
カルーセルの移動量計算で、`clientWidth`や`offsetWidth`などの小数値が含まれる可能性がある値を直接使用している。

### 3. Flexboxのレンダリング精度による位置のずれ
Flexboxで画像を配置する際、レンダリング精度の問題により、画像の位置が小数値でずれる。

## 修正が必要なファイルと箇所

### ファイル1: `theme.css`（または該当するCSSファイル）

#### 修正箇所1: Grid列幅の計算方法

**現在のコード構造:**
```css
.grid {
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  gap: var(--gap);
}
```

**問題点:**
- `minmax(0, 1fr)`により、CSS Gridエンジンが自動的に列幅を計算する
- 計算結果が小数値になる場合、小数値の列幅が適用される

**修正後のコード:**
```css
.grid {
  grid-template-columns: repeat(var(--columns), var(--column-width-integer, minmax(0, 1fr)));
  gap: var(--gap-adjusted, var(--gap));
}
```

**変更内容:**
- `grid-template-columns`で、`--column-width-integer`というCSS変数を使用するように変更
- `gap`で、`--gap-adjusted`というCSS変数を使用するように変更
- これらのCSS変数は、JavaScriptで整数値として計算して設定される

**理由:**
- CSS Gridエンジンの自動計算を回避し、JavaScriptで事前に計算した整数値を使用する
- フォールバックとして`minmax(0, 1fr)`を指定することで、CSS変数が設定されていない場合でも動作する

#### 修正箇所2: 親要素（grid-outer）の幅の制御

**現在のコード構造:**
```css
.grid-outer {
  /* 幅の設定がない、または自動計算 */
}
```

**問題点:**
- 親要素の幅が小数値になる場合がある
- 親要素の幅が小数値だと、Grid幅の計算も小数値になる

**修正後のコード:**
```css
.grid-outer {
  /* JavaScriptで整数値に設定される */
  /* または、CSSで整数値に設定 */
  width: var(--grid-outer-width-integer, auto);
}
```

**変更内容:**
- `--grid-outer-width-integer`というCSS変数を使用する
- このCSS変数は、JavaScriptで整数値として計算して設定される

**理由:**
- 親要素の幅を整数値にすることで、Grid幅の計算も整数値になる

### ファイル2: `theme.js`（または該当するJavaScriptファイル）

#### 修正箇所1: Grid列幅の整数化処理の追加

**現在のコード構造:**
```javascript
// Grid列幅の計算はCSS Gridエンジンに任せている
// JavaScriptでの明示的な計算がない
```

**問題点:**
- Grid列幅の計算がCSS Gridエンジンに任せられている
- JavaScriptで整数化処理がない

**修正後のコード:**
```javascript
function calculateIntegerGridColumns(grid) {
  const computedStyle = window.getComputedStyle(grid);
  const gridWidth = grid.clientWidth;
  const gap = parseFloat(computedStyle.gap) || 0;
  const columns = parseInt(computedStyle.getPropertyValue('--columns')) || 0;
  
  if (columns === 0 || gridWidth === 0) {
    return { success: false };
  }
  
  // 親要素の幅を取得（Grid幅の上限として使用）
  const parent = grid.parentElement;
  let parentWidth = parent ? parent.clientWidth : gridWidth;
  
  // 親要素の幅を整数値に切り上げ
  if (parent && parent.classList.contains('grid-outer')) {
    const targetParentWidth = Math.ceil(parentWidth);
    parent.style.width = `${targetParentWidth}px`;
    parentWidth = targetParentWidth;
  }
  
  const maxGridWidth = Math.floor(parentWidth);
  
  // 計算過程1: 目標列幅を整数値で決定（切り上げ）
  const currentColumnWidth = (gridWidth - gap * (columns - 1)) / columns;
  const targetColumnWidth = Math.ceil(currentColumnWidth);
  
  // 計算過程2: Gapを整数値で調整（四捨五入）
  let targetGap = Math.round((gridWidth - targetColumnWidth * columns) / (columns - 1));
  
  // 計算過程3: Grid幅を計算し、親要素の幅以下に制限
  let calculatedGridWidth = targetColumnWidth * columns + targetGap * (columns - 1);
  
  if (calculatedGridWidth > maxGridWidth) {
    targetGap = Math.floor((maxGridWidth - targetColumnWidth * columns) / (columns - 1));
    calculatedGridWidth = targetColumnWidth * columns + targetGap * (columns - 1);
  }
  
  // 計算過程4: CSS変数に設定（これにより、CSS Gridエンジンが整数値で計算する）
  grid.style.setProperty('--column-width-integer', `${targetColumnWidth}px`);
  grid.style.setProperty('--gap-adjusted', `${targetGap}px`);
  
  // Grid幅を設定（親要素の幅以下に制限）
  grid.style.width = `${calculatedGridWidth}px`;
  
  // Gapを直接設定
  grid.style.gap = `${targetGap}px`;
  
  return {
    success: true,
    columnWidth: targetColumnWidth,
    gap: targetGap,
    gridWidth: calculatedGridWidth
  };
}
```

**変更内容:**
- Grid列幅をJavaScriptで事前に整数値で計算する
- 計算結果をCSS変数として設定する
- 親要素の幅も整数値に切り上げる

**理由:**
- CSS Gridエンジンの自動計算を回避し、JavaScriptで整数値のみを使用する
- 計算過程をすべて整数値で行うことで、どの環境でも整数値になる

#### 修正箇所2: カルーセルの移動量計算の修正

**現在のコード構造:**
```javascript
const onMove = (e) => {
  if (!dragging) return;
  curX = (e.touches ? e.touches[0].clientX : e.clientX);
  const dx = curX - startX;
  const base = -index * gal.clientWidth;  // ← 問題: clientWidthが小数値の可能性
  track.style.transform = `translateX(${base + dx}px)`;
};

const onEnd = () => {
  if (!dragging) return;
  dragging = false;
  const dx = curX - startX;
  const threshold = gal.clientWidth * 0.18;  // ← 問題: clientWidthが小数値の可能性
  if (dx < -threshold && index < count - 1) index++;
  if (dx >  threshold && index > 0)       index--;
  track.style.transition = '';
  setActive(index);
};

const setActive = (i) => {
  track.style.transform = `translateX(-${i * 100}%)`;  // ← パーセンテージベース
  // または
  // track.style.transform = `translateX(-${i * gal.clientWidth}px)`;  // ← ピクセル値だが小数値の可能性
};
```

**問題点:**
- `gal.clientWidth`が小数値になる可能性がある
- パーセンテージベースの場合、計算結果が小数値になる可能性がある
- 移動量が小数値だと、画像の位置も小数値になる

**修正後のコード:**
```javascript
const onMove = (e) => {
  if (!dragging) return;
  curX = (e.touches ? e.touches[0].clientX : e.clientX);
  const dx = curX - startX;
  // 整数値の画像幅を取得（CSS変数から、または計算）
  const imageWidth = parseInt(gal.style.getPropertyValue('--image-width-integer')) || 
                     Math.ceil(gal.clientWidth);
  const base = -index * imageWidth;  // ← 整数値のみを使用
  track.style.transform = `translateX(${base + dx}px)`;
};

const onEnd = () => {
  if (!dragging) return;
  dragging = false;
  const dx = curX - startX;
  // 整数値の画像幅を取得
  const imageWidth = parseInt(gal.style.getPropertyValue('--image-width-integer')) || 
                     Math.ceil(gal.clientWidth);
  const threshold = imageWidth * 0.18;  // ← 整数値のみを使用
  if (dx < -threshold && index < count - 1) index++;
  if (dx >  threshold && index > 0)       index--;
  track.style.transition = '';
  setActive(index);
};

const setActive = (i) => {
  // 整数値の画像幅を取得
  const imageWidth = parseInt(gal.style.getPropertyValue('--image-width-integer')) || 
                     Math.ceil(gal.clientWidth);
  track.style.transform = `translateX(-${i * imageWidth}px)`;  // ← 整数値のみを使用
};
```

**変更内容:**
- `gal.clientWidth`を直接使用せず、整数値に変換してから使用する
- CSS変数`--image-width-integer`から整数値を取得する（設定されている場合）
- 設定されていない場合は、`Math.ceil(gal.clientWidth)`で整数値に変換する

**理由:**
- 移動量を整数値で計算することで、画像の位置も整数値になる
- CSS変数を使用することで、Grid列幅の整数化と連携できる

#### 修正箇所3: カルーセルの画像サイズと位置の整数化処理の追加

**現在のコード構造:**
```javascript
// カルーセルの画像サイズと位置の整数化処理がない
// CSS Gridの列幅に依存している
```

**問題点:**
- カルーセルの画像サイズがCSS Gridの列幅に依存している
- 列幅が小数値だと、画像サイズも小数値になる
- 画像の位置がFlexboxのレンダリング精度により小数値でずれる

**修正後のコード:**
```javascript
function adjustGalleryForIntegerWidth(gallery) {
  const grid = gallery.closest('.grid');
  if (!grid) return;
  
  const gridComputedStyle = window.getComputedStyle(grid);
  const gridWidth = grid.clientWidth;
  const gap = parseFloat(gridComputedStyle.gap) || 0;
  const columnCount = parseInt(gridComputedStyle.getPropertyValue('--columns')) || 0;
  
  if (columnCount === 0) return;
  
  // 整数化された列幅を取得（CSS変数から、または計算）
  const columnWidthInteger = parseFloat(gridComputedStyle.getPropertyValue('--column-width-integer'));
  const imageWidth = columnWidthInteger || Math.ceil((gridWidth - gap * (columnCount - 1)) / columnCount);
  
  // CSS変数に設定（移動量計算で使用）
  gallery.style.setProperty('--image-width-integer', `${imageWidth}px`);
  
  const track = gallery.querySelector('.card-gallery__track');
  const images = gallery.querySelectorAll('.card-gallery__img, img');
  
  if (track && images.length > 0) {
    // 現在のtransformを取得して整数値に丸める
    const trackStyle = window.getComputedStyle(track);
    let currentTranslateX = 0;
    if (trackStyle.transform && trackStyle.transform !== 'none') {
      const matrixMatch = trackStyle.transform.match(/matrix\(([^)]+)\)/);
      if (matrixMatch) {
        const values = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length >= 6) {
          currentTranslateX = values[4];
        }
      }
    }
    
    const roundedTranslateX = Math.round(currentTranslateX);
    
    // 画像の幅を整数値に設定
    images.forEach((img) => {
      img.style.width = `${imageWidth}px`;
      img.style.flex = `0 0 ${imageWidth}px`;
      img.style.flexBasis = `${imageWidth}px`;
      img.style.minWidth = `${imageWidth}px`;
      img.style.maxWidth = `${imageWidth}px`;
    });
    
    // トラックの幅を整数値で設定
    track.style.width = `${imageWidth * images.length}px`;
    
    // transformを整数値に設定
    track.style.transform = `translateX(${roundedTranslateX}px)`;
    
    // 画像の位置を整数値に調整（marginLeftを使用）
    images.forEach((img, index) => {
      const imgRect = img.getBoundingClientRect();
      const galleryRect = gallery.getBoundingClientRect();
      const imgLeft = imgRect.left - galleryRect.left;
      const expectedLeft = index * imageWidth;
      const difference = expectedLeft - imgLeft;
      
      // 位置がずれている場合は調整
      if (Math.abs(difference) > 0.001) {
        img.style.marginLeft = `${difference}px`;
      }
    });
  }
  
  return { imageWidth: imageWidth };
}
```

**変更内容:**
- カルーセルの画像サイズを整数値に設定する
- 画像の位置を整数値に調整する（`marginLeft`を使用）
- transformの値を整数値に保つ
- CSS変数`--image-width-integer`を設定して、移動量計算で使用できるようにする

**理由:**
- 画像のサイズと位置を整数値にすることで、どの環境でも整数値になる
- `marginLeft`を使用して、Flexboxのレンダリング精度の問題を回避する

#### 修正箇所4: 初期化処理の追加

**現在のコード構造:**
```javascript
// Grid列幅の整数化処理の初期化がない
// カルーセルの整数化処理の初期化がない
```

**問題点:**
- ページ読み込み時に整数化処理が実行されない
- リサイズ時に整数化処理が再実行されない

**修正後のコード:**
```javascript
// DOMContentLoaded時に実行
document.addEventListener('DOMContentLoaded', function() {
  initializeIntegerGridColumns();
});

// リサイズ時にも実行
let resizeTimeout;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(initializeIntegerGridColumns, 100);
});

// 動的に追加されたGrid要素にも対応
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          if (node.matches && node.matches('.grid')) {
            calculateIntegerGridColumns(node);
          }
          if (node.querySelectorAll) {
            const grids = node.querySelectorAll('.grid');
            grids.forEach(function(grid) {
              calculateIntegerGridColumns(grid);
            });
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function initializeIntegerGridColumns() {
  const grids = document.querySelectorAll('.collection__products .grid, .template-collection .grid, .grid');
  
  grids.forEach((grid) => {
    // 親要素の整数化
    const parent = grid.parentElement;
    if (parent && parent.classList.contains('grid-outer')) {
      const parentWidth = parent.clientWidth;
      const targetParentWidth = Math.ceil(parentWidth);
      parent.style.width = `${targetParentWidth}px`;
    }
    
    // Grid列幅の整数化
    calculateIntegerGridColumns(grid);
    
    // カルーセルの整数化
    const galleries = grid.querySelectorAll('.product-item__image.card-gallery.my-card-gallery');
    galleries.forEach((gallery) => {
      adjustGalleryForIntegerWidth(gallery);
    });
  });
}
```

**変更内容:**
- ページ読み込み時に整数化処理を実行する
- リサイズ時に整数化処理を再実行する
- 動的に追加されたGrid要素にも対応する

**理由:**
- どの環境でも、どのタイミングでも整数化処理が実行されるようにする

## 実装の優先順位

### 優先度: 高
1. **`theme.js` - Grid列幅の整数化処理の追加**
   - CSS Gridエンジンの自動計算を回避する
   - すべての計算の基礎となる

2. **`theme.css` - Grid列幅の計算方法の変更**
   - CSS変数を使用するように変更
   - JavaScriptで計算した整数値を使用する

3. **`theme.js` - 親要素（grid-outer）の幅の整数化**
   - Grid幅の計算に直接影響
   - 最初に実行する必要がある

### 優先度: 中
4. **`theme.js` - カルーセルの移動量計算の修正**
   - 移動量を整数値で計算する
   - 画像の位置のずれを防ぐ

5. **`theme.js` - カルーセルの画像サイズと位置の整数化処理の追加**
   - 画像のサイズと位置を整数値に保証する
   - Flexboxのレンダリング精度の問題を回避する

### 優先度: 低
6. **`theme.js` - 初期化処理の追加**
   - ページ読み込み時、リサイズ時、動的要素追加時に実行
   - どの環境でも動作するようにする

## 実装の注意点

### 1. 実行順序
1. 親要素の幅を整数化（最初に実行）
2. Grid列幅を整数化（親要素の幅を整数化した後に実行）
3. Grid幅を親要素の幅以下に制限
4. カルーセルの幅を整数化
5. 画像の位置を整数化（最後に実行）

### 2. CSS変数の使用
- `--column-width-integer`: Grid列幅の整数値
- `--gap-adjusted`: Gapの整数値
- `--image-width-integer`: カルーセル画像幅の整数値
- これらのCSS変数は、JavaScriptで計算して設定する

### 3. フォールバック
- CSS変数が設定されていない場合でも動作するように、フォールバックを用意する
- 例: `var(--column-width-integer, minmax(0, 1fr))`

### 4. パフォーマンス
- リサイズ時の再実行は、`setTimeout`でデバウンスする
- `MutationObserver`は必要な場合のみ使用する

## まとめ

整数化のために必要な対応は以下の通りです：

1. **`theme.css`の変更**
   - `grid-template-columns`でCSS変数`--column-width-integer`を使用
   - `gap`でCSS変数`--gap-adjusted`を使用

2. **`theme.js`の変更**
   - Grid列幅の整数化処理を追加
   - 親要素の幅の整数化処理を追加
   - カルーセルの移動量計算を整数値で行うように修正
   - カルーセルの画像サイズと位置の整数化処理を追加
   - 初期化処理を追加

これらの変更を実装することで、どの環境でもすべての値が整数値になり、小数値による表示の問題を解決できます。
