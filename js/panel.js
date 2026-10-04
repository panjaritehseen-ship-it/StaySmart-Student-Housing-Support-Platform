/* Shared core: state (localStorage), auth, helpers, modal, toast. Loaded by index.html, vendor.html, admin.html */
(function(){
const KEY='sh_db_v1',SKEY='sh_session_v1';
const clone=o=>JSON.parse(JSON.stringify(o));
const P={};
P.load=function(){let d=null;try{d=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(!d||!d.properties){d=clone(window.SEED);d.nextId=1000}return d};
P.db=P.load();
P.save=function(){try{localStorage.setItem(KEY,JSON.stringify(P.db))}catch(e){}};
P.reset=function(){try{localStorage.removeItem(KEY);localStorage.removeItem(SKEY)}catch(e){}location.reload()};
P.nid=function(){P.db.nextId=(P.db.nextId||1000)+1;return P.db.nextId};
P.session=function(){try{return JSON.parse(localStorage.getItem(SKEY))}catch(e){return null}};
P.setSession=function(s){try{s?localStorage.setItem(SKEY,JSON.stringify(s)):localStorage.removeItem(SKEY)}catch(e){}};
P.login=function(email,pw){const a=P.db.accounts.find(x=>x.email.toLowerCase()===String(email).trim().toLowerCase()&&x.password===pw);
  if(!a)return null;const s={email:a.email,role:a.role,userId:a.userId,name:a.name};P.setSession(s);return s};
P.logout=function(){P.setSession(null)};
P.home={student:'index.html',owner:'vendor.html',admin:'admin.html'};
/* helpers */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const fdate=d=>{if(!d)return '—';const x=new Date(String(d).replace(' ','T'));return isNaN(x)?d:x.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})};
const stars=n=>'<span class="stars">'+'★'.repeat(Math.round(n))+'<span style="color:#ddd">'+'★'.repeat(5-Math.round(n))+'</span></span>';
const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const avatar=(n,c)=>`<span class="avatar" style="${c?'background:'+c:''}">${esc(ini(n))}</span>`;
const IC={home:'🏠',heart:'❤️',book:'📅',star:'⭐',chat:'💬',info:'ℹ️',ai:'🤖',bell:'🔔',user:'👤',logout:'🚪',plus:'➕',money:'💰',build:'🏢',check:'✅',x:'❌',edit:'✏️',pin:'📍',bed:'🛏️',bath:'🚿',area:'📐',people:'👥',shield:'🛡️',list:'📋',menu:'☰',chart:'📊',wifi:'📶',trash:'🗑️',eye:'👁️',key:'🔑',school:'🎓',search:'🔍'};
const ic=n=>`<span class="i">${IC[n]||''}</span>`;
const TYPES={hostel:'Hostel',pg:'PG',apartment:'Apartment',shared_room:'Shared Room',studio:'Studio',house:'House',condo:'Condo'};
const typeLabel=t=>TYPES[t]||t;
const statusCls=s=>({pending:'status-pending',approved:'status-approved',rejected:'status-rejected',cancelled:'status-cancelled',active:'status-active',completed:'status-completed',reviewed:'status-approved',resolved:'status-completed'}[s]||'status-pending');
const pill=s=>`<span class="booking-status ${statusCls(s)}">${esc(String(s).replace(/^./,c=>c.toUpperCase()))}</span>`;
const prop=id=>P.db.properties.find(p=>p.id==id);
const owner=id=>P.db.owners.find(o=>o.id==id);
const student=id=>P.db.students.find(s=>s.id==id);
const img=p=>(p&&p.images&&p.images[0])||'images/properties/bedroom.jpg';
const propReviews=(id,all)=>P.db.reviews.filter(r=>r.propertyId==id&&(all||r.status==='approved'));
const avg=id=>{const r=propReviews(id);return r.length?r.reduce((a,b)=>a+b.rating,0)/r.length:0};
const notify=(userId,title,message,type)=>{P.db.notifications.unshift({id:P.nid(),userId,title,message,type:type||'system',read:false,date:new Date().toISOString().slice(0,19).replace('T',' '),src:'demo'});};
function toast(msg,kind){let w=$('.toast-wrap');if(!w){w=document.createElement('div');w.className='toast-wrap';document.body.appendChild(w)}
  const t=document.createElement('div');t.className='toast '+(kind||'ok');t.textContent=msg;w.appendChild(t);setTimeout(()=>t.remove(),3200)}
/* modal */
function modal(o){let ov=$('#dyn-modal');if(ov)ov.remove();ov=document.createElement('div');ov.id='dyn-modal';ov.className='overlay open';
  ov.innerHTML=`<div class="modal-box ${o.wide?'wide':''}" role="dialog"><div class="modal-header"><h5>${o.title||''}</h5><button class="modal-x" aria-label="Close">×</button></div><div class="modal-body">${o.body||''}</div>${o.foot?'<div class="modal-foot">'+o.foot+'</div>':''}</div>`;
  document.body.appendChild(ov);const close=()=>{ov.remove();o.onClose&&o.onClose()};
  ov.addEventListener('mousedown',e=>{if(e.target===ov)close()});$('.modal-x',ov).onclick=close;
  if(o.onOpen)o.onOpen(ov,close);return {el:ov,close}}
function confirmBox(msg,yes){const m=modal({title:'Please confirm',body:`<p>${esc(msg)}</p>`,foot:'<button class="btn" data-n>Cancel</button><button class="btn btn-danger" data-y>Confirm</button>'});
  $('[data-n]',m.el).onclick=m.close;$('[data-y]',m.el).onclick=()=>{m.close();yes()}}
/* login form (used on every page) */
function loginForm(opts){
  const accs=P.db.accounts.filter(a=>!opts.roles||opts.roles.includes(a.role));
  return `<form id="loginForm"><div class="field"><label class="form-label">Email</label><input class="form-control" name="email" type="email" required autocomplete="username"></div>
  <div class="field"><label class="form-label">Password</label><input class="form-control" name="password" type="password" required autocomplete="current-password"></div>
  <div id="loginErr" class="text-danger small mb-2"></div><button class="btn btn-primary btn-block btn-lg">Login</button></form>
  <div class="demo-box"><div class="small fw-semibold">🔑 Demo accounts (click to fill)</div>
  ${accs.map(a=>`<button type="button" class="demo-acc" data-e="${esc(a.email)}" data-p="${esc(a.password)}"><span><b>${esc(a.label)}</b><br><span class="text-muted">${esc(a.email)}</span></span><code>${esc(a.password)}</code></button>`).join('')}</div>`;}
function bindLogin(root,onOk){
  $$('.demo-acc',root).forEach(b=>b.onclick=()=>{const f=$('#loginForm',root);f.email.value=b.dataset.e;f.password.value=b.dataset.p});
  $('#loginForm',root).onsubmit=e=>{e.preventDefault();const f=e.target,s=P.login(f.email.value,f.password.value);
    if(!s){$('#loginErr',root).textContent='Invalid email or password. Use one of the demo accounts below.';return}onOk(s)}}
/* guard for vendor/admin pages: shows full-page login if not signed in with the required role */
P.guard=function(role,title,boot){
  const s=P.session();
  if(s&&s.role===role){boot(s);return}
  const root=document.getElementById('app');
  root.innerHTML=`<div class="login-wrap"><div class="login-card"><h3 class="text-center" style="color:#0066CC">Stay<span style="color:#e0a800">Smart</span></h3><p class="text-center text-muted">${esc(title)}</p>${s?`<div class="alert alert-info small">You are signed in as <b>${esc(s.name)}</b> (${esc(s.role)}). Log in with a ${role} account to continue.</div>`:''}${loginForm({roles:[role]})}<p class="text-center small mt-3 mb-0"><a href="index.html">← Back to student site</a></p></div></div>`;
  bindLogin(root,s2=>{location.href=P.home[s2.role]||'index.html'});
};
Object.assign(P,{$,$$,esc,inr,fdate,stars,ini,avatar,ic,IC,typeLabel,TYPES,statusCls,pill,prop,owner,student,img,propReviews,avg,notify,toast,modal,confirmBox,loginForm,bindLogin});
window.P=P;
})();
