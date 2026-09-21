/* Sump prospect site — Keyman Intelligence. Static; data from data/data.js; CRM in localStorage only. */
(function () {
'use strict';
const D = window.SUMP_DATA;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Math.round(n || 0).toLocaleString('en-US');
const PROJ = Object.fromEntries(D.projects.map(p => [p.id, p]));
const PRIME = Object.fromEntries(D.primes.map(p => [p.name, p]));
const TODAY = '2026-09-21';

/* ---------------- storage (localStorage, fail-safe) ---------------- */
const KEY = 'keyman-sump-crm-v1';
let STORE = { primes: {}, profile: {} };
try { const raw = localStorage.getItem(KEY); if (raw) STORE = Object.assign(STORE, JSON.parse(raw)); } catch (e) { /* private mode: run without persistence */ }
const save = () => { try { STORE.updated = new Date().toISOString(); localStorage.setItem(KEY, JSON.stringify(STORE)); return true; } catch (e) { return false; } };
const STATUSES = ['NOT CONTACTED', 'RESEARCHING', 'READY TO CONTACT', 'CONTACTED', 'FOLLOW-UP 1', 'FOLLOW-UP 2', 'REPLIED', 'INTERESTED', 'NOT A FIT', 'NO RESPONSE', 'CONVERTED'];
const STCLS = { 'RESEARCHING': 's-blue', 'READY TO CONTACT': 's-blue', 'CONTACTED': 's-amber', 'FOLLOW-UP 1': 's-amber', 'FOLLOW-UP 2': 's-amber', 'REPLIED': 's-green', 'INTERESTED': 's-green', 'NOT A FIT': 's-red', 'CONVERTED': 's-win' };
const crm = name => STORE.primes[name] || {};
const status = name => crm(name).status || 'NOT CONTACTED';
const stPill = name => `<span class="st-pill ${STCLS[status(name)] || ''}">${esc(status(name))}</span>`;
function setCrm(name, patch) { STORE.primes[name] = Object.assign({}, crm(name), patch, { updated: new Date().toISOString() }); const ok = save(); refreshStatusViews(); return ok; }

/* ---------------- labels ---------------- */
const SIG = {
  'VERIFIED PHOTO SUBAWARD': '<span class="ev fact">Photo subaward &middot; verified</span>',
  'PHOTOGRAPHY SIGNAL': '<span class="ev verify">Photo signal &middot; analytical</span>',
  'LOW SIGNAL': '<span class="pill grey">Low signal &middot; analytical</span>'
};
const evid = p => '<span class="ev fact">Project verified</span> ' + (p.signal === 'VERIFIED PHOTO SUBAWARD' ? '<span class="pill grey">Current need unverified</span>' : '<span class="pill grey">Photo need unverified</span>');
const tags = a => '<div class=tagrow>' + a.map(t => `<span class="tag${t === 'AERIAL / DRONE' ? ' drone' : ''}">${esc(t)}</span>`).join('') + '</div>';
const vendorLink = pr => (pr.links || []).find(l => l.kind.startsWith('SUB')) || (pr.links || [])[0];
function reachCell(prName) {
  const pr = PRIME[prName]; const l = pr && vendorLink(pr);
  if (!l) return pr && pr.how ? '<span class=faint>No official site found</span>' : '<span class=faint>Not yet researched</span>';
  return `<a href="${esc(l.url)}" target=_blank rel=noopener onclick="event.stopPropagation()">${l.kind.startsWith('SUB') ? 'Vendor registration' : 'Company site'}</a>${pr.howConfidence === 'UNCONFIRMED' ? ' <span class="pill amber">match unconfirmed</span>' : ''}`;
}
function why(p) {
  if (p.signal === 'VERIFIED PHOTO SUBAWARD') return `The prime reported a $52,500 photography subcontract to BamaView LLC ("superior photographic documentation") on this project &mdash; the only verified construction photography subcontract in the Alabama data. The project is in close-out (current end ${esc(p.end)}), so treat it as proof that construction managers buy this service, not as an open opening.`;
  if (p.signal === 'LOW SIGNAL') return `Active federal ${esc(p.kindWord)} work (${money(p.obligated)} obligated, current end ${esc(p.end)}). This is ${/DREDG/.test(p.kind) ? 'dredging / civil work' : 'equipment, utility or small-scope work'} with a weaker fit for photography. Photography need is not verified in the source data &mdash; treat ${esc(p.prime)} as a relationship contact for its other projects rather than a project-specific pitch.`;
  const big = p.obligated >= 20e6 ? 'Large active' : 'Active';
  return `${big} federal ${esc(p.kindWord)} project (${money(p.obligated)} obligated, current end ${esc(p.end)}). Photography need is not verified in the source data. ${esc(p.angles.map(a => a.toLowerCase()).join(', '))} ${p.angles.length > 1 ? 'are' : 'is a'} potential outreach angle${p.angles.length > 1 ? 's' : ''} to validate with ${esc(p.prime)}.`;
}
const DRONE_NOTE = 'Aerial / drone is suggested only for outdoor, non-restricted sites. Commercial drone work requires FAA Part 107 certification and permission from the site owner / agency. Never fly over or near a federal installation without written authorization.';

/* ---------------- routing ---------------- */
const PAGES = ['home', 'prospects', 'birmingham', 'primes', 'outreach', 'workflow', 'about'];
function go(page, opts) {
  if (!PAGES.includes(page)) page = 'home';
  $$('.panel').forEach(s => s.classList.toggle('active', s.id === 'p-' + page));
  $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.go === page ? 'true' : 'false'));
  $('#navsel').value = page;
  if (page === 'workflow') renderCrm();
  if (!(opts && opts.keepScroll)) window.scrollTo(0, 0);
}
function route() { const h = (location.hash || '#home').slice(1).split('?')[0]; go(h); }
window.addEventListener('hashchange', route);
$$('.tab').forEach(t => t.addEventListener('click', () => { location.hash = t.dataset.go; }));
$('#navsel').addEventListener('change', e => { location.hash = e.target.value; });
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-scroll]'); if (!a) return;
  e.preventDefault(); location.hash = a.getAttribute('href').slice(1);
  setTimeout(() => { const el = document.getElementById(a.dataset.scroll); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 30);
});

