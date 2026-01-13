/**
 * 動的読み込み商品に対するカルーセル初期化処理
 * theme.jsのカルーセル初期化処理を、動的に追加された商品にも適用する
 */
(function() {
  'use strict';

  // 既に初期化済みのカルーセルを追跡
  const initializedGalleries = new WeakSet();

  /**
   * カルーセルを初期化する関数
   * theme.jsの初期化処理と同じロジックを使用
   */
  function initializeCarousel(gal) {
    // 既に初期化済みの場合はスキップ
    if (initializedGalleries.has(gal)) {
      return;
    }

    const track = gal.querySelector('[data-track]');
    if (!track) return;

    const slides = gal.querySelectorAll('.card-gallery__img');
    const dotsWrap = gal.querySelector('[data-dots]');
    const count = slides.length;

    if (count <= 1) {
      initializedGalleries.add(gal);
      return;
    }

    let index = 0;

    // デバイスの種類を判定
    const isTouchEnv = window.matchMedia?.('(hover: none)').matches || 'ontouchstart' in window;

    // 画像幅を整数値で設定する関数
    const applyIntegerWidth = () => {
      const imageWidth = Math.round(gal.clientWidth);
      if (Number.isFinite(imageWidth) && imageWidth > 0) {
        track.style.width = `${imageWidth * count}px`;
        slides.forEach(slide => {
          slide.style.width = `${imageWidth}px`;
          slide.style.flex = `0 0 ${imageWidth}px`;
        });
      }
      return imageWidth;
    };

    // 幅を再同期する関数
    const resyncWidths = () => {
      requestAnimationFrame(() => {
        applyIntegerWidth();
        setActive(index);
        requestAnimationFrame(() => {
          applyIntegerWidth();
          setActive(index);
        });
      });
    };

    // ドットを生成（PCではCSSで非表示）
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('i');
        if (i === 0) dot.classList.add('is-active');
        dotsWrap.appendChild(dot);
      }
    }

    // アクティブなスライドを設定
    const setActive = (i) => {
      const imageWidth = Math.round(gal.clientWidth);
      track.style.transform = `translateX(-${i * imageWidth}px)`;
      if (!dotsWrap) return;
      [...dotsWrap.children].forEach((d, di) => d.classList.toggle('is-active', di === i));
    };

    // 初期化
    resyncWidths();

    // PC画面ではスワイプ機能を無効化
    if (!isTouchEnv) {
      track.style.transform = 'translateX(0)';
      initializedGalleries.add(gal);
      return;
    }

    // スワイプイベントハンドラ
    let startX = 0, curX = 0, dragging = false;

    const onStart = (e) => {
      dragging = true;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      track.style.transition = 'none';
      curX = startX;
    };

    const onMove = (e) => {
      if (!dragging) return;
      curX = (e.touches ? e.touches[0].clientX : e.clientX);
      const dx = curX - startX;
      const imageWidth = Math.round(gal.clientWidth);
      const base = -index * imageWidth;
      track.style.transform = `translateX(${base + dx}px)`;
    };

    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      const dx = curX - startX;
      const imageWidth = Math.round(gal.clientWidth);
      const threshold = imageWidth * 0.18;
      if (dx < -threshold && index < count - 1) index++;
      if (dx > threshold && index > 0) index--;
      track.style.transition = '';
      setActive(index);
    };

    // イベントリスナーを追加
    track.addEventListener('touchstart', onStart, {passive: true});
    track.addEventListener('touchmove', onMove, {passive: true});
    track.addEventListener('touchend', onEnd, {passive: true});

    // リサイズ時に再計算
    window.addEventListener('resize', resyncWidths);

    // 画像の読み込み完了時に再計算
    slides.forEach(img => {
      img.addEventListener('load', resyncWidths, { once: true });
    });

    // 初期化済みとしてマーク
    initializedGalleries.add(gal);
  }

  /**
   * 既存のカルーセルを初期化
   */
  function initializeExistingGalleries() {
    const galleries = document.querySelectorAll('[data-gallery]');
    galleries.forEach(gal => {
      if (!initializedGalleries.has(gal)) {
        initializeCarousel(gal);
      }
    });
  }

  /**
   * MutationObserverで動的に追加された要素を監視
   */
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // 追加されたノードが[data-gallery]要素の場合
          if (node.nodeType === 1 && node.matches && node.matches('[data-gallery]')) {
            // 少し待ってから初期化（DOMが完全に構築されるまで待つ）
            setTimeout(() => {
              initializeCarousel(node);
            }, 0);
          }
          // 追加されたノードの子要素に[data-gallery]要素がある場合
          else if (node.nodeType === 1 && node.querySelectorAll) {
            const galleries = node.querySelectorAll('[data-gallery]');
            galleries.forEach(gal => {
              if (!initializedGalleries.has(gal)) {
                setTimeout(() => {
                  initializeCarousel(gal);
                }, 0);
              }
            });
          }
        });
      });
    });

    // document.bodyを監視
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // DOMContentLoaded時に既存のカルーセルを初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeExistingGalleries();
      setupMutationObserver();
    });
  } else {
    initializeExistingGalleries();
    setupMutationObserver();
  }

  // 手動で再実行できるようにグローバル関数として公開
  window.initializeDynamicCarousels = initializeExistingGalleries;

  console.log('💡 動的読み込み商品カルーセル初期化コードがロードされました。手動で再実行する場合は: initializeDynamicCarousels()');
})();
