/* Plain Kit signup. Posts the same fields as the HTML form.
   A failed send leaves the form in place so Replay and the book link stay usable. */
(function(){
  function showThanks(form){
    var fields = form.querySelector('.kitFields');
    var lead = form.querySelector('.kitLead');
    var fine = form.querySelector('.kitFine');
    var note = form.querySelector('.kitThanks');
    if (fields) fields.hidden = true;
    if (lead) lead.hidden = true;
    if (fine) fine.hidden = true;
    if (note) note.hidden = false;
  }
  function showRetry(form){
    var btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = false;
    var fine = form.querySelector('.kitFine');
    if (fine) fine.textContent = 'Could not send just now. Try again in a moment.';
  }
  document.querySelectorAll('form.kitForm').forEach(function(form){
    form.addEventListener('submit', function(ev){
      if (!window.fetch || !window.URLSearchParams || !window.FormData) return;
      ev.preventDefault();
      var email = form.querySelector('[name="email_address"]');
      if (!email || !email.value) return;
      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      var body = new URLSearchParams(new FormData(form));
      fetch(form.action, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }).then(function(){ showThanks(form); }).catch(function(){ showRetry(form); });
    });
  });
  var lore = document.getElementById('loreLink');
  var titleKit = document.getElementById('titleKit');
  if (lore && titleKit){
    lore.addEventListener('click', function(){
      var open = titleKit.hidden;
      titleKit.hidden = !open;
      lore.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();
