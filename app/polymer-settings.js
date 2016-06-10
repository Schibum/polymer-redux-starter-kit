window.Polymer = {lazyRegister: true, dom: 'shadow'};

// load webcomponents polyfills
(function() {
  if ('registerElement' in document
  && 'import' in document.createElement('link')
  && 'content' in document.createElement('template')) {
    // browser has web components
  } else {
    // polyfill web components
    var e = document.createElement('script');
    e.src = 'bower_components/webcomponentsjs/webcomponents-lite.min.js';
    document.head.appendChild(e);
  }
})();

// load pre-caching service worker
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', function() {
//     navigator.serviceWorker.register('/service-worker.js');
//   });
// }
