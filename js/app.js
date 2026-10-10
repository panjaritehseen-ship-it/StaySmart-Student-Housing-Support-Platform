/* Student site: home + filters, details modal, favorites, bookings, reviews, feedback, about, offline Ask AI */
(function(){
const {$,$$,esc,inr,fdate,stars,ic,avatar,typeLabel,pill,prop,owner,img,avg,propReviews,toast,modal}=P;
const sess=()=>P.session();
const sid=()=>{const s=sess();return s&&s.role==='student'?s.userId:0};
const AMEN=['WiFi','AC','Parking','Geyser','Home Food','Kitchen'];
const PAGES={home:'Home',favorites:'Favorites',bookings:'My Bookings',reviews:'Reviews',feedback:'Feedback',about:'About',ask:'Ask AI'};
const NAVICON={home:'home',favorites:'heart',bookings:'book',reviews:'star',feedback:'chat',about:'info',ask:'ai'};
let F={city:'',area:'',min:'',max:'',type:'',amen:[],sort:'featured',q:''};

function shell(){
  const s=sess();
  $('#app').innerHTML=`<nav class="navbar-custom"><button class="menu-btn" id="menuBtn" aria-label="Menu">☰</button>
  <a class="navbar-brand" href="#home" style="text-decoration:none">Stay<span>Smart</span></a>
  <div class="search-box"><input id="gSearch" placeholder="Search city, area or title…"><button class="btn btn-warning" id="gGo">🔍</button></div>
  <div class="nav-right">${s?`<span class="d-none-sm">${avatar(s.name,'#004C99')}</span><span class="small">${esc(s.name)}</span><button class="btn btn-sm btn-warning" id="logoutBtn">Logout</button>`:`<button class="btn btn-sm btn-warning" id="loginBtn">Login</button>`}</div></nav>
  <aside class="sidebar" id="sidebar"><div style="padding:12px 0">
  ${Object.keys(PAGES).map(k=>`<a class="nav-link" data-p="${k}" href="#${k}">${ic(NAVICON[k])}${PAGES[k]}</a>`).join('')}
  <div class="sidebar-sep"></div>
  <a class="nav-link text-success fw-bold" href="vendor.html">${ic('build')}Owner Dashboard</a>
  <a class="nav-link text-danger fw-bold" href="admin.html">${ic('shield')}Admin Panel</a>
  <div class="sidebar-sep"></div><a class="nav-link" id="resetBtn" style="color:#777">${ic('key')}Reset demo data</a></div></aside>
  <div class="menu-overlay" id="ovl"></div>
  <main class="content" id="view"></main>`;
  $('#menuBtn').onclick=()=>{$('#sidebar').classList.toggle('show');$('#ovl').classList.toggle('show')};
  $('#ovl').onclick=()=>{$('#sidebar').classList.remove('show');$('#ovl').classList.remove('show')};
  const go=()=>{F.q=$('#gSearch').value.trim();location.hash='#home';render()};
  $('#gGo').onclick=go;$('#gSearch').onkeydown=e=>{if(e.key==='Enter')go()};
  if($('#loginBtn'))$('#loginBtn').onclick=()=>loginModal();
  if($('#logoutBtn'))$('#logoutBtn').onclick=()=>{P.logout();shell();render()};
  $('#resetBtn').onclick=()=>P.confirmBox('Reset all demo data (favorites, bookings, reviews, owner/admin changes) back to the original seed data?',()=>P.reset());
}
function loginModal(after){
  const m=modal({title:'Login to StaySmart',body:P.loginForm({}),onOpen:ov=>P.bindLogin(ov,s=>{m.close();
    if(s.role!=='student'){location.href=P.home[s.role];return}
    toast('Welcome back, '+s.name);shell();render();after&&after()})});
}
function needLogin(fn){if(sid())return fn();loginModal(()=>{})}

/* ---------- cards ---------- */
function isFav(id){return P.db.favorites.some(f=>f.studentId==sid()&&f.propertyId==id)}
function toggleFav(id){const i=P.db.favorites.findIndex(f=>f.studentId==sid()&&f.propertyId==id);
  if(i>=0){P.db.favorites.splice(i,1);toast('Removed from favorites')}else{P.db.favorites.push({studentId:sid(),propertyId:id});toast('Added to favorites ❤️')}P.save()}
function statusBadge(p){return p.status==='available'?'<span class="badge bg-success">Available</span>':p.status==='occupied'?'<span class="badge bg-warning">Full</span>':'<span class="badge bg-secondary">'+(p.status==='under_maintenance'?'Under Maintenance':'Unavailable')+'</span>'}
function card(p){const r=avg(p.id),n=propReviews(p.id).length;
  return `<div class="property-card" data-id="${p.id}"><div class="card-img-wrapper"><img class="card-img-top" src="${esc(img(p))}" alt="${esc(p.title)}" loading="lazy">
  ${p.featured?'<span class="badge-featured">⭐ Featured</span>':''}<span class="badge-type bg-primary text-white">${esc(typeLabel(p.type))}</span>
  <button class="btn btn-sm ${isFav(p.id)?'on':''} btn-outline-danger fav" data-fav="${p.id}" style="position:absolute;bottom:12px;right:12px;border-radius:50%;width:38px;height:38px;padding:0;background:#fff" title="Favorite">${isFav(p.id)?'❤️':'🤍'}</button></div>
  <div class="card-body"><h5 class="card-title">${esc(p.title)}</h5>
  <div class="text-muted small mb-2">📍 ${esc([p.area,p.city].filter(Boolean).join(', '))}</div>
  <div class="d-flex between align-center"><div class="property-price">${inr(p.rent)}<small>/month</small></div>${statusBadge(p)}</div>
  <div class="property-features"><span class="property-feature">🛏️ ${p.beds} Bed</span><span class="property-feature">🚿 ${p.baths} Bath</span><span class="property-feature">👥 ${p.maxOcc}</span></div>
  <div class="d-flex between align-center"><span class="small">${n?stars(r)+' <span class="text-muted">('+n+')</span>':'<span class="text-muted">No reviews yet</span>'}</span><button class="btn btn-sm btn-primary" data-view="${p.id}">View Details</button></div></div></div>`}
function bindCards(root){
  $$('[data-view]',root).forEach(b=>b.onclick=e=>{e.stopPropagation();details(+b.dataset.view)});
  $$('.property-card',root).forEach(c=>c.onclick=()=>details(+c.dataset.id));
  $$('[data-fav]',root).forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFav(+b.dataset.fav);render()});
}