/* ---------------- home ---------------- */
const T = D.totals;
$('#kpis').classList.add('kpis5');
$('#kpis').innerHTML = [
  ['Active federal projects', T.projects.toLocaleString(), 'federal construction contracts in Alabama still running on 2026-09-21 (&ge; $250K obligated)'],
  ['Federal prime contractors', T.primes, 'construction companies holding those contracts'],
  ['Active Alabama obligated value', money(T.obligated), 'exact sum of obligated dollars on the ' + T.projects + ' contracts &mdash; construction spending, <b>not</b> photography spending', 'money'],
  ['Birmingham-area primes', T.bhmHQPrimes, 'federal construction primes headquartered in the Birmingham area'],
  ['Verified photography subawards', T.verifiedPhotoSubs, 'BamaView LLC &mdash; $52,500 &mdash; under Procon Consulting &mdash; Anniston Federal Courthouse']
].map(k => `<div class="kpi static"><div class=l>${k[0]}</div><div class="v ${k[3] || ''}">${k[1]}</div><div class=d>${k[2]}</div></div>`).join('');
$('[data-t=projects]').textContent = T.projects; $('[data-t=primes]').textContent = T.primes; $('[data-t=bhm]').textContent = T.bhmHQPrimes;
$('#regBody').innerHTML = Object.entries(T.byRegion).map(([k, v]) => `<tr data-region="${esc(k)}"><td>${esc(k)}</td><td class=num>${v.n}</td><td class=num>${money(v.obligated)}</td></tr>`).join('') +
  `<tr style="cursor:default"><td><b>All Alabama</b></td><td class=num><b>${T.projects}</b></td><td class=num><b>${money(T.obligated)}</b></td></tr>`;
$$('#regBody tr[data-region]').forEach(r => r.addEventListener('click', () => { resetFilters(); $('#fRegion').value = r.dataset.region; location.hash = 'prospects'; renderProspects(); }));

function drawMap(el, opts) {
  const M = D.map, maxO = Math.max(...M.places.map(p => p.obligated));
  const bhm = M.places.find(p => p.name === 'Birmingham') || { x: 0, y: 0 };
  const pxPerMile = M.pxPerMile; /* from the builder: map px per degree latitude / 69 mi */
  let s = `<svg class=almap viewBox="-10 -10 ${M.w + 20} ${M.h + 20}" role=img aria-label="Map of Alabama with active federal construction project locations"><path class=st d="${M.path}"/>`;
  if (opts.ring) s += `<circle class=ring cx="${bhm.x}" cy="${bhm.y}" r="${(60 * pxPerMile).toFixed(1)}"/><text class=ringl x="${bhm.x + 60 * pxPerMile * .72}" y="${bhm.y - 60 * pxPerMile * .72}">~60 MI</text>`;
  const places = [...M.places].sort((a, b) => b.obligated - a.obligated);
  places.forEach(p => { const r = 3 + 22 * Math.sqrt(p.obligated / maxO); s += `<circle class=dot data-place="${esc(p.name)}" cx="${p.x}" cy="${p.y}" r="${r.toFixed(1)}"><title>${esc(p.name)} — ${p.n} project${p.n > 1 ? 's' : ''}, ${money(p.obligated)}</title></circle>`; });
  places.filter(p => p.n >= (opts.labelMin || 3) || (opts.ring && Math.hypot(p.x - bhm.x, p.y - bhm.y) < 60 * pxPerMile)).forEach(p => { s += `<text class=lbl x="${p.x + 7}" y="${p.y + 3}">${esc(p.name)}</text>`; });
  el.innerHTML = s + '</svg>';
  $$('.dot', el).forEach(c => c.addEventListener('click', () => { resetFilters(); $('#q').value = ''; placeFilter = c.dataset.place; location.hash = 'prospects'; renderProspects(); }));
}
drawMap($('#mapHome'), { labelMin: 5 });
drawMap($('#mapBhm'), { ring: true, labelMin: 99 });

