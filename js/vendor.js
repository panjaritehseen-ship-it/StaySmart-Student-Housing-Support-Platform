/* Owner / vendor dashboard */
P.guard('owner','Owner Dashboard – sign in',function(sess){
const {$,$$,esc,inr,fdate,stars,avatar,typeLabel,pill,prop,student,img,avg,toast,modal,confirmBox}=P;
const OID=sess.userId, me=()=>P.owner(OID);
const myProps=()=>P.db.properties.filter(p=>p.ownerId==OID);
const myBook=()=>P.db.bookings.filter(b=>b.ownerId==OID).sort((a,b)=>b.id-a.id);
const myRev=()=>P.db.reviews.filter(r=>myProps().some(p=>p.id==r.propertyId)&&r.status!=='rejected');
const myNotes=()=>P.db.notifications.filter(n=>n.userId==OID).sort((a,b)=>b.date.localeCompare(a.date));
const unread=()=>myNotes().filter(n=>!n.read).length;
const pend=()=>myBook().filter(b=>b.status==='pending').length;
const rate=()=>+P.db.settings.commission_rate||5;
const NAV=[['dashboard','📊','Dashboard'],['properties','🏠','My Properties'],['bookings','📅','Bookings'],['reviews','⭐','Reviews'],['notifications','🔔','Notifications'],['add','➕','Add Property'],['profile','👤','Profile']];
let btab='all';
function shell(){
  $('#app').innerHTML=`<nav class="navbar-custom"><button class="menu-btn" id="mb">☰</button><a class="navbar-brand" href="vendor.html" style="text-decoration:none">Stay<span>Smart</span> <small style="font-size:.7rem;opacity:.8">Owner</small></a>
  <div class="nav-right"><a href="index.html" class="btn btn-sm btn-warning">Student site</a><span class="small d-none-sm">${esc(sess.name)}</span><button class="btn btn-sm btn-danger" id="lo">Logout</button></div></nav>
  <aside class="sidebar" id="sb"><div class="sidebar-header"><h3>Owner Panel</h3><p>${esc(me().name)}</p><small>${esc(me().company||'Property owner')}</small></div><div class="sidebar-menu" id="sm"></div></aside>
  <main class="main-content" id="view"></main>`;
  $('#mb').onclick=()=>$('#sb').classList.toggle('active');$('#lo').onclick=()=>{P.logout();location.href='index.html'};
  window.onresize=()=>{if(innerWidth>991)$('#sb').classList.add('active')};if(innerWidth>991)$('#sb').classList.add('active');
}
function menu(page){$('#sm').innerHTML=NAV.map(([k,i,l])=>`<a class="sidebar-link ${k===page?'active':''}" href="#${k}"><i>${i}</i><span>${l}</span>${k==='bookings'&&pend()?`<span class="badge bg-warning">${pend()}</span>`:''}${k==='notifications'&&unread()?`<span class="badge">${unread()}</span>`:''}</a>`).join('');
  if(innerWidth<=991)$('#sb').classList.remove('active')}
const title=(t,r)=>`<div class="d-flex between align-center flex-wrap gap-2 mb-3"><h3 class="mb-0">${t}</h3>${r||''}</div>`;

function dashboard(){const b=myBook(),pr=myProps();const paid=b.filter(x=>x.payment==='paid').reduce((a,x)=>a+x.total,0);
  const rv=myRev().filter(r=>r.status==='approved');const ar=rv.length?rv.reduce((a,r)=>a+r.rating,0)/rv.length:0;
  $('#view').innerHTML=title('Welcome back, '+esc(me().name.split(' ')[0])+' 👋')+`<div class="cards">
  <div class="stat-card" data-go="properties"><div class="ico">🏠</div><h2>${pr.length}</h2><div>Properties (${pr.filter(p=>p.status==='available').length} available)</div></div>
  <div class="stat-card" data-go="bookings"><div class="ico">📅</div><h2>${b.length}</h2><div>Total bookings</div></div>
  <div class="stat-card" data-go="bookings"><div class="ico">⏳</div><h2>${pend()}</h2><div>Pending requests</div></div>
  <div class="stat-card"><div class="ico">💰</div><h2>${inr(Math.round(paid*(1-rate()/100)))}</h2><div>Net earnings (after ${rate()}% fee)</div></div></div>
  <div class="grid cols-2"><div class="form-section"><h5>Recent booking requests</h5>${b.slice(0,4).map(x=>`<div class="d-flex between align-center mb-2"><div><b>${esc((student(x.studentId)||{}).name||'Student')}</b><div class="small text-muted">${esc((prop(x.propertyId)||{}).title)}</div></div>${pill(x.status)}</div>`).join('')||'<p class="text-muted">No bookings yet.</p>'}</div>
  <div class="form-section"><h5>Reviews <span class="small text-muted">${rv.length?stars(ar)+' '+ar.toFixed(1):''}</span></h5>${rv.slice(0,3).map(r=>`<div class="mb-2"><b>${esc(r.title)}</b> ${stars(r.rating)}<div class="small text-muted">${esc((prop(r.propertyId)||{}).title)}</div></div>`).join('')||'<p class="text-muted">No reviews yet.</p>'}</div></div>`;
  $$('[data-go]').forEach(c=>c.onclick=()=>location.hash='#'+c.dataset.go)}

function properties(){const l=myProps();
  $('#view').innerHTML=title('My Properties','<a class="btn btn-primary" href="#add">➕ Add property</a>')+`<div class="room-grid">${l.map(p=>`<div class="room-card"><div class="room-image"><img src="${esc(img(p))}" alt=""><span class="image-count">📷 ${p.images.length}</span></div><div class="room-details"><div class="room-title">${esc(p.title)}</div>
  <div class="room-meta"><span>📍 ${esc(p.city)}</span><span>${esc(typeLabel(p.type))}</span></div><div class="d-flex between align-center"><span class="room-price">${inr(p.rent)}/mo</span><span class="booking-status ${p.status==='available'?'status-approved':'status-warning'}">${p.status==='available'?'Available':p.status==='occupied'?'Occupied':'Unavailable'}</span></div>
  <div class="room-actions"><button class="btn btn-primary btn-sm" data-edit="${p.id}">✏️ Edit</button><button class="btn btn-warning btn-sm" data-tog="${p.id}">${p.status==='available'?'Mark occupied':'Mark available'}</button><button class="btn btn-danger btn-sm" data-del="${p.id}">🗑️</button></div></div></div>`).join('')||'<div class="empty-soft">You have no properties yet.</div>'}</div>`;
  $$('[data-tog]').forEach(b=>b.onclick=()=>{const p=prop(b.dataset.tog);p.status=p.status==='available'?'occupied':'available';P.save();toast('Status updated');route()});
  $$('[data-edit]').forEach(b=>b.onclick=()=>editProp(+b.dataset.edit));
  $$('[data-del]').forEach(b=>b.onclick=()=>confirmBox('Delete this property listing?',()=>{P.db.properties=P.db.properties.filter(p=>p.id!=b.dataset.del);P.save();toast('Property deleted');route()}))}
const AM=['WiFi','AC','Parking','Geyser','Home Food','Kitchen','Heater','Gym'];
function propForm(p){p=p||{};return `<div class="row2"><div><label>Title</label><input id="fT" value="${esc(p.title||'')}"></div><div><label>Type</label><select id="fTy">${['hostel','apartment','shared_room','studio'].map(t=>`<option value="${t}" ${p.type===t?'selected':''}>${typeLabel(t)}</option>`).join('')}</select></div>
  <div><label>City</label><input id="fC" value="${esc(p.city||'')}"></div><div><label>Area / locality</label><input id="fAr" value="${esc(p.area||'')}"></div></div>
  <label>Address</label><input id="fAd" value="${esc(p.address||'')}">
  <div class="row2"><div><label>Monthly rent (₹)</label><input id="fR" type="number" min="0" value="${p.rent||''}"></div><div><label>Security deposit (₹)</label><input id="fD" type="number" min="0" value="${p.deposit??''}"></div>
  <div><label>Bedrooms</label><input id="fB" type="number" min="1" value="${p.beds||1}"></div><div><label>Bathrooms</label><input id="fBa" type="number" min="1" value="${p.baths||1}"></div>
  <div><label>Max occupants</label><input id="fO" type="number" min="1" value="${p.maxOcc||1}"></div><div><label>Available from</label><input id="fAv" type="date" value="${p.availFrom||''}"></div></div>
  <label>Amenities</label><div class="d-flex flex-wrap gap-3 mb-2">${AM.map(a=>`<label style="font-weight:400"><input type="checkbox" style="width:auto;margin:0 4px 0 0" name="am" value="${a}" ${(p.amenities||[]).includes(a)?'checked':''}>${a}</label>`).join('')}</div>
  <label>Description</label><textarea id="fDe" rows="3">${esc(p.desc||'')}</textarea>`}
function readForm(r){const g=id=>r.querySelector(id).value;
  return {title:g('#fT').trim(),type:g('#fTy'),city:g('#fC').trim(),area:g('#fAr').trim(),address:g('#fAd').trim(),rent:+g('#fR'),deposit:+g('#fD')||0,beds:+g('#fB')||1,baths:+g('#fBa')||1,maxOcc:+g('#fO')||1,availFrom:g('#fAv')||null,desc:g('#fDe').trim(),amenities:[...r.querySelectorAll('[name=am]:checked')].map(x=>x.value)}}
function editProp(id){const p=prop(id);const m=modal({title:'Edit property',wide:true,body:'<div class="form-section" style="box-shadow:none;padding:0">'+propForm(p)+'</div>',foot:'<button class="btn" id="c">Cancel</button><button class="btn btn-primary" id="s">Save changes</button>',onOpen:ov=>{$('#c',ov).onclick=()=>m.close();
  $('#s',ov).onclick=()=>{const d=readForm(ov);if(!d.title||!d.rent||!d.city)return toast('Title, city and rent are required','err');Object.assign(p,d);P.save();m.close();toast('Property updated');route()}}})}
let pending=[];
function add(){pending=[];
  $('#view').innerHTML=title('Add Property')+`<div class="form-section">${propForm()}<label>Photos</label><div class="image-upload-area" id="drop"><div style="font-size:2rem">📷</div>Click to choose photos (optional – a default photo is used if none)<input type="file" id="fi" accept="image/*" multiple style="display:none"></div><div class="image-preview" id="pv"></div><button class="btn btn-success mt-3" id="sv">Publish property</button></div>`;
  $('#drop').onclick=()=>$('#fi').click();
  $('#fi').onchange=e=>[...e.target.files].slice(0,5).forEach(f=>{const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const sc=Math.min(1,800/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*sc;c.height=im.height*sc;c.getContext('2d').drawImage(im,0,0,c.width,c.height);pending.push(c.toDataURL('image/jpeg',.7));prev()};im.src=rd.result};rd.readAsDataURL(f)});
  const prev=()=>$('#pv').innerHTML=pending.map((s,i)=>`<div class="preview-item"><img class="preview-image" src="${s}" alt=""><span class="preview-remove" data-r="${i}">×</span>${i===0?'<span class="primary-badge">Primary</span>':''}</div>`).join('')+'';
  $('#pv').onclick=e=>{if(e.target.dataset.r!==undefined){pending.splice(+e.target.dataset.r,1);prev()}};
  $('#sv').onclick=()=>{const d=readForm($('#view'));if(!d.title||!d.rent||!d.city||!d.address)return toast('Please fill title, city, address and rent','err');
    P.db.properties.push(Object.assign({id:P.nid(),ownerId:OID,furnished:false,utilities:false,nearby:['Bus stop','Market'],rules:{guests:'limited'},status:'available',featured:false,images:pending.length?pending.slice():['images/properties/bedroom.jpg'],captions:[],sqft:null,created:new Date().toISOString().slice(0,10),src:'demo'},d));
    P.save();toast('Property published – visible on the student site');location.hash='#properties'}}

function bookings(){const all=myBook(),T=['all','pending','approved','active','completed','rejected','cancelled'];const l=btab==='all'?all:all.filter(b=>b.status===btab);
  $('#view').innerHTML=title('Bookings')+`<div class="section-tabs">${T.map(t=>`<button class="tab-btn ${t===btab?'active':''}" data-t="${t}">${t[0].toUpperCase()+t.slice(1)} <span class="badge" style="background:${t===btab?'#fff;color:#0066CC':'#ddd;color:#333'}">${t==='all'?all.length:all.filter(b=>b.status===t).length}</span></button>`).join('')}</div>
  <div class="bookings-list">${l.map(b=>{const s=student(b.studentId)||{name:'Student'},p=prop(b.propertyId)||{};return `<div class="booking-item"><div class="booking-header"><div class="booking-student d-flex gap-2 align-center">${avatar(s.name)}<div><h5>${esc(s.name)}</h5><small>${esc(s.email||'')}${s.phone?' · '+esc(s.phone):''}</small></div></div>${pill(b.status)}</div>
  <div class="booking-details"><div class="detail-item">🏠 ${esc(p.title)}</div><div class="detail-item">📅 ${fdate(b.start)} → ${fdate(b.end)}</div><div class="detail-item">💵 ${inr(b.rent)}/mo + ${inr(b.deposit)} deposit</div><div class="detail-item">🧾 Total ${inr(b.total)} · ${esc(b.payment)}</div></div>${b.note?`<div class="small text-muted mb-2">Note: ${esc(b.note)}</div>`:''}
  <div class="booking-actions">${b.status==='pending'?`<button class="btn btn-success btn-sm" data-a="approved" data-id="${b.id}">✅ Approve</button><button class="btn btn-danger btn-sm" data-a="rejected" data-id="${b.id}">❌ Reject</button>`:''}${b.status==='approved'?`<button class="btn btn-info btn-sm" data-a="active" data-id="${b.id}">▶ Mark active</button>`:''}${b.status==='active'?`<button class="btn btn-primary btn-sm" data-a="completed" data-id="${b.id}">🏁 Mark completed</button>`:''}</div></div>`}).join('')||'<div class="empty-soft">No bookings in this tab.</div>'}</div>`;
  $$('[data-t]').forEach(b=>b.onclick=()=>{btab=b.dataset.t;bookings();menu('bookings')});
  $$('[data-a]').forEach(b=>b.onclick=()=>{const x=P.db.bookings.find(y=>y.id==b.dataset.id),a=b.dataset.a;
    const done=note=>{x.status=a;if(note)x.note=note;P.notify(x.studentId,'Booking '+a,'Your booking for '+(prop(x.propertyId)||{}).title+' was '+a+' by the owner.','booking');P.save();toast('Booking '+a);bookings();menu('bookings')};
    if(a==='rejected'){const m=modal({title:'Reject booking',body:'<label class="form-label">Reason (shown to student)</label><input class="form-control" id="rr" placeholder="e.g. Room already allotted">',foot:'<button class="btn btn-danger" id="go">Reject</button>',onOpen:ov=>$('#go',ov).onclick=()=>{const v=$('#rr',ov).value.trim();m.close();done(v?'Rejected: '+v:'')}})}else done()})}

function reviews(){const l=myRev().sort((a,b)=>b.id-a.id);
  $('#view').innerHTML=title('Reviews on my properties')+(l.map(r=>`<div class="booking-item mb-3"><div class="booking-header"><div><b>${esc(r.title)}</b> ${stars(r.rating)}<div class="small text-muted">${esc((prop(r.propertyId)||{}).title)} · ${esc((student(r.studentId)||{}).name||'Student')} · ${fdate(r.date)}</div></div>${pill(r.status)}</div><p class="mb-2">${esc(r.text)}</p>
  ${r.reply?`<div class="small" style="background:#f4f8ff;padding:8px 12px;border-radius:8px"><b>Your reply:</b> ${esc(r.reply)}</div>`:''}<button class="btn btn-sm btn-primary mt-2" data-rp="${r.id}">${r.reply?'Edit reply':'Reply'}</button></div>`).join('')||'<div class="empty-soft">No reviews yet.</div>');
  $$('[data-rp]').forEach(b=>b.onclick=()=>{const r=P.db.reviews.find(x=>x.id==b.dataset.rp);const m=modal({title:'Reply to review',body:`<textarea class="form-control" rows="4" id="rt">${esc(r.reply)}</textarea>`,foot:'<button class="btn btn-primary" id="go">Post reply</button>',onOpen:ov=>$('#go',ov).onclick=()=>{r.reply=$('#rt',ov).value.trim();P.save();m.close();toast('Reply saved');reviews()}})})}
function notifications(){const l=myNotes();
  $('#view').innerHTML=title('Notifications',`<button class="btn btn-primary" id="ma">Mark all read</button>`)+(l.map(n=>`<div class="booking-item mb-2" style="${n.read?'':'border-left:4px solid #0066CC'}"><div class="d-flex between"><b>${n.type==='booking'?'📅':'🔔'} ${esc(n.title)}</b><small class="text-muted">${fdate(n.date)}</small></div><div class="small">${esc(n.message)}</div></div>`).join('')||'<div class="empty-soft">No notifications.</div>');
  $('#ma').onclick=()=>{l.forEach(n=>n.read=true);P.save();toast('All marked as read');notifications();menu('notifications')}}
function profile(){const o=me();
  $('#view').innerHTML=title('My Profile')+`<div class="form-section"><div class="d-flex gap-3 align-center mb-3">${avatar(o.name).replace('avatar"','avatar" style="width:64px;height:64px;font-size:1.5rem"')}<div><h4 class="mb-0">${esc(o.name)}</h4><span class="booking-status ${o.status==='approved'?'status-approved':'status-pending'}">${o.status==='approved'?'Approved owner':'Approval '+esc(o.status)}</span></div></div>
  <div class="row2"><div><label>Full name</label><input id="pn" value="${esc(o.name)}"></div><div><label>Phone</label><input id="pp" value="${esc(o.phone||'')}"></div><div><label>Email</label><input id="pe" value="${esc(o.email)}" disabled></div><div><label>City</label><input id="pc" value="${esc(o.city||'')}"></div><div><label>Company</label><input id="pco" value="${esc(o.company||'')}"></div><div><label>License no.</label><input value="${esc(o.license||'—')}" disabled></div></div>
  <button class="btn btn-primary" id="ps">Save profile</button></div>`;
  $('#ps').onclick=()=>{o.name=$('#pn').value.trim()||o.name;o.phone=$('#pp').value;o.city=$('#pc').value;o.company=$('#pco').value;P.save();toast('Profile saved');shell();route()}}

const R={dashboard,properties,bookings,reviews,notifications,add,profile};
function route(){const k=(location.hash||'#dashboard').slice(1),pg=R[k]?k:'dashboard';menu(pg);R[pg]();window.scrollTo(0,0)}
shell();route();addEventListener('hashchange',route);
});