/* ---------- home ---------- */
function filtered(){let list=P.db.properties.filter(p=>p.status!=='unavailable'||true);
  const q=F.q.toLowerCase();
  list=list.filter(p=>(!F.city||p.city===F.city)&&(!F.area||(p.area||'').toLowerCase().includes(F.area.toLowerCase())||p.address.toLowerCase().includes(F.area.toLowerCase()))
   &&(!F.min||p.rent>=+F.min)&&(!F.max||p.rent<=+F.max)&&(!F.type||p.type===F.type)
   &&F.amen.every(a=>p.amenities.includes(a))
   &&(!q||(p.title+' '+p.city+' '+p.area+' '+p.address+' '+p.type).toLowerCase().includes(q)));
  const s=F.sort;list.sort((a,b)=>s==='low'?a.rent-b.rent:s==='high'?b.rent-a.rent:s==='rating'?avg(b.id)-avg(a.id):(b.featured-a.featured)||(b.id-a.id));
  return list}
function home(){
  const cities=[...new Set(P.db.properties.map(p=>p.city))].sort((a,b)=>a==='Ratnagiri'?-1:b==='Ratnagiri'?1:a.localeCompare(b));
  const prices=[2000,3000,4000,5000,6000,8000,10000,15000,20000];
  const opt=(arr,sel)=>arr.map(v=>`<option value="${v}" ${sel==v?'selected':''}>${typeof v==='number'?inr(v):esc(v)}</option>`).join('');
  $('#view').innerHTML=`<div class="hero"><h2>Find your perfect student stay 🏠</h2><p class="mb-0" style="opacity:.9">Hostels, PGs, studios and apartments near your college. Compare prices, read reviews and book in a few clicks.</p></div>
  <div class="filter-section"><div class="filter-title">🔍 Filter properties</div>
  <div class="filter-grid"><div><label class="form-label">City</label><select class="form-select" id="fCity"><option value="">All Cities</option>${opt(cities,F.city)}</select></div>
  <div><label class="form-label">Area</label><input class="form-control" id="fArea" list="areas" placeholder="e.g. Nachane" value="${esc(F.area)}"><datalist id="areas">${P.db.subareas.map(a=>`<option>${esc(a)}</option>`).join('')}</datalist></div>
  <div><label class="form-label">Min price</label><select class="form-select" id="fMin"><option value="">Min</option>${opt(prices,F.min)}</select></div>
  <div><label class="form-label">Max price</label><select class="form-select" id="fMax"><option value="">Max</option>${opt(prices,F.max)}</select></div>
  <div><label class="form-label">Type</label><select class="form-select" id="fType"><option value="">All Types</option>${['hostel','apartment','shared_room','studio'].map(t=>`<option value="${t}" ${F.type===t?'selected':''}>${typeLabel(t)}</option>`).join('')}</select></div>
  <div><label class="form-label">Sort by</label><select class="form-select" id="fSort">${[['featured','Featured'],['low','Price: low to high'],['high','Price: high to low'],['rating','Top rated']].map(([v,l])=>`<option value="${v}" ${F.sort===v?'selected':''}>${l}</option>`).join('')}</select></div></div>
  <div class="d-flex flex-wrap gap-2 mt-3 align-center"><span class="small text-muted">Amenities:</span>${AMEN.map(a=>`<span class="filter-badge ${F.amen.includes(a)?'active':''}" data-am="${a}">${a}</span>`).join('')}<button class="btn btn-sm btn-outline" id="fClear" style="margin-left:auto">Clear filters</button></div></div>
  <div class="d-flex between align-center mb-3"><h5 class="mb-0" id="resCount"></h5></div><div class="grid cols-3" id="cards"></div>`;
  const draw=()=>{const l=filtered();$('#resCount').textContent=l.length+' propert'+(l.length===1?'y':'ies')+' found'+(F.q?` for “${F.q}”`:'');
    $('#cards').innerHTML=l.length?l.map(card).join(''):'<div class="empty-soft" style="grid-column:1/-1">No properties match these filters. Try widening the price range or clearing filters.</div>';bindCards($('#cards'))};
  const bind=(id,k)=>$(id).addEventListener('input',e=>{F[k]=e.target.value;draw()});
  bind('#fCity','city');bind('#fArea','area');bind('#fMin','min');bind('#fMax','max');bind('#fType','type');bind('#fSort','sort');
  $$('[data-am]').forEach(b=>b.onclick=()=>{const a=b.dataset.am;F.amen=F.amen.includes(a)?F.amen.filter(x=>x!==a):[...F.amen,a];b.classList.toggle('active');draw()});
  $('#fClear').onclick=()=>{F={city:'',area:'',min:'',max:'',type:'',amen:[],sort:'featured',q:''};$('#gSearch').value='';home()};
  draw()}