/* ---------------- prospects ---------------- */
let placeFilter = '', page = 0; const PER = 25;
const fill = (sel, vals) => { const el = $(sel); vals.forEach(v => { const o = document.createElement('option'); o.value = o.textContent = v; el.appendChild(o); }); };
fill('#fRegion', Object.keys(T.byRegion)); fill('#rRegion', Object.keys(T.byRegion));
fill('#fKind', [...new Set(D.projects.map(p => p.kind))].sort());
fill('#fSignal', ['VERIFIED PHOTO SUBAWARD', 'PHOTOGRAPHY SIGNAL', 'LOW SIGNAL']);
fill('#fAngle', [...new Set(D.projects.flatMap(p => p.angles))].sort());
fill('#fStatus', STATUSES); fill('#rStatus', STATUSES);
function resetFilters() { ['#q', '#fRegion', '#fKind', '#fValue', '#fMonths', '#fHQ', '#fSignal', '#fAngle', '#fStatus'].forEach(s => $(s).value = ''); $('#fRecent').checked = false; $('#fReach').checked = false; placeFilter = ''; page = 0; }
function filtered() {
  const q = $('#q').value.trim().toLowerCase(), reg = $('#fRegion').value, kind = $('#fKind').value, val = +$('#fValue').value, mon = +$('#fMonths').value,
    hq = $('#fHQ').value, sig = $('#fSignal').value, ang = $('#fAngle').value, st = $('#fStatus').value, rec = $('#fRecent').checked, reach = $('#fReach').checked;
  return D.projects.filter(p => (!q || [p.prime, p.title, p.desc, p.site, p.city, p.agency, p.id, p.primeHQ].join(' ').toLowerCase().includes(q)) &&
    (!reg || p.region === reg) && (!kind || p.kind === kind) && (!val || (val > 0 ? p.obligated >= val : p.obligated < -val)) &&
    (!mon || (mon > 0 ? p.months >= mon : p.months < -mon)) && (!hq || p.hqSeg === hq) && (!sig || p.signal === sig) && (!ang || p.angles.includes(ang)) &&
    (!st || status(p.prime) === st) && (!rec || p.recent) && (!reach || (PRIME[p.prime].links || []).length) &&
    (!placeFilter || (D.map.places.find(x => x.name === placeFilter) && placeKey(p) === placeFilter)));
}
const placeKey = p => p.place === 'Huntsville / Redstone' ? p.place : p.place.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
function renderProspects() {
  const rows = filtered(), n = rows.length, pages = Math.max(1, Math.ceil(n / PER)); page = Math.min(page, pages - 1);
  $('#pCount').innerHTML = `<b>${n}</b> of ${D.projects.length} projects &middot; ${new Set(rows.map(r => r.prime)).size} primes &middot; ${money(rows.reduce((a, r) => a + r.obligated, 0))} obligated` + (placeFilter ? ` &middot; place: <b>${esc(placeFilter)}</b> <button class="chip s" id=clrPlace>clear</button>` : '');
  if ($('#clrPlace')) $('#clrPlace').onclick = () => { placeFilter = ''; renderProspects(); };
  $('#pTbl tbody').innerHTML = rows.slice(page * PER, page * PER + PER).map(p => `<tr class=click data-id="${esc(p.id)}" tabindex=0>
<td class=prime data-label="Prospect / prime">${esc(p.prime)}<div class=sm2>${esc(p.primeHQ)}</div></td>
<td data-label=Project><span class="ttl clip">${esc(p.title)}</span><span class=sm2>${esc(p.kind)}</span></td>
<td data-label="Project site">${esc(p.site)}<div class=sm2>${esc(p.region)}</div></td>
<td data-label=Agency>${esc(p.agency)}</td>
<td class=num data-label="Project value">${money(p.obligated)}</td>
<td data-label=Start>${esc(p.start)}</td><td data-label=End>${esc(p.end)}</td>
<td class=num data-label="Months left">${esc(p.months)}</td>
<td data-label="Photography signal">${SIG[p.signal]}</td>
<td data-label=Evidence>${evid(p)}</td>
<td data-label="How to reach">${reachCell(p.prime)}</td>
<td data-label="Outreach status">${stPill(p.prime)}</td></tr>`).join('') || '<tr><td colspan=12 class=faint>No projects match these filters.</td></tr>';
  $$('#pTbl tbody tr[data-id]').forEach(tr => { tr.onclick = () => openProject(tr.dataset.id); tr.onkeydown = e => { if (e.key === 'Enter') openProject(tr.dataset.id); }; });
  const pg = $('#pPager'); pg.innerHTML = '';
  if (pages > 1) {
    const b = (label, i, dis, cur) => `<button data-p="${i}" ${dis ? 'disabled' : ''} ${cur ? 'aria-current=true' : ''}>${label}</button>`;
    pg.innerHTML = b('&lsaquo;', page - 1, page === 0) + Array.from({ length: pages }, (_, i) => b(i + 1, i, false, i === page)).join('') + b('&rsaquo;', page + 1, page === pages - 1);
    $$('button', pg).forEach(x => x.onclick = () => { page = +x.dataset.p; renderProspects(); $('#pTbl').scrollIntoView({ block: 'start' }); });
  }
}
['#q', '#fRegion', '#fKind', '#fValue', '#fMonths', '#fHQ', '#fSignal', '#fAngle', '#fStatus', '#fRecent', '#fReach'].forEach(s => $(s).addEventListener(s === '#q' ? 'input' : 'change', () => { page = 0; renderProspects(); }));
$('#fReset').onclick = () => { resetFilters(); renderProspects(); };

