/* Brilliant Nodes: inquiry form and Discord copy button. The form sends nothing itself: it prepares an email
   to bn@brilliantnodes.com in the visitor's own email app (mailto), and offers to copy the message as a fallback.
   No requests, no storage. */
{
  const TO = 'bn@brilliantnodes.com', MAX = 1500;
  const copyText = text => {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((ok, fail) => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.className = 'sr-copy';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : fail(); } catch (e) { fail(e); }
      ta.remove();
    });
  };

  // Discord username copy
  document.querySelectorAll('.copy-handle').forEach(b => {
    const state = b.querySelector('.copy-state');
    b.addEventListener('click', () => {
      copyText(b.dataset.copy).then(() => { if (state) state.textContent = ' · copied'; },
        () => { if (state) state.textContent = ' · copy failed'; })
        .finally(() => setTimeout(() => { if (state) state.textContent = ' · copy'; }, 2200));
    });
  });

  const dlg = document.getElementById('inquiry-dlg');
  if (dlg && typeof dlg.showModal === 'function') {
    const form = document.getElementById('inq-form'), done = document.getElementById('inq-done');
    const err = document.getElementById('inq-err'), count = document.getElementById('inq-count'), copied = document.getElementById('inq-copied');
    const f = n => form.elements[n];
    let last = { subject: '', body: '' };
    const showForm = () => { done.hidden = true; form.hidden = false; err.textContent = ''; copied.textContent = ''; };
    const open = () => { showForm(); if (!dlg.open) dlg.showModal(); setTimeout(() => f('name').focus(), 30); };
    const close = () => { if (dlg.open) dlg.close(); };

    document.querySelectorAll('[data-contact]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); open(); }));
    dlg.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    document.getElementById('inq-back').addEventListener('click', () => { showForm(); f('msg').focus(); });

    const upd = () => { count.textContent = f('msg').value.length.toLocaleString('en-GB') + ' / ' + MAX.toLocaleString('en-GB'); };
    f('msg').addEventListener('input', upd); upd();
    form.addEventListener('input', e => { if (e.target.hasAttribute('aria-invalid')) { e.target.removeAttribute('aria-invalid'); err.textContent = ''; } });

    const clean = v => v.replace(/[\r\n]+/g, ' ').trim();
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = clean(f('name').value), email = clean(f('email').value), org = clean(f('org').value);
      const topic = f('topic').value, msg = f('msg').value.trim();
      let bad = null, why = '';
      if (!name) { bad = 'name'; why = 'Please add your name.'; }
      else if (!email || !f('email').checkValidity()) { bad = 'email'; why = 'Please add a valid email address, so we can reply.'; }
      else if (!msg) { bad = 'msg'; why = 'Please write your message.'; }
      ['name', 'email', 'msg'].forEach(n => f(n).toggleAttribute('aria-invalid', n === bad));
      if (bad) { err.textContent = why; f(bad).focus(); return; }
      err.textContent = '';
      const subject = 'Inquiry: ' + topic + ' (' + name + ')';
      const body = msg + '\n\n--\nName: ' + name + '\nEmail: ' + email + (org ? '\nOrganisation: ' + org : '') + '\nTopic: ' + topic + '\nSent from the form on brilliantnodes.com';
      last = { subject, body };
      window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      form.hidden = true; done.hidden = false;
      setTimeout(() => document.getElementById('inq-done-h').focus(), 30);
    });

    document.getElementById('inq-copy').addEventListener('click', () => {
      copyText('To: ' + TO + '\nSubject: ' + last.subject + '\n\n' + last.body)
        .then(() => { copied.textContent = 'Copied. Paste it into a new email to ' + TO + '.'; },
              () => { copied.textContent = 'Copying is blocked here. Please email ' + TO + ' directly.'; });
    });

    if (location.hash === '#inquiry') open();
  }
}