/* ---------- details modal ---------- */
function details(id){const p=prop(id);if(!p)return;const o=owner(p.ownerId)||{};let cur=0;
  const revs=propReviews(id),r=avg(id);
  const body=()=>`<div class="grid" style="grid-template-columns:1fr 1fr;gap:20px;align-items:start" id="pgrid">
  <div class="property-media-wrap"><img class="main-image" id="mainImg" src="${esc(p.images[cur])}" alt=""><div class="thumbnail-gallery">${p.images.map((s,i)=>`<img src="${esc(s)}" data-i="${i}" class="${i===cur?'active':''}" alt="${esc(p.captions&&p.captions[i]||'')}">`).join('')}</div>
  <div class="text-muted small mt-2" id="cap">${esc(p.captions&&p.captions[cur]||'')}</div></div>
  <div><div class="d-flex gap-2 flex-wrap mb-2">${statusBadge(p)}<span class="badge bg-primary">${esc(typeLabel(p.type))}</span>${p.furnished?'<span class="badge bg-info">Furnished</span>':''}${p.utilities?'<span class="badge bg-secondary">Utilities included</span>':''}</div>
  <p class="text-muted">📍 ${esc(p.address)}${p.city&&!p.address.includes(p.city)?', '+esc(p.city):''}</p>
  <div class="price-box"><div style="font-size:1.8rem;font-weight:700">${inr(p.rent)}<small style="font-size:.9rem;font-weight:400"> / month</small></div><div style="opacity:.9">Security deposit: ${inr(p.deposit)}</div></div>
  <div class="grid cols-4 mb-3" style="gap:10px"><div class="info-card"><i>🛏️</i><div class="value">${p.beds}</div><div class="label">Bedrooms</div></div><div class="info-card"><i>🚿</i><div class="value">${p.baths}</div><div class="label">Bathrooms</div></div><div class="info-card"><i>📐</i><div class="value">${p.sqft||'—'}</div><div class="label">Sq.ft</div></div><div class="info-card"><i>👥</i><div class="value">${p.maxOcc}</div><div class="label">Occupants</div></div></div>
  <h6>About</h6><p>${esc(p.desc)}</p>
  <h6>Amenities</h6><div class="mb-3">${p.amenities.map(a=>`<span class="facility-badge">✅ ${esc(a)}</span>`).join('')||'<span class="text-muted">Not listed</span>'}</div>
  <h6>Nearby</h6><div class="mb-3">${p.nearby.map(a=>`<span class="nearby-badge">📍 ${esc(a)}</span>`).join('')}</div>
  <h6>House rules</h6><p class="small">${Object.entries(p.rules||{}).map(([k,v])=>`<b>${esc(k)}</b>: ${esc(v)}`).join(' · ')}</p>
  <h6>Owner</h6><div class="d-flex align-center gap-2 mb-3">${avatar(o.name||'?')}<div><b>${esc(o.name||'Owner')}</b><div class="small text-muted">${esc(o.company||'Verified owner')}${o.phone?' · '+esc(o.phone):''}</div></div></div>
  <div class="d-flex gap-2 flex-wrap mb-3"><button class="btn btn-primary" id="bookBtn" ${p.status!=='available'?'disabled':''}>📅 ${p.status==='available'?'Request booking':'Not available'}</button><button class="btn btn-outline-danger ${isFav(id)?'on':''}" id="favBtn">${isFav(id)?'❤️ Saved':'🤍 Save'}</button></div>
  <div id="bookForm" class="d-none card card-body mb-3"><h6>Booking request</h6><div class="grid cols-2"><div><label class="form-label">Move-in</label><input type="date" class="form-control" id="bStart" value="2026-11-01"></div><div><label class="form-label">Months</label><select class="form-select" id="bMon">${[3,6,9,12].map(m=>`<option>${m}</option>`).join('')}</select></div></div><div class="small text-muted mt-2" id="bTot"></div><button class="btn btn-success mt-2" id="bSend">Send request</button></div>
  <h6>Reviews ${revs.length?`<span class="small text-muted">${stars(r)} ${r.toFixed(1)} (${revs.length})</span>`:''}</h6>
  <div id="revList">${revs.map(v=>`<div class="review-card mb-2"><div class="d-flex between"><b>${esc(v.title)}</b>${stars(v.rating)}</div><p class="small mb-1">${esc(v.text)}</p><div class="small text-muted">${esc((P.student(v.studentId)||{}).name||'Student')} · ${fdate(v.date)}</div>${v.reply?`<div class="small mt-1" style="background:#f4f8ff;padding:6px 10px;border-radius:8px"><b>Owner:</b> ${esc(v.reply)}</div>`:''}</div>`).join('')||'<p class="text-muted small">No reviews yet.</p>'}</div>
  <button class="btn btn-sm btn-outline mt-2" id="wrBtn">✍️ Write a review</button></div></div>`;
  const m=modal({title:esc(p.title),wide:true,body:body(),onOpen:ov=>{
    const set=i=>{cur=i;$('#mainImg',ov).src=p.images[i];$('#cap',ov).textContent=(p.captions&&p.captions[i])||'';$$('.thumbnail-gallery img',ov).forEach((t,j)=>t.classList.toggle('active',j===i))};
    $$('.thumbnail-gallery img',ov).forEach(t=>t.onclick=()=>set(+t.dataset.i));
    $('#mainImg',ov).onclick=()=>set((cur+1)%p.images.length);
    if(window.innerWidth<900)$('#pgrid',ov).style.gridTemplateColumns='1fr';
    $('#favBtn',ov).onclick=()=>{toggleFav(id);$('#favBtn',ov).innerHTML=isFav(id)?'❤️ Saved':'🤍 Save';$('#favBtn',ov).classList.toggle('on',isFav(id));if(location.hash!=='#favorites')render();else render()};
    const tot=()=>{const mo=+$('#bMon',ov).value;$('#bTot',ov).textContent=`Total estimate: ${inr(p.rent*mo+p.deposit)} (${mo} × ${inr(p.rent)} + ${inr(p.deposit)} deposit)`};
    $('#bookBtn',ov).onclick=()=>needLogin(()=>{$('#bookForm',ov).classList.remove('d-none');tot()});
    $('#bMon',ov).onchange=tot;
    $('#bSend',ov).onclick=()=>{const st=$('#bStart',ov).value,mo=+$('#bMon',ov).value;if(!st)return toast('Choose a move-in date','err');
      const e=new Date(st);e.setMonth(e.getMonth()+mo);e.setDate(e.getDate()-1);
      P.db.bookings.push({id:P.nid(),propertyId:id,studentId:sid(),ownerId:p.ownerId,start:st,end:e.toISOString().slice(0,10),months:mo,rent:p.rent,deposit:p.deposit,total:p.rent*mo+p.deposit,status:'pending',payment:'pending',note:'',created:new Date().toISOString().slice(0,10),src:'demo'});
      P.notify(p.ownerId,'New Booking Request','A student wants to book your property: '+p.title,'booking');P.save();toast('Booking request sent!');m.close();location.hash='#bookings';render()};
    $('#wrBtn',ov).onclick=()=>needLogin(()=>{m.close();reviewForm(id)});
  }})}