/* ---------------- drawer: project + prime CRM ---------------- */
const drawer = $('#drawer'), scrim = $('#scrim');
function openDrawer() { drawer.classList.add('open'); scrim.classList.add('on'); drawer.setAttribute('aria-hidden', 'false'); $('#dClose').focus(); }
function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('on'); drawer.setAttribute('aria-hidden', 'true'); }
$('#dClose').onclick = closeDrawer; scrim.onclick = closeDrawer; document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
const kv = rows => '<dl class=kv>' + rows.filter(r => r[1] !== '' && r[1] != null).map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('') + '</dl>';
function reachBox(pr) {
  if (!pr) return '';
  const links = (pr.links || []).map(l => `<div class=lk><span class=k>${esc(l.kind)}</span><a href="${esc(l.url)}" target=_blank rel=noopener>${esc(l.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></div>`).join('');
  return `<div class="sbox reach"><h4>How to reach ${esc(pr.name)}</h4>${links || '<p class=faint>No company or vendor page researched yet. Search the company name plus "subcontractor" or "vendor registration" and confirm it is the same company (same city / federal work) before contacting.</p>'}
${pr.how ? `<p style="margin-top:10px">${esc(pr.how)}</p>` : ''}${pr.howConfidence === 'UNCONFIRMED' && (pr.links || []).length ? `<p class=hint><span class="pill amber">Match unconfirmed</span> ${esc(pr.howNote || 'Confirm this is the same company before contacting.')}</p>` : ''}
<p class=hint>Company-level pages only${pr.howSource ? ' &middot; source: ' + esc(pr.howSource) : ''}. No individual names or personal contact details are listed.</p></div>`;
}
function crmForm(name) {
  const c = crm(name), opt = (vals, cur) => vals.map(v => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('');
  const f = (id, label, type = 'text', full) => `<label class="${full ? 'full' : ''}">${label}${type === 'textarea' ? `<textarea data-k="${id}">${esc(c[id])}</textarea>` : `<input type="${type}" data-k="${id}" value="${esc(c[id])}">`}</label>`;
  return `<div class="sbox crm"><h4>Outreach tracking &mdash; ${esc(name)}</h4><div class=form data-prime="${esc(name)}">
<label class=full>Outreach status<select data-k=status>${opt(STATUSES, status(name))}</select></label>
${f('contactName', 'Contact name')}${f('contactRole', 'Contact role')}${f('email', 'Email', 'email')}${f('phone', 'Phone', 'tel')}
${f('dateContacted', 'Date contacted', 'date')}${f('followUp', 'Follow-up date', 'date')}
<label>Photography need (what they told you)<select data-k=photoNeed>${opt(['Unknown', 'Confirmed need', 'Maybe later / future project', 'Handled in-house', 'Has a photographer', 'No need'], c.photoNeed || 'Unknown')}</select></label>
${f('currentPhotographer', 'Current photographer / vendor')}${f('referral', 'Referral (who else to talk to)', 'text', true)}
${f('response', 'Response', 'textarea', true)}${f('notes', 'Notes', 'textarea', true)}${f('nextAction', 'Next action', 'text', true)}
</div><div class=btnrow style="margin-top:10px"><button class="btn sm dark" data-save>Save</button><span class=saved>Saved in this browser</span></div>
<p class=hint>Stored only in this browser (localStorage). What you record here is information <b>you</b> verified through outreach.</p></div>`;
}
function wireCrm(root) {
  const form = $('.form[data-prime]', root); if (!form) return;
  const name = form.dataset.prime, btn = $('[data-save]', root), flag = $('.saved', root);
  const collect = () => { const o = {}; $$('[data-k]', form).forEach(el => { o[el.dataset.k] = el.value; }); return o; };
  btn.onclick = () => { if (setCrm(name, collect())) { flag.classList.add('on'); setTimeout(() => flag.classList.remove('on'), 1600); } else { flag.textContent = 'Could not save (browser storage blocked)'; flag.classList.add('on'); } };
  $('[data-k=status]', form).onchange = () => btn.onclick();
}
function openProject(id) {
  const p = PROJ[id]; if (!p) return; const pr = PRIME[p.prime];
  $('#dEyebrow').textContent = 'Project intelligence'; $('#dTitle').textContent = p.title;
  $('#dSub').innerHTML = `${esc(p.prime)} &middot; ${esc(p.site)} &middot; ${SIG[p.signal]} ${stPill(p.prime)}`;
  $('#dBody').innerHTML = `
<div class="sbox know"><h4>What we know <span class="ev fact">Verified</span></h4>${kv([
    ['Project', esc(p.desc)], ['Prime contractor', `<a href="#" data-prime="${esc(p.prime)}">${esc(p.prime)}</a>`], ['Prime headquarters', esc(p.primeHQ)], ['Prime size', esc(p.primeSize) + ' <span class=faint>(as reported)</span>'],
    ['Federal agency', esc(p.agency) + ' <span class=faint>(' + esc(p.dept) + ')</span>'], ['Buying office', esc(p.office)], ['Project site', esc(p.site) + (p.siteNote ? `<div class=hint>${esc(p.siteNote)}</div>` : '')], ['Region', esc(p.region)],
    ['Project type', esc(p.kind) + ' <span class=faint>(derived from description)</span>'], ['Award ID', esc(p.id)], ['Obligated amount', money(p.obligated)], ['Ceiling', p.ceiling ? money(p.ceiling) : ''],
    ['Start date', esc(p.start)], ['Current end date', esc(p.end)], ['Potential end date', esc(p.potEnd)], ['Months remaining', esc(p.months)],
    ['Subawards reported', `${p.subN} ${p.subN ? '(' + money(p.subAmt) + ')' : ''} <span class=faint>&mdash; primes only report subcontracts of $30K+</span>`],
    ['Photography subaward', p.photoSub && p.photoSub.startsWith('YES') ? '<span class="ev fact">Verified</span> ' + esc(p.photoSub) : 'None reported'],
    ['Evidence type', esc(p.evidence)], ['Last verified', esc(p.verified)], ['Source', `<a href="${esc(p.source)}" target=_blank rel=noopener>USAspending.gov award record</a>`]])}</div>
<div class="sbox angle"><h4>Potential photography angle <span class="ev verify">Analytical &middot; outreach hypothesis</span></h4>${tags(p.angles)}<p style="margin-top:10px">${why(p)}</p>
${p.angles.includes('AERIAL / DRONE') ? `<p class=hint><b>Drone:</b> ${DRONE_NOTE}</p>` : ''}${p.access ? `<p class=hint><b>Site access:</b> ${esc(p.access)}</p>` : ''}${p.analystNote ? `<p class=hint><b>Analyst note:</b> ${esc(p.analystNote)}</p>` : ''}</div>
<div class="sbox ask"><h4>What to ask</h4><p class=q>&ldquo;${esc(p.ask)}&rdquo;</p></div>
${reachBox(pr)}
<div class=btnrow><button class="btn sm" id=dDraft>Draft outreach email</button><button class="btn sm ghost" id=dPrime>View all ${pr.nProjects} ${pr.nProjects > 1 ? 'projects' : 'project'} for this prime</button></div>
${crmForm(p.prime)}`;
  wireCrm($('#dBody'));
  $('#dDraft').onclick = () => { closeDrawer(); setGen(p.prime, p.id); location.hash = 'outreach'; setTimeout(() => $('#genSect').scrollIntoView({ behavior: 'smooth' }), 40); };
  $('#dPrime').onclick = () => { closeDrawer(); location.hash = 'primes'; openPrimeCard(p.prime); };
  $$('#dBody a[data-prime]').forEach(a => a.onclick = e => { e.preventDefault(); closeDrawer(); location.hash = 'primes'; openPrimeCard(a.dataset.prime); });
  openDrawer();
}
function openPrimeDrawer(name) {
  const pr = PRIME[name]; if (!pr) return;
  $('#dEyebrow').textContent = 'Prime contractor'; $('#dTitle').textContent = name;
  $('#dSub').innerHTML = `${esc(pr.hq)} &middot; ${pr.nProjects} active Alabama project${pr.nProjects > 1 ? 's' : ''} &middot; ${money(pr.obligated)} ${stPill(name)}`;
  $('#dBody').innerHTML = reachBox(pr) + crmForm(name);
  wireCrm($('#dBody')); openDrawer();
}

/* ---------------- birmingham ---------------- */
$('#bhmCrit').innerHTML = `Based on the workbook's <b>BIRMINGHAM_SHORTLIST</b>: ${D.shortlist.length} active projects within about an hour of Birmingham, $2M or more, with at least about two months left, dredging excluded. Distances are approximate.`;
function bhmCard(s) {
  const p = PROJ[s.id] || {}, pr = PRIME[s.prime];
  const links = s.page ? s.page.split(';').map(u => u.trim()).filter(Boolean).map(u => `<a href="${esc(u)}" target=_blank rel=noopener>${esc(u.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`).join('<br>') : (s.how ? '<span class=faint>No official site found</span>' : '<span class=faint>Not yet researched</span>');
  return `<article class=pc>
<div class=top><div><div class=site>${esc(s.site)} &middot; ${esc(s.distance)}</div><h3>${esc(p.title || s.project)}</h3></div>${stPill(s.prime)}</div>
<div class=tagrow>${evid(p)} ${SIG[p.signal] || ''}</div>
<dl><dt>Agency</dt><dd>${esc(s.agency)}</dd><dt>Prime</dt><dd><b>${esc(s.prime)}</b> <span class=faint>(${esc(s.primeHome)})</span></dd><dt>Project value</dt><dd>${money(s.obligated)} obligated</dd>
<dt>Start &rarr; end</dt><dd>${esc(s.start)} &rarr; ${esc(s.end)}</dd><dt>Months remaining</dt><dd>${esc(s.months)}${s.recent ? ' &middot; <b>started in last 12 months</b>' : ''}</dd>
<dt>Prime website</dt><dd>${links}${s.page && s.howConfidence === 'UNCONFIRMED' ? ' <span class="pill amber">match unconfirmed</span>' : ''}</dd><dt>How to reach</dt><dd>${esc(s.how) || '<span class=faint>Not yet researched</span>'}</dd>
${s.note ? `<dt>Analyst note</dt><dd>${esc(s.note)}</dd>` : ''}${s.access ? `<dt>Site access</dt><dd>${esc(s.access)}</dd>` : ''}
<dt>Award ID</dt><dd>${esc(s.id)}</dd><dt>Evidence</dt><dd class=sm>${esc(s.evidence)}</dd></dl>
<div class="sbox ask" style="margin-top:6px;padding:10px 12px"><span class=sm><b>What to ask:</b> &ldquo;${esc(p.ask || '')}&rdquo;</span></div>
<div class=foot><button class="btn sm" data-open="${esc(s.id)}">Project intelligence</button><button class="btn sm ghost" data-draft="${esc(s.id)}">Draft email</button><a class=sm href="${esc(s.source)}" target=_blank rel=noopener>Source</a></div></article>`;
}
function renderBhm() {
  const tiers = [...new Set(D.shortlist.map(s => s.tier))];
  $('#bhmCards').innerHTML = tiers.map(t => `<div class=tierh>${esc(t)}</div><div class=cards>${D.shortlist.filter(s => s.tier === t).map(bhmCard).join('')}</div>`).join('');
  $('#hqCards').innerHTML = D.hqprimes.map(h => {
    const pr = PRIME[h.name] || {};
    const links = (pr.links || []).map(l => `<div class=lk><span class=k>${esc(l.kind)}</span><a href="${esc(l.url)}" target=_blank rel=noopener>${esc(l.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></div>`).join('');
    return `<article class=pc><div class=top><div><div class=site>HQ: ${esc(h.hq)}</div><h3>${esc(h.name)}</h3></div>${stPill(h.name)}</div>
<dl><dt>Active AL projects</dt><dd>${h.n}</dd><dt>Active obligated</dt><dd>${money(h.obligated)}</dd><dt>Where</dt><dd>${esc(h.where)}</dd><dt>Largest project</dt><dd>${esc(h.largest)}</dd></dl>
<div>${links || '<span class=faint>Company / vendor page not yet researched.</span>'}</div>
<p class=sm style="margin:4px 0 0"><b>How to reach:</b> ${esc(h.how || pr.how || 'Not yet researched.')}</p>
<div class=foot><button class="btn sm" data-primecard="${esc(h.name)}">Prime card &amp; projects</button><button class="btn sm ghost" data-track="${esc(h.name)}">Track outreach</button></div></article>`;
  }).join('');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-open],[data-draft],[data-primecard],[data-track],[data-proj]'); if (!b) return;
  if (b.dataset.open) openProject(b.dataset.open);
  else if (b.dataset.proj) openProject(b.dataset.proj);
  else if (b.dataset.draft) { const p = PROJ[b.dataset.draft]; setGen(p.prime, p.id); location.hash = 'outreach'; setTimeout(() => $('#genSect').scrollIntoView({ behavior: 'smooth' }), 40); }
  else if (b.dataset.primecard) { location.hash = 'primes'; openPrimeCard(b.dataset.primecard); }
  else if (b.dataset.track) openPrimeDrawer(b.dataset.track);
});

