(function(){
var DB=null,cur=null,tmr=null;
var css=document.createElement("style");
css.textContent="#lib{margin-top:28px;text-align:start}#lib h2{font-size:18px;margin:0 0 10px}.bk{display:flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:8px;cursor:pointer}.bk .n{flex:1;min-width:0}.bk .n b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bk .n small{color:var(--muted)}.bk .x{color:#c0392b}";
document.head.appendChild(css);
var box=document.createElement("div");box.id="lib";el("start").appendChild(box);

function st(n,m){return DB.transaction(n,m).objectStore(n)}
function rq(r){return new Promise(function(a,b){r.onsuccess=function(){a(r.result)};r.onerror=function(){b(r.error)}})}
function init(){return new Promise(function(a,b){
  var r=indexedDB.open("chapter-reader",1);
  r.onupgradeneeded=function(){r.result.createObjectStore("books",{keyPath:"id"});r.result.createObjectStore("files",{keyPath:"id"})};
  r.onsuccess=function(){DB=r.result;a()};r.onerror=function(){b(r.error)};
})}
function shown(){return el("reader").style.display==="block"&&document.querySelector(".ch")}
function whenShown(cb){var n=0,t=setInterval(function(){n++;if(shown()){clearInterval(t);cb()}else if(n>480)clearInterval(t)},250)}

function pos(){
  var secs=document.querySelectorAll(".ch");if(!secs.length)return null;
  var k=0;secs.forEach(function(s,i){if(s.getBoundingClientRect().top<=140)k=i});
  var s=secs[k],top=s.getBoundingClientRect().top,m=document.documentElement.scrollHeight-innerHeight;
  return{ch:k,f:Math.max(0,140-top)/Math.max(1,s.offsetHeight),pct:m>0?scrollY/m:0};
}
function saveNow(){
  if(!DB||!cur||!cur.ready||!shown())return;
  var p=pos();if(!p)return;
  try{st("books","readwrite").put({id:cur.id,name:cur.name,at:Date.now(),pos:p})}catch(e){}
}
function restore(p){
  var go=function(){
    var secs=document.querySelectorAll(".ch"),s=secs[Math.min(p.ch,secs.length-1)];if(!s)return;
    window.scrollTo(0,Math.max(0,s.getBoundingClientRect().top+scrollY+p.f*s.offsetHeight-140));
  };
  go();setTimeout(go,600);
  var c=cur;setTimeout(function(){if(c)c.ready=true},1500);
}
function openSaved(m){
  rq(st("files","readonly").get(m.id)).then(function(r){
    if(!r){el("err").textContent="";return}
    var f=new File([r.blob],m.name,{type:r.blob.type});
    var c=cur={id:m.id,name:m.name,ready:false};
    whenShown(function(){if(c!==cur)return;if(m.pos)restore(m.pos);else c.ready=true});
    openBook(f);
  }).catch(function(){el("err").textContent=""});
}
function list(a){
  box.innerHTML="";
  if(!a.length)return;
  var h=document.createElement("h2");h.textContent="كتبي";box.appendChild(h);
  a.forEach(function(m){
    var d=document.createElement("div");d.className="bk";
    var n=document.createElement("div");n.className="n";
    var b=document.createElement("b");b.textContent=m.name.replace(/\.[^.]+$/,"");
    var sm=document.createElement("small");
    sm.textContent=m.pos?("وصلت إلى "+Math.round(m.pos.pct*100)+"%"):"لم تبدأ بعد";
    n.appendChild(b);n.appendChild(sm);
    var x=document.createElement("button");x.className="x";x.textContent="حذف";
    x.onclick=function(ev){ev.stopPropagation();
      Promise.all([rq(st("books","readwrite").delete(m.id)),rq(st("files","readwrite").delete(m.id))]).then(refresh)};
    d.appendChild(n);d.appendChild(x);
    d.onclick=function(){el("err").textContent="جارٍ فتح الكتاب…";openSaved(m)};
    box.appendChild(d);
  });
}
function all(){return rq(st("books","readonly").getAll()).then(function(a){a.sort(function(x,y){return y.at-x.at});return a})}
function refresh(){return all().then(list)}

el("file").addEventListener("change",function(e){
  var f=e.target.files[0];if(!f||!DB)return;
  var id=f.name+"|"+f.size,c=cur={id:id,name:f.name,ready:false};
  try{st("files","readwrite").put({id:id,blob:f})}catch(x){}
  rq(st("books","readonly").get(id)).then(function(old){
    var p=old&&old.pos;
    whenShown(function(){if(c!==cur)return;if(p)restore(p);else setTimeout(function(){c.ready=true},800)});
  });
});
el("again").addEventListener("click",function(){saveNow();cur=null;setTimeout(refresh,400)},true);
addEventListener("scroll",function(){clearTimeout(tmr);tmr=setTimeout(saveNow,700)});
document.addEventListener("visibilitychange",function(){if(document.hidden)saveNow()});
addEventListener("pagehide",saveNow);
setInterval(saveNow,3000);

init().then(all).then(function(a){
  list(a);
  if(a[0]){el("err").textContent="جارٍ فتح آخر كتاب…";openSaved(a[0])}
}).catch(function(){});
})();
