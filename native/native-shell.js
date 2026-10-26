// Copied into www/ by tools/build-www.mjs. GitHub Pages does not load this file.
// The Capacitor WebView injects window.Capacitor before page scripts run.
(function () {
  var cap = window.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) return;
  if (typeof cap.registerPlugin !== 'function') return;

  var SystemBars = cap.registerPlugin('SystemBars');
  var SplashScreen = cap.registerPlugin('SplashScreen');

  // DARK is light status icons on the dark HUD. The bars stay visible.
  // viewport-fit=cover plus the safe-area CSS keeps the HUD off the notch.
  if (SystemBars && SystemBars.setStyle) {
    SystemBars.setStyle({ style: 'DARK' }).catch(function () {});
  }

  function hideSplash() {
    if (SplashScreen && SplashScreen.hide) SplashScreen.hide().catch(function () {});
  }

  if (document.readyState === 'complete') hideSplash();
  else window.addEventListener('load', hideSplash);
})();
