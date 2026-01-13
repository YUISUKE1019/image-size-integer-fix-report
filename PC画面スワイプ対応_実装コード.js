/**
 * PC画面でもスワイプ操作を可能にするコード
 * 
 * 使用方法:
 * 1. ブラウザの開発者ツール（F12）を開く
 * 2. Consoleタブを選択
 * 3. 以下のコードをコピー＆ペーストしてEnterキーを押す
 * 
 * または、theme.jsに追加して配布する
 */

(function() {
  'use strict';
  
  /**
   * PC画面でもスワイプ操作を可能にする
   * マウスイベント（mousedown, mousemove, mouseup）を追加
   */
  function enableMouseSwipeForGalleries() {
    const galleries = document.querySelectorAll('.product-item__image.card-gallery.my-card-gallery');
    
    galleries.forEach((gallery) => {
      const track = gallery.querySelector('.card-gallery__track');
      if (!track) return;
      
      let dragging = false;
      let startX = 0;
      let curX = 0;
      let index = 0;
      const images = gallery.querySelectorAll('.card-gallery__img, img');
      const count = images.length;
      
      if (count <= 1) return; // 画像が1枚以下の場合はスワイプ不要
      
      // 整数値の画像幅を取得
      function getImageWidth() {
        const imageWidthInteger = gallery.style.getPropertyValue('--image-width-integer');
        if (imageWidthInteger) {
          return parseInt(imageWidthInteger);
        }
        return Math.ceil(gallery.clientWidth);
      }
      
      // アクティブな画像を設定
      function setActive(i) {
        index = Math.max(0, Math.min(i, count - 1));
        const imageWidth = getImageWidth();
        track.style.transition = 'transform 0.3s';
        track.style.transform = `translateX(-${index * imageWidth}px)`;
      }
      
      // マウスダウン（ドラッグ開始）
      function onMouseDown(e) {
        // 左クリックのみ（右クリックや中クリックは無視）
        if (e.button !== 0) return;
        
        dragging = true;
        startX = e.clientX;
        curX = e.clientX;
        track.style.transition = '';
        
        // テキスト選択を防ぐ
        e.preventDefault();
        
        // カーソルを変更
        gallery.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      
      // マウスムーブ（ドラッグ中）
      function onMouseMove(e) {
        if (!dragging) return;
        
        curX = e.clientX;
        const dx = curX - startX;
        const imageWidth = getImageWidth();
        const base = -index * imageWidth;
        track.style.transform = `translateX(${base + dx}px)`;
        
        // テキスト選択を防ぐ
        e.preventDefault();
      }
      
      // マウスアップ（ドラッグ終了）
      function onMouseUp(e) {
        if (!dragging) return;
        
        dragging = false;
        const dx = curX - startX;
        const imageWidth = getImageWidth();
        const threshold = imageWidth * 0.18;
        
        if (dx < -threshold && index < count - 1) index++;
        if (dx > threshold && index > 0) index--;
        
        setActive(index);
        
        // カーソルを元に戻す
        gallery.style.cursor = '';
        document.body.style.userSelect = '';
      }
      
      // マウスが要素の外に出た場合（ドラッグ終了）
      function onMouseLeave(e) {
        if (dragging) {
          onMouseUp(e);
        }
      }
      
      // イベントリスナーを追加
      gallery.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      gallery.addEventListener('mouseleave', onMouseLeave);
      
      // 初期状態を設定
      setActive(0);
    });
  }
  
  // DOMContentLoaded時に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableMouseSwipeForGalleries);
  } else {
    enableMouseSwipeForGalleries();
  }
  
  // 動的に追加されたカルーセルにも対応
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.matches && node.matches('.product-item__image.card-gallery.my-card-gallery')) {
              enableMouseSwipeForGalleries();
            }
            if (node.querySelectorAll) {
              const galleries = node.querySelectorAll('.product-item__image.card-gallery.my-card-gallery');
              if (galleries.length > 0) {
                enableMouseSwipeForGalleries();
              }
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
  
  // グローバル関数として公開（必要に応じて手動実行可能）
  window.enableMouseSwipeForGalleries = enableMouseSwipeForGalleries;
  
  console.log('✅ PC画面でもスワイプ操作を有効にしました');
  console.log('💡 手動で再実行する場合は: enableMouseSwipeForGalleries()');
})();