function reviewForm(pid){let rate=5;
  const props=P.db.properties;
  const m=modal({title:'Write a review',body:`<div class="field"><label class="form-label">Property</label><select class="form-select" id="rvP">${props.map(p=>`<option value="${p.id}" ${p.id==pid?'selected':''}>${esc(p.title)}</option>`).join('')}</select></div>
  <div class="field"><label class="form-label">Rating</label><div id="rvStars" style="font-size:2rem;cursor:pointer;color:#f5b301"></div></div>
  <div class="field"><label class="form-label">Title</label><input class="form-control" id="rvT"></div><div class="field"><label class="form-label">Your experience</label><textarea class="form-control" rows="3" id="rvX"></textarea></div>`,
  foot:'<button class="btn btn-primary" id="rvGo">Submit review</button>',onOpen:ov=>{
    const draw=()=>{$('#rvStars',ov).innerHTML=[1,2,3,4,5].map(i=>`<span data-s="${i}">${i<=rate?'★':'☆'}</span>`).join('')};draw();
    $('#rvStars',ov).onclick=e=>{if(e.target.dataset.s){rate=+e.target.dataset.s;draw()}};
    $('#rvGo',ov).onclick=()=>{const t=$('#rvT',ov).value.trim(),x=$('#rvX',ov).value.trim();if(!t||!x)return toast('Please add a title and your experience','err');
      P.db.reviews.push({id:P.nid(),propertyId:+$('#rvP',ov).value,studentId:sid(),rating:rate,title:t,text:x,status:'pending',reply:'',date:new Date().toISOString().slice(0,10),src:'demo'});P.save();m.close();toast('Thanks! Your review will appear once approved.');render()}}})}

