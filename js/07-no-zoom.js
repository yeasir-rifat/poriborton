
/* জুম বন্ধ: iOS Safari user-scalable=no মানে না, তাই পিঞ্চ ও ডাবল-ট্যাপ জুম আলাদাভাবে আটকানো হলো */
(function(){
  ['gesturestart','gesturechange','gestureend'].forEach(function(t){
    document.addEventListener(t, function(e){ e.preventDefault(); }, { passive:false });
  });
  document.addEventListener('touchmove', function(e){
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive:false });
  var last = 0;
  document.addEventListener('touchend', function(e){
    var now = Date.now();
    if (now - last <= 300) e.preventDefault();
    last = now;
  }, { passive:false });
  // Ctrl + স্ক্রল / Ctrl + (+/-) ডেস্কটপ জুম
  window.addEventListener('wheel', function(e){ if (e.ctrlKey) e.preventDefault(); }, { passive:false });
  window.addEventListener('keydown', function(e){
    if ((e.ctrlKey || e.metaKey) && ['+','-','=','0'].indexOf(e.key) > -1) e.preventDefault();
  });
})();
