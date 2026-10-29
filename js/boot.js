/* Runs in <head>, before the page paints. Kept as a file (not inline) so the
   site can use a strict Content-Security-Policy. */
document.documentElement.classList.add('js');

// The long intro plays once per visit, on the home page; every other load
// shows the monogram straight away (so the first paint already shows the
// finished loader, with nothing popping in once the scripts arrive).
(function () {
  var quick = true;
  try {
    quick = !(/(^|\/)(index\.html)?$/.test(location.pathname) && !sessionStorage.getItem('shanaya-intro'));
  } catch (e) { /* storage blocked: keep it short */ }
  if (quick) document.documentElement.classList.add('ld-quick');
})();

// Product photos are optional: when a photo file is missing, remove it so the
// nail-art illustration underneath shows instead.
document.addEventListener('error', function (e) {
  var t = e.target;
  if (t && t.tagName === 'IMG' && t.hasAttribute('data-photo')) t.remove();
}, true);