/* ---------- pages ---------- */
function favorites(){const ids=P.db.favorites.filter(f=>f.studentId==sid()).map(f=>f.propertyId);const l=ids.map(prop).filter(Boolean);
  $('#view').innerHTML=`<h3 class="page-title">❤️ My Favorites</h3>${sid()?'':'<div class="alert alert-info">You are browsing as a guest – favorites are saved on this device. <a href="#" id="lg">Login</a> to sync with your account.</div>'}<div class="grid cols-3" id="cards">${l.map(card).join('')||'<div class="empty-soft" style="grid-column:1/-1">No favorites yet. Tap the 🤍 on any property to save it here.</div>'}</div>`;
  bindCards($('#view'));if($('#lg'))$('#lg').onclick=e=>{e.preventDefault();loginModal()}}
function bookings(){
  if(!sid()){$('#view').innerHTML='<h3 class="page-title">📅 My Bookings</h3><div class="empty-soft">Please <a href="#" id="lg">login</a> as a student to see your bookings.</div>';$('#lg').onclick=e=>{e.preventDefault();loginModal()};return}
  const l=P.db.bookings.filter(b=>b.studentId==sid()).sort((a,b)=>b.id-a.id);
  $('#view').innerHTML=`<h3 class="page-title">📅 My Bookings</h3><div class="bookings-list">${l.map(b=>{const p=prop(b.propertyId)||{};return `<div class="booking-item" style="background:#fff;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 3px 10px rgba(0,0,0,.05)"><div class="d-flex between flex-wrap gap-2 align-center"><div class="d-flex gap-3 align-center"><img class="thumb-sm" src="${esc(img(p))}" alt=""><div><b>${esc(p.title)}</b><div class="small text-muted">${esc(p.city)} · ${fdate(b.start)} → ${fdate(b.end)}</div></div></div>${pill(b.status)}</div>
  <div class="small mt-2">Rent ${inr(b.rent)}/mo · Deposit ${inr(b.deposit)} · <b>Total ${inr(b.total)}</b> · Payment: ${esc(b.payment)}${b.note?' · '+esc(b.note):''}</div>
  <div class="mt-2 d-flex gap-2">${b.status==='pending'?`<button class="btn btn-sm btn-outline-danger" data-cancel="${b.id}">Cancel request</button>`:''}${['completed','active'].includes(b.status)||b.status==='approved'?`<button class="btn btn-sm btn-outline" data-rev="${p.id}">Write review</button>`:''}</div></div>`}).join('')||'<div class="empty-soft">No bookings yet. Open a property and tap “Request booking”.</div>'}</div>`;
  $$('[data-cancel]').forEach(b=>b.onclick=()=>{const x=P.db.bookings.find(y=>y.id==b.dataset.cancel);x.status='cancelled';x.note='Cancelled by student';P.save();toast('Request cancelled');render()});
  $$('[data-rev]').forEach(b=>b.onclick=()=>reviewForm(+b.dataset.rev))}