/* ---------------- primes ---------------- */
function primeCard(pr) {
  const mine = pr.projects.map(id => PROJ[id]); const lead = mine[0];
  const plist = mine.map(p => `<button data-proj="${esc(p.id)}"><span><b>${esc(p.title)}</b><br><span class=sm2>${esc(p.site)} &middot; ends ${esc(p.end)}</span></span><span class=num>${money(p.obligated)}</span>${SIG[p.signal]}</button>`).join('');
  return `<div class=acc data-name="${esc(pr.name)}"><button class="ah pr" aria-expanded=false><span class=car>&#9654;</span><span><b>${esc(pr.name)}</b><br><span class=meta>HQ ${esc(pr.hq)} &middot; ${esc(pr.places.join(' · '))}</span></span>
<span class=cnt><b>${pr.nProjects}</b> project${pr.nProjects > 1 ? 's' : ''}</span><span class=cnt><b>${money(pr.obligated)}</b></span>${stPill(pr.name)}</button>
<div class=ab>
<div class="sbox know" style="margin-top:0"><h4>What we know <span class="ev fact">Verified</span></h4>${kv([['Headquarters', esc(pr.hq)], ['Parent company', esc(pr.parent)], ['Size (as reported)', esc(pr.size)], ['Active Alabama projects', pr.nProjects], ['Active obligated value', money(pr.obligated)], ['Agencies', esc(pr.agencies)], ['Project locations', esc(pr.places.join('; '))], ['Latest end date', esc(pr.latestEnd)]])}</div>
<div class="sbox angle"><h4>Why Sump should know about it <span class="ev verify">Analytical</span></h4><p><b>Largest active project:</b> ${esc(lead.title)} &mdash; ${esc(lead.site)} &middot; award ${esc(lead.id)} &middot; ${money(lead.obligated)} obligated &middot; current end ${esc(lead.end)}.</p><p>${why(lead)}</p>${tags(lead.angles)}${pr.hasVerifiedPhotoSub ? '<p class=hint><span class="ev fact">Verified</span> This prime reported a photography subcontract (BamaView LLC, $52,500).</p>' : ''}</div>
<div class="sbox ask"><h4>What to ask</h4><p class=q>&ldquo;${esc(lead.ask)}&rdquo;</p></div>
${reachBox(pr)}
<h4 style="margin-top:18px">All active Alabama projects</h4><div class=plist>${plist}</div>
<div class=btnrow><button class="btn sm" data-draft="${esc(lead.id)}">Draft outreach email</button><button class="btn sm ghost" data-track="${esc(pr.name)}">Track outreach</button></div>
</div></div>`;
}
function renderPrimes() {
  const q = $('#rq').value.trim().toLowerCase(), hq = $('#rHQ').value, reg = $('#rRegion').value, st = $('#rStatus').value, reach = $('#rReach').checked;
  const list = D.primes.filter(p => (!q || (p.name + ' ' + p.hq + ' ' + p.places.join(' ')).toLowerCase().includes(q)) && (!hq || p.hqSeg === hq) && (!reg || p.regions.includes(reg)) && (!st || status(p.name) === st) && (!reach || p.links.length));
  $('#rCount').innerHTML = `<b>${list.length}</b> of ${D.primes.length} primes &middot; ${D.totals.primesWithPages} with a researched company / vendor page`;
  $('#primeList').innerHTML = list.map(primeCard).join('') || '<p class=faint>No primes match.</p>';
  $$('#primeList .acc>.ah').forEach(b => b.onclick = () => { const a = b.parentElement, o = !a.hasAttribute('open'); a.toggleAttribute('open', o); b.setAttribute('aria-expanded', o); });
}
function openPrimeCard(name) {
  resetPrimeFilters(); renderPrimes();
  const el = $$('#primeList .acc').find(a => a.dataset.name === name); if (!el) return;
  el.setAttribute('open', ''); $('.ah', el).setAttribute('aria-expanded', 'true'); setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
}
function resetPrimeFilters() { $('#rq').value = ''; $('#rHQ').value = ''; $('#rRegion').value = ''; $('#rStatus').value = ''; $('#rReach').checked = false; }
['#rq', '#rHQ', '#rRegion', '#rStatus', '#rReach'].forEach(s => $(s).addEventListener(s === '#rq' ? 'input' : 'change', renderPrimes));
$('#rOpen').onclick = () => $$('#primeList .acc').forEach(a => { a.setAttribute('open', ''); $('.ah', a).setAttribute('aria-expanded', 'true'); });
$('#rClose').onclick = () => $$('#primeList .acc').forEach(a => { a.removeAttribute('open'); $('.ah', a).setAttribute('aria-expanded', 'false'); });

