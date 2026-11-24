/* Brilliant Nodes: try-it panels. They apply the published payout rules of RigSettle and ClaimEscrow
   (see each repository's README) to fixed example terms, in the browser. No requests, no storage. */
{
  const $ = id => document.getElementById(id);
  const gen = v => (Math.round(v * 10000) / 10000).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' GEN';
  const usd = v => '$' + Math.round(v).toLocaleString('en-GB');
  const bars = (s, b, frac) => { s.style.width = (frac * 100).toFixed(2) + '%'; b.style.width = ((1 - frac) * 100).toFixed(2) + '%'; };

  /* RigSettle: S1 cap per slot, S2 pro rata, G1 grace 3% (default), Z1 no-show; payout = share x (price + bond) */
  const rig = $('demo-rig');
  if (rig) {
    const RATE = 10, SLOTS = 12, PRICE = 10, BOND = 2, GRACE_BP = 300;
    const rate = $('rig-rate'), off = $('rig-off'), noshow = $('rig-noshow'), slots = $('rig-slots');
    slots.innerHTML = Array.from({ length: SLOTS }, () => '<span><i></i><em></em></span>').join('');
    const cells = Array.from(slots.children);
    const run = () => {
      const d = parseFloat(rate.value), h = parseInt(off.value, 10), ns = noshow.checked;
      rate.disabled = off.disabled = ns;
      $('rig-rate-o').textContent = d.toFixed(1) + ' GH/s';
      $('rig-off-o').textContent = h + (h === 1 ? ' hour' : ' hours');
      let counted = 0;
      cells.forEach((c, i) => {
        const v = ns || i >= SLOTS - h ? 0 : d, k = Math.min(v, RATE);
        counted += k;
        c.firstChild.style.height = (k / 12 * 100) + '%';
        c.lastChild.style.height = (Math.max(0, v - RATE) / 12 * 100) + '%';
      });
      const rawBp = Math.floor(counted / (RATE * SLOTS) * 10000 + 1e-9);
      let bp = rawBp, rule;
      if (ns) { bp = 0; rule = 'Rule Z1, no-show: the pool page shows no such rig, so nothing was delivered.'; }
      else if (rawBp >= 10000) rule = d > RATE
        ? 'Rule S1, cap: each hour counts at most the 10 GH/s rented. Extra hashrate is never billed. Delivered in full.'
        : 'Delivered in full: every hour at the rented rate.';
      else if (rawBp >= 10000 - GRACE_BP) { bp = 10000; rule = 'Rule G1, grace: ' + (rawBp / 100).toFixed(2) + '% is within the 3% allowed for pool estimates, so it counts as full delivery.'; }
      else rule = 'Rule S2, pro rata: ' + (rawBp / 100).toFixed(2) + '% of the rented hashrate was delivered, so the escrow splits in that proportion.';
      const seller = (PRICE + BOND) * bp / 10000;
      $('rig-rule').textContent = rule;
      $('rig-seller').textContent = gen(seller);
      $('rig-buyer').textContent = gen(PRICE + BOND - seller);
      bars($('rig-bar-s'), $('rig-bar-b'), bp / 10000);
    };
    rig.addEventListener('input', run);
    rig.addEventListener('submit', e => e.preventDefault());
    run();
  }

  /* ClaimEscrow: seller gets the upfront at the transfer; at the decision, the price for the allowed amount
     less what it already received, never below zero; released money is never taken back (a shortfall). */
  const claim = $('demo-claim');
  if (claim) {
    const FACE = 1000000, RATE = 0.6, PER_GEN = 500000, PRICE = FACE * RATE / PER_GEN;
    const up = $('claim-up'), al = $('claim-al');
    const run = () => {
      const u = parseInt(up.value, 10) / 100, a = parseInt(al.value, 10) / 100;
      $('claim-up-o').textContent = Math.round(u * 100) + '%';
      $('claim-al-o').textContent = a === 0 ? 'disallowed' : a === 1 ? 'allowed in full' : 'allowed at ' + Math.round(a * 100) + '%';
      const upfront = PRICE * u, due = PRICE * a, seller = Math.max(upfront, due), shortfall = Math.max(0, upfront - due);
      let rule;
      if (a === 0) rule = 'Disallowed: the seller keeps the ' + gen(upfront) + ' released at the transfer, and the rest goes back to the buyer.';
      else if (shortfall > 0) rule = 'The price for ' + usd(FACE * a) + ' is ' + gen(due) + ', but ' + gen(upfront) + ' was already released at the transfer. Released money is never taken back, so the ' + gen(shortfall) + ' gap is recorded as a shortfall.';
      else rule = 'Allowed at ' + usd(FACE * a) + ': the seller is paid 60% of that, ' + gen(due) + ', counting the ' + gen(upfront) + ' released at the transfer.';
      $('claim-rule').textContent = rule;
      $('claim-seller').textContent = gen(seller) + ' (' + usd(seller * PER_GEN) + ')';
      $('claim-buyer').textContent = gen(PRICE - seller) + ' (' + usd((PRICE - seller) * PER_GEN) + ')';
      bars($('claim-bar-s'), $('claim-bar-b'), seller / PRICE);
    };
    claim.addEventListener('input', run);
    claim.addEventListener('submit', e => e.preventDefault());
    run();
  }
}