function reviews(){const l=P.db.reviews.filter(r=>r.status==='approved').sort((a,b)=>b.date.localeCompare(a.date));
  $('#view').innerHTML=`<div class="d-flex between align-center mb-3"><h3 class="page-title mb-0">⭐ Property Reviews</h3><button class="btn btn-primary" id="nr">✍️ Write a review</button></div><div class="grid cols-2">${l.map(v=>{const p=prop(v.propertyId)||{};return `<div class="review-card"><div class="d-flex between"><b>${esc(v.title)}</b>${stars(v.rating)}</div><div class="small text-primary chip-link" data-pv="${p.id}">${esc(p.title)}</div><p class="small mt-2 mb-1">${esc(v.text)}</p><div class="small text-muted">${esc((P.student(v.studentId)||{}).name||'Student')} · ${fdate(v.date)}</div>${v.reply?`<div class="small mt-2" style="background:#f4f8ff;padding:6px 10px;border-radius:8px"><b>Owner reply:</b> ${esc(v.reply)}</div>`:''}</div>`}).join('')}</div>`;
  $('#nr').onclick=()=>needLogin(()=>reviewForm());$$('[data-pv]').forEach(a=>a.onclick=()=>details(+a.dataset.pv))}
function feedback(){const ok=P.db.feedback.filter(f=>['reviewed','resolved'].includes(f.status));const a=ok.length?ok.reduce((x,f)=>x+f.rating,0)/ok.length:0;let rate=5;
  const mine=sess()?P.db.feedback.filter(f=>f.userId==sess().userId):[];
  $('#view').innerHTML=`<h3 class="page-title">💬 Platform Feedback</h3><div class="grid cols-2"><div class="card card-body"><div style="font-size:3rem;font-weight:700">${a.toFixed(1)}</div>${stars(a)}<div class="text-muted small mb-3">${ok.length} reviewed feedback</div>${[5,4,3,2,1].map(n=>{const c=ok.filter(f=>f.rating===n).length;return `<div class="d-flex align-center gap-2 mb-1"><span class="small" style="width:24px">${n}★</span><div class="bar flex-1"><i style="width:${ok.length?c/ok.length*100:0}%"></i></div><span class="small text-muted" style="width:20px">${c}</span></div>`}).join('')}</div>
  <div class="card card-body"><h5>Tell us what you think</h5><div class="field"><div id="fbS" style="font-size:2rem;color:#f5b301;cursor:pointer"></div></div><div class="field"><input class="form-control" id="fbT" placeholder="Title"></div><div class="field"><textarea class="form-control" rows="3" id="fbX" placeholder="Your feedback"></textarea></div><div class="field"><input class="form-control" id="fbG" placeholder="Suggestions (optional)"></div><button class="btn btn-primary" id="fbGo">Submit feedback</button></div></div>
  ${mine.length?`<h5 class="mt-4">Your feedback</h5>${mine.map(f=>`<div class="review-card mb-2"><div class="d-flex between"><b>${esc(f.title)}</b>${pill(f.status)}</div>${stars(f.rating)}<p class="small mb-0">${esc(f.text)}</p></div>`).join('')}`:''}
  <h5 class="mt-4">What others say</h5><div class="grid cols-2">${ok.map(f=>`<div class="review-card"><div class="d-flex between"><b>${esc(f.title)}</b>${stars(f.rating)}</div><p class="small mb-1">${esc(f.text)}</p><div class="small text-muted">${esc(f.name)} · ${esc(f.role==='landlord'?'Owner':'Student')}</div></div>`).join('')}</div>`;
  const draw=()=>$('#fbS').innerHTML=[1,2,3,4,5].map(i=>`<span data-s="${i}">${i<=rate?'★':'☆'}</span>`).join('');draw();
  $('#fbS').onclick=e=>{if(e.target.dataset.s){rate=+e.target.dataset.s;draw()}};
  $('#fbGo').onclick=()=>needLogin(()=>{const t=$('#fbT').value.trim(),x=$('#fbX').value.trim();if(!t||!x)return toast('Please add a title and feedback','err');const s=sess();
    P.db.feedback.unshift({id:P.nid(),userId:s.userId,name:s.name,role:'student',rating:rate,title:t,text:x,suggestions:$('#fbG').value,status:'pending',date:new Date().toISOString().slice(0,10),src:'demo'});P.save();toast('Thank you for your feedback!');feedback()})}