/* ---------------- outreach generator ---------------- */
const P0 = { sName: 'Sump', sCity: 'Birmingham, Alabama', sSpec: 'construction, architectural and commercial photography', sEmail: '', sPhone: '', sPortfolio: '' };
const prof = () => Object.assign({}, P0, STORE.profile || {});
Object.keys(P0).forEach(k => { const el = $('#' + k); el.value = prof()[k] || ''; el.addEventListener('input', () => { STORE.profile = Object.assign({}, STORE.profile, { [k]: el.value }); save(); showPf(); renderEmail(); }); });
const showPf = () => { $('#pfShow').textContent = prof().sPortfolio || '[SUMP PORTFOLIO LINK]'; };
showPf();
const ANGLE_PHRASE = { 'PROGRESS PHOTOGRAPHY': 'progress photography across construction phases', 'CONSTRUCTION DOCUMENTATION': 'construction documentation', 'PROJECT MILESTONES': 'milestone photography',
  'COMPLETION PHOTOGRAPHY': 'completion photography of the finished work', 'ARCHITECTURAL PHOTOGRAPHY': 'architectural photography of completed facilities', 'SITE DOCUMENTATION': 'before-and-after site documentation',
  'FACILITY DOCUMENTATION': 'facility documentation', 'CORPORATE / CASE STUDY': 'case-study photography for your project portfolio', 'MARKETING CONTENT': 'marketing imagery of your work',
  'PUBLIC AFFAIRS': 'public-facing project imagery', 'AERIAL / DRONE': 'authorized aerial photography', 'UNKNOWN': 'project photography' };
