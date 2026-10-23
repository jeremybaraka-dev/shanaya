/* Runs in <head>, before the page paints. Kept as a file (not inline) so the
   site can use a strict Content-Security-Policy. */
document.documentElement.classList.add('js');

// Product photos are optional: when a photo file is missing, remove it so the
// nail-art illustration underneath shows instead.
document.addEventListener('error', function (e) {
  var t = e.target;
  if (t && t.tagName === 'IMG' && t.hasAttribute('data-photo')) t.remove();
}, true);