function about(){const d=P.db;
  $('#view').innerHTML=`<h3 class="page-title">ℹ️ About StaySmart</h3>
  <div class="card card-body mb-3">
    <p>StaySmart is built to make student housing simpler, safer, and more transparent. We help students discover verified accommodation options near their colleges, compare prices and amenities, and book with confidence.</p>
    <p class="mb-0">We also support property owners with an easy way to manage listings, respond to bookings, and keep every step of the rental journey organized.</p>
  </div>

  <div class="grid cols-3 mb-3">
    <div class="card card-body">
      <h5>Our Mission</h5>
      <p class="mb-0">To give students a stress-free way to find comfortable housing that fits their budget, location, and lifestyle.</p>
    </div>
    <div class="card card-body">
      <h5>Why Students Choose Us</h5>
      <p class="mb-0">Simple search filters, clear pricing, trusted reviews, and direct communication with owners in one place.</p>
    </div>
    <div class="card card-body">
      <h5>What We Support</h5>
      <p class="mb-0">Hostels, PGs, shared rooms, studios, and apartments for students looking for a home away from home.</p>
    </div>
  </div>

  <div class="card card-body mb-3"><h5>Contact Us</h5><div class="grid cols-3 mt-2"><div><b>Email</b><br><a href="mailto:${esc(d.settings.contact_email)}">${esc(d.settings.contact_email)}</a></div><div><b>Phone</b><br><a href="tel:9764470286">9764470286</a></div><div><b>Location</b><br>Ratnagiri</div></div></div>
  <div class="grid cols-4 mb-3">${[['🏠',d.properties.length,'Listings'],['🏢',d.owners.length,'Owners'],['🎓',d.students.length,'Students'],['⭐',d.reviews.filter(r=>r.status==='approved').length,'Reviews']].map(([i,v,l])=>`<div class="stat-card"><div class="stat-icon">${i}</div><div class="stat-value">${v}</div><div class="stat-label">${l}</div></div>`).join('')}</div>
  <div class="card card-body mb-3"><h5>How it works</h5><ol class="mb-0" style="padding-left:20px;line-height:2"><li>Search listings by city, area, price, accommodation type and amenities.</li><li>Review photos, house rules, amenities and student feedback before choosing a place.</li><li>Send a booking request and track its progress in My Bookings.</li><li>Connect with the owner, confirm the stay, and leave a review after the experience.</li></ol></div>
  <div class="card card-body"><h5>Quality & trust</h5><p>StaySmart combines practical filters, transparent pricing, and a streamlined booking flow to help students make informed decisions.</p><p class="mb-0">Platform commission: <b>${esc(d.settings.commission_rate)}%</b> · Minimum lease: <b>${esc(d.settings.minimum_lease_months)} months</b> · Support email: <b>${esc(d.settings.contact_email)}</b></p></div>
  <p class="src-note mt-3">Demo build: listings, accounts, bookings, reviews and feedback are stored in local browser data for quick testing.</p>`}

/* ---------- offline Ask AI ---------- */
function aiParse(q){const t=q.toLowerCase(),f={};
  const cities=[...new Set(P.db.properties.map(p=>p.city.toLowerCase()))];f.city=cities.find(c=>t.includes(c));
  const area=P.db.subareas.find(a=>t.includes(a.toLowerCase()));if(area)f.area=area;
  if(/hostel|pg\b|paying guest/.test(t))f.type='hostel';else if(/studio/.test(t))f.type='studio';else if(/apartment|flat|bhk/.test(t))f.type='apartment';else if(/shared|sharing/.test(t))f.type='shared_room';
  let m=t.match(/(?:under|below|less than|upto|up to|max|within|<)\s*₹?\s*(\d[\d,]*)(k?)/);if(m)f.max=+m[1].replace(/,/g,'')*(m[2]?1000:1);
  m=t.match(/(?:above|over|more than|min|at least)\s*₹?\s*(\d[\d,]*)(k?)/);if(m)f.min=+m[1].replace(/,/g,'')*(m[2]?1000:1);
  m=t.match(/(\d)\s*(?:bhk|bed)/);if(m)f.beds=+m[1];
  f.amen=[['wifi','WiFi'],['ac','AC'],['parking','Parking'],['geyser','Geyser'],['food|meal|mess','Home Food'],['kitchen','Kitchen']].filter(([k])=>new RegExp('\\b('+k+')\\b').test(t)).map(x=>x[1]);
  if(/furnished/.test(t))f.furn=true;f.cheap=/cheap|budget|affordable|lowest/.test(t);f.girls=/girl|women|ladies/.test(t);f.boys=/\bboys?\b/.test(t);return f}