const primeOpts = [...D.primes].sort((a, b) => a.name.localeCompare(b.name));
$('#gPrime').innerHTML = primeOpts.map(p => `<option>${esc(p.name)}</option>`).join('');
function refRef(p) { const t = p.title.replace(/,?\s*(Redstone Arsenal|Birmingham|Tuscaloosa|Montgomery|Selma|Anniston)?,?\s*(AL|Alabama)\.?$/i, '').trim(); return (t.length > 70 ? t.slice(0, 67).replace(/\s\S*$/, '') + '…' : t); }
function installation(site) {
  if (/NASA Marshall/i.test(site)) return 'NASA Marshall';
  if (/Redstone/i.test(site)) return 'Redstone Arsenal';
  if (/Maxwell|Gunter/i.test(site)) return 'Maxwell AFB';
  if (/Novosel/i.test(site)) return 'Fort Novosel';
  if (/Anniston Army Depot/i.test(site)) return 'Anniston Army Depot';
  return '';
}
function setGen(prime, id) {
  $('#gPrime').value = prime; fillProjects(); if (id) $('#gProject').value = id; projectChanged();
}
function fillProjects() {
  const pr = PRIME[$('#gPrime').value];
  $('#gProject').innerHTML = pr.projects.map(id => `<option value="${esc(id)}">${esc(PROJ[id].title.slice(0, 80))} — ${esc(PROJ[id].site)}</option>`).join('');
}
function projectChanged() {
  const p = PROJ[$('#gProject').value]; if (!p) return;
  $('#gKind').value = p.kind; $('#gAngle').innerHTML = p.angles.map(a => `<option>${esc(a)}</option>`).join('');
  const inst = installation(p.site);
  $('#gRef').value = inst ? `the ${inst} project` : refRef(p);
  $('#gRefHint').textContent = inst ? 'Controlled federal site: the draft names the installation rather than the project title — better for a first email. Edit if you already know the team.' : ''; $('#gLoc').value = /Redstone|NASA|FBI/.test(p.site) ? 'Huntsville' : (p.site.includes('(site unconfirmed') ? p.city : p.site.replace(/ \(.*$/, '').replace(/^Birmingham VA Medical Center$/, 'Birmingham'));
  renderEmail();
}
function draft() {
  const s = prof(), p = PROJ[$('#gProject').value], co = titleCo(p.prime), ref0 = $('#gRef').value.trim(), ref = !ref0 ? 'your current project' : (/^(the|your|a|an)\s/i.test(ref0) ? ref0 : 'the ' + ref0), loc = $('#gLoc').value.trim(), ang = ANGLE_PHRASE[$('#gAngle').value] || 'project photography';
  const hi = $('#gName').value.trim() ? `Hi ${$('#gName').value.trim()},` : 'Hi there,';
  const pf = s.sPortfolio || '[SUMP PORTFOLIO LINK]', sig = [s.sName || 'Sump', s.sEmail || '[Email]', s.sPhone || '[Phone]'].join('\n');
  const where = loc ? ` in ${loc}` : '';
  const subj = (ref0 || 'your project') + (loc ? ` (${loc})` : '');
  const type = $('#gType').value;
  if (type === 'f1') return { subject: `Re: Photography support for ${subj}`, body: `${hi}\n\nFollowing up on my note from last week about photography for ${co}'s work on ${ref}${where}. I know project teams are busy, so I'll keep this short.\n\nIf your team ever brings in a photographer for ${ang}, I'd be glad to help. My work is here:\n${pf}\n\nIs there someone on your team who handles this I should reach out to instead?\n\nThanks,\n${sig}` };
  if (type === 'f2') return { subject: `Re: Photography support for ${subj}`, body: `${hi}\n\nOne last quick note — I won't keep filling your inbox. If photography support on ${ref} or future ${co} projects is ever useful, you can reach me anytime at the contact details below.\n\nPortfolio: ${pf}\n\nBest of luck with the project,\n${sig}` };
  return { subject: `Photography support for ${subj}`, body: `${hi}\n\nI'm ${s.sName || 'Sump'}, a photographer based in ${s.sCity || 'Alabama'} specializing in ${s.sSpec}.\n\nI came across ${co}'s work on ${ref}${where} and wanted to reach out because I work with project teams that need professional ${ang}.\n\nI wanted to ask whether your team currently has a photographer documenting the project, or whether photography is handled internally.\n\nPortfolio:\n${pf}\n\nIf photography support is something your team brings in during the project, I'd be glad to introduce myself.\n\nBest,\n${sig}` };
}
function titleCo(n) { return n.replace(/,?\s*(LLC|L\.L\.C\.|INC\.?|INCORPORATED|CO\.?|CORP\.?|CORPORATION|LLP|\(DE\))\b\.?/gi, '').replace(/\s+/g, ' ').trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\bJv\b/g, 'JV').replace(/\bBl\b/, 'BL').replace(/\bCci\b/g, 'CCI').replace(/\bMgi\b/g, 'MGI').replace(/\bDri\b/, 'DRI').replace(/\bAecom\b/, 'AECOM').replace(/\bCms\b/, 'CMS').replace(/\bLbyd\b/, 'LBYD').replace(/\bPpw\b/, 'PPW').replace(/\bOac\b/, 'OAC').replace(/\bGsi\b/, 'GSI').replace(/\bIlsi\b/, 'ILSI').replace(/\bOcs-Ncs\b/, 'OCS-NCS').replace(/\bEmr\b/, 'EMR').replace(/\bC\. J\./, 'C.J.').replace(/ & /g, ' & ').replace(/,$/, ''); }
function renderEmail() {
  if (!$('#gProject').value) return;
  const d = draft(); $('#gOut').textContent = `Subject: ${d.subject}\n\n${d.body}`;
  $('#gMail').href = `mailto:?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(d.body)}`;
}
$('#gPrime').onchange = () => { fillProjects(); projectChanged(); };
$('#gProject').onchange = projectChanged;
['#gAngle', '#gType'].forEach(s => $(s).onchange = renderEmail); ['#gRef', '#gLoc', '#gName'].forEach(s => $(s).oninput = renderEmail);
$('#gCopy').onclick = async () => { const t = $('#gOut').textContent; try { await navigator.clipboard.writeText(t); flash('#gSaved', 'Copied'); } catch (e) { const r = document.createRange(); r.selectNodeContents($('#gOut')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); flash('#gSaved', 'Selected — press Cmd/Ctrl+C'); } };
$('#gMark').onclick = () => { const n = $('#gPrime').value, t = $('#gType').value; const st = t === 'f1' ? 'FOLLOW-UP 1' : t === 'f2' ? 'FOLLOW-UP 2' : 'CONTACTED'; const patch = { status: st }; if (t === 'first' && !crm(n).dateContacted) patch.dateContacted = new Date().toISOString().slice(0, 10); setCrm(n, patch); flash('#gSaved', `Marked ${st}`); };
function flash(sel, txt) { const f = $(sel); f.textContent = txt; f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 1800); }
const firstLead = PROJ[D.shortlist[0].id]; setGen(firstLead.prime, firstLead.id);

