
  // Flag <html> while any popup modal is open (see "Modal open" CSS).
  (function(){
    const SEL = '.modal-backdrop, .adm-modal-backdrop';
    const sync = () => {
      const open = !!document.querySelector('.modal-backdrop.open, .adm-modal-backdrop.adm-open');
      document.documentElement.classList.toggle('has-modal', open);
    };
    const mo = new MutationObserver(sync);
    document.querySelectorAll(SEL).forEach(el => mo.observe(el, { attributes:true, attributeFilter:['class'] }));
    sync();
  })();