function aiAnswer(q){const t=q.toLowerCase().trim();
  if(/^(hi|hello|hey|namaste)\b/.test(t))return {text:'Hi! 👋 Tell me what you need – for example “hostel in Ratnagiri under 4000 with wifi”.'};
  if(/thank/.test(t))return {text:'You\'re welcome! Ask me anything else about stays.'};
  if(/how.*book|book.*how/.test(t))return {text:'Open a property, tap “Request booking”, choose your move-in date and months, and send the request. The owner will approve or reject it and you can track it under My Bookings.'};
  if(/commission|fee/.test(t))return {text:`The platform commission rate is ${P.db.settings.commission_rate}%.`};
  const f=aiParse(q);
  let l=P.db.properties.filter(p=>p.status==='available'&&(!f.city||p.city.toLowerCase()===f.city)&&(!f.area||(p.area+p.address).toLowerCase().includes(f.area.toLowerCase()))&&(!f.type||p.type===f.type)&&(!f.max||p.rent<=f.max)&&(!f.min||p.rent>=f.min)&&(!f.beds||p.beds>=f.beds)&&f.amen.every(a=>p.amenities.includes(a))&&(!f.furn||p.furnished)&&(!f.girls||/girl|women/i.test(p.title+p.desc))&&(!f.boys||/boy/i.test(p.title+p.desc)));
  l.sort((a,b)=>f.cheap?a.rent-b.rent:(b.featured-a.featured)||avg(b.id)-avg(a.id));
  if(!Object.keys(f).some(k=>f[k]&&(!Array.isArray(f[k])||f[k].length)))return {text:'I can search the listings for you. Try: “cheap hostel in Ratnagiri”, “studio with AC under 6000” or “2BHK in Pune”.'};
  if(!l.length)return {text:'I could not find a listing matching all of that. Try a higher budget or fewer requirements.'};
  return {text:`I found ${l.length} match${l.length>1?'es':''}. Here ${l.length>3?'are the top 3':'you go'}:`,list:l.slice(0,3)}}
function ask(){
  $('#view').innerHTML=`<h3 class="page-title">🤖 Ask AI</h3><p class="text-muted">Offline assistant – searches the listings on this page. No internet or API key needed.</p><div class="chat-container" id="chat"></div>
  <div class="d-flex gap-2 flex-wrap mt-3 mb-2">${['Cheap hostel in Ratnagiri','Studio with AC under 6000','2BHK in Pune','PG for girls with food'].map(s=>`<button class="filter-badge" data-s="${s}" style="border:1px solid #dee2e6">${s}</button>`).join('')}</div>
  <div class="d-flex gap-2"><input class="form-control" id="aiQ" placeholder="Ask about stays…"><button class="btn btn-primary" id="aiGo">Send</button></div>`;
  const chat=$('#chat');
  const add=(who,html)=>{const d=document.createElement('div');d.className='chat-msg '+who;d.innerHTML=html;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d};
  add('bot','Hi! I\'m your StaySmart assistant 🏠 Tell me the city, budget and type of stay you want.');
  const send=q=>{q=q.trim();if(!q)return;add('me',esc(q));$('#aiQ').value='';const a=aiAnswer(q);
    const d=add('bot',esc(a.text));(a.list||[]).forEach(p=>{const m=document.createElement('div');m.className='mini';m.innerHTML=`<img src="${esc(img(p))}" alt=""><div><b>${esc(p.title)}</b><div class="small text-muted">${esc(p.city)} · ${inr(p.rent)}/mo · ${esc(typeLabel(p.type))}</div></div>`;m.onclick=()=>details(p.id);d.appendChild(m)});chat.scrollTop=chat.scrollHeight};
  $('#aiGo').onclick=()=>send($('#aiQ').value);$('#aiQ').onkeydown=e=>{if(e.key==='Enter')send(e.target.value)};
  $$('[data-s]').forEach(b=>b.onclick=()=>send(b.dataset.s))}

const R={home,favorites,bookings,reviews,feedback,about,ask};
function render(){const k=(location.hash||'#home').slice(1);const page=R[k]?k:'home';
  if(!$('#view'))shell();$$('.sidebar .nav-link[data-p]').forEach(a=>a.classList.toggle('active',a.dataset.p===page));
  $('#sidebar').classList.remove('show');$('#ovl').classList.remove('show');R[page]();if(page!==render.last)window.scrollTo(0,0);render.last=page}
shell();render();window.addEventListener('hashchange',render);
})();