/* ---------------- CRM dashboard ---------------- */
let crmFilter = '';
function renderCrm() {
  const counts = Object.fromEntries(STATUSES.map(s => [s, 0])); D.primes.forEach(p => counts[status(p.name)]++);
  $('#crmStats').innerHTML = STATUSES.map(s => `<button data-s="${esc(s)}" aria-pressed=${crmFilter === s}><span class=n>${counts[s]}</span><span class=l>${esc(s)}</span></button>`).join('');
  $$('#crmStats button').forEach(b => b.onclick = () => { crmFilter = crmFilter === b.dataset.s ? '' : b.dataset.s; renderCrm(); });
  const touched = D.primes.filter(p => STORE.primes[p.name]);
  const rows = (crmFilter ? D.primes.filter(p => status(p.name) === crmFilter) : touched).sort((a, b) => (crm(a.name).followUp || '9999').localeCompare(crm(b.name).followUp || '9999'));
  $('#crmCount').innerHTML = crmFilter ? `<b>${rows.length}</b> primes with status ${esc(crmFilter)} <button class="chip s" id=crmAll>show all tracked</button>` : `<b>${touched.length}</b> of ${D.primes.length} primes tracked &middot; sorted by follow-up date`;
  if ($('#crmAll')) $('#crmAll').onclick = () => { crmFilter = ''; renderCrm(); };
  $('#crmTbl tbody').innerHTML = rows.map(p => { const c = crm(p.name), due = c.followUp && c.followUp <= new Date().toISOString().slice(0, 10) && !['REPLIED', 'INTERESTED', 'NOT A FIT', 'NO RESPONSE', 'CONVERTED'].includes(status(p.name));
    return `<tr class=click data-track="${esc(p.name)}"><td data-label=Prime><b>${esc(p.name)}</b><div class=sm2>${esc(p.hq)}</div></td><td data-label=Status>${stPill(p.name)}</td><td data-label=Contact>${esc(c.contactName || '')}${c.contactRole ? '<div class=sm2>' + esc(c.contactRole) + '</div>' : ''}</td>
<td data-label=Contacted>${esc(c.dateContacted || '')}</td><td data-label=Follow-up class="${due ? 'due' : ''}">${esc(c.followUp || '')}${due ? ' &middot; due' : ''}</td><td data-label="Photography need">${esc(c.photoNeed || 'Unknown')}</td><td data-label="Next action">${esc(c.nextAction || '')}</td></tr>`; }).join('') ||
    '<tr><td colspan=7 class=faint>Nothing tracked yet. Open any project or prime and set an outreach status.</td></tr>';
}
$('#crmExport').onclick = () => { const b = new Blob([JSON.stringify(STORE, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `sump-outreach-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
$('#crmImport').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { const o = JSON.parse(t); if (!o || typeof o.primes !== 'object') throw new Error('bad file'); if (!confirm('Replace the tracking in this browser with the backup file?')) return; STORE = Object.assign({ primes: {}, profile: {} }, o); save(); location.reload(); }).catch(() => alert('That file is not a valid Sump outreach backup.')); };
$('#crmClear').onclick = () => { if (confirm('Delete all outreach tracking and your saved details from this browser? Export a backup first if you need it.')) { STORE = { primes: {}, profile: {} }; save(); location.reload(); } };

function refreshStatusViews() { renderProspects(); renderPrimesKeepOpen(); renderBhm(); if ($('#p-workflow').classList.contains('active')) renderCrm(); }
function renderPrimesKeepOpen() { const open = $$('#primeList .acc[open]').map(a => a.dataset.name); renderPrimes(); $$('#primeList .acc').forEach(a => { if (open.includes(a.dataset.name)) { a.setAttribute('open', ''); $('.ah', a).setAttribute('aria-expanded', 'true'); } }); }

/* ---------------- about ---------------- */
$('#readme').innerHTML = D.readme.slice(1).filter(l => !/^TABS:/.test(l)).map(l => `<li>${esc(l)}</li>`).join('') + `<li>Client data layer: ${D.totals.projects} projects and ${D.totals.primes} primes read from <b>${esc(D.source)}</b> (unchanged). The workbook's sheet row counts (184 / 74) include three header rows.</li>`;

renderProspects(); renderPrimes(); renderBhm(); route();
})();
