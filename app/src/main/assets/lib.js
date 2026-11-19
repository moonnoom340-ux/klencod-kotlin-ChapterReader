(function(){
var DB=null,cur=null,tmr=null,LS=null;
try{LS=window.localStorage}catch(e){}
function ls(k,v){try{if(v===undefined)return LS.getItem(k);LS.setItem(k,v)}catch(e){}return null}
function st(n,m){return DB.transaction(n,m).objectStore(n)}
function rq(r){return new Promise(function(a,b){r.onsuccess=function(){a(r.result)};r.onerror=function(){b(r.error)}})}
function init(){return new Promise(function(a,b){
  var r=indexedDB.open("chapter-reader",1);
  r.onupgradeneeded=function(){r.result.createObjectStore("books",{keyPath:"id"});r.result.createObjectStore("files",{keyPath:"id"})};
  r.onsuccess=function(){DB=r.result;a()};r.onerror=function(){b(r.error)};
})}
function shown(){return el("reader").style.display==="block"&&document.querySelector("#book>section")}
function whenShown(cb){var n=0,t=setInterval(function(){n++;if(shown()){clearInterval(t);cb()}else if(n>480)clearInterval(t)},250)}

/* ---- position ---- */
function pos(){
  var secs=document.querySelectorAll("#book>section");if(!secs.length)return null;
  var k=0;secs.forEach(function(s,i){if(s.getBoundingClientRect().top<=140)k=i});
  var s=secs[k],top=s.getBoundingClientRect().top,m=document.documentElement.scrollHeight-innerHeight;
  return{ch:k,f:Math.max(0,140-top)/Math.max(1,s.offsetHeight),pct:m>0?scrollY/m:0};
}
function saveNow(){
  if(!DB||!cur||!cur.ready||!shown())return;
  var p=pos();if(!p)return;
  try{st("books","readwrite").put({id:cur.id,name:cur.name,at:Date.now(),pos:p,chs:document.querySelectorAll(".ch").length})}catch(e){}
}
function restore(p){
  var go=function(){
    var secs=document.querySelectorAll("#book>section"),s=secs[Math.min(p.ch,secs.length-1)];if(!s)return;
    window.scrollTo(0,Math.max(0,s.getBoundingClientRect().top+scrollY+p.f*s.offsetHeight-140));
  };
  go();setTimeout(go,600);
  var c=cur;setTimeout(function(){if(c)c.ready=true},1500);
}
function openSaved(m){
  showView("start");el("err").textContent="جارٍ فتح الكتاب…";
  rq(st("files","readonly").get(m.id)).then(function(r){
    if(!r){el("err").textContent="تعذّر العثور على ملف الكتاب.";return}
    var f=new File([r.blob],m.name,{type:r.blob.type});
    var c=cur={id:m.id,name:m.name,ready:false};
    whenShown(function(){if(c!==cur)return;if(m.pos)restore(m.pos);else c.ready=true});
    openBook(f);
  }).catch(function(){el("err").textContent="تعذّر فتح الكتاب."});
}

/* ---- UI ---- */
function hh(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;return h}
function ago(t){var d=Math.floor((Date.now()-t)/864e5);return d<1?"اليوم":d<2?"أمس":"قبل "+d+" أيام"}
function mk(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function pct(m){return m.pos?Math.round(m.pos.pct*100):0}
function strip(m){
  var d=mk("div","seg"),cap=Math.min(m.chs||1,30),p=m.pos?m.pos.pct:0;
  for(var i=0;i<cap;i++){
    var s=document.createElement("i"),f=p*cap;
    s.style.setProperty("--c",m.chs?hueOf(i):210);
    s.style.opacity=i+1<=f?1:(i<f?.6:.25);d.appendChild(s);
  }
  return d;
}
function card(m,del){
  var d=mk("div","bk"),n=mk("div","n");
  d.style.setProperty("--h",hh(m.name));
  n.appendChild(mk("b","",m.name.replace(/\.[^.]+$/,"")));
  n.appendChild(mk("small","",(m.pos?"وصلت إلى "+pct(m)+"%":"لم تبدأ بعد")+" · "+ago(m.at)));
  n.appendChild(strip(m));d.appendChild(n);
  if(del){
    var x=mk("button","x","حذف");
    x.onclick=function(ev){
      ev.stopPropagation();
      if(!x.dataset.c){x.dataset.c=1;x.textContent="تأكيد الحذف؟";setTimeout(function(){x.dataset.c="";x.textContent="حذف"},3000)}
      else Promise.all([rq(st("books","readwrite").delete(m.id)),rq(st("files","readwrite").delete(m.id))]).then(refresh);
    };
    d.appendChild(x);
  }
  d.onclick=function(){openSaved(m)};
  return d;
}
function hero(a){
  var h=el("hero");h.innerHTML="";
  var c=mk("div","card hero");
  if(!a.length){
    c.appendChild(mk("h2","","ابدأ بكتابك الأول"));
    c.appendChild(mk("small","","ارفع كتاباً فيلوّن لك كل فصل بلون مختلف، ويحفظ مكانك تلقائياً."));
  }else{
    var m=a[0];
    c.appendChild(mk("small","","متابعة القراءة"));
    c.appendChild(mk("h2","",m.name.replace(/\.[^.]+$/,"")));
    c.appendChild(strip(m));
    c.appendChild(mk("small","",(m.pos?"وصلت إلى "+pct(m)+"%":"لم تبدأ بعد")+" · "+ago(m.at)));
    var b=mk("button","cta","تابع القراءة");b.onclick=function(){openSaved(m)};c.appendChild(b);
  }
  h.appendChild(c);
}
function all(){return rq(st("books","readonly").getAll()).then(function(a){a.sort(function(x,y){return y.at-x.at});return a})}
function refresh(){
  if(!DB)return Promise.resolve();
  return all().then(function(a){
    hero(a);
    el("libCount").textContent=a.length?a.length+" كتاب":"فارغة";
    var r=el("recent");r.innerHTML="";
    if(a.length>1){r.appendChild(mk("h3","sec-t","آخر الكتب"));a.slice(1,4).forEach(function(m){r.appendChild(card(m,false))})}
    var l=el("liblist");l.innerHTML="";
    if(!a.length)l.appendChild(mk("p","muted","لا توجد كتب بعد. اضغط «كتاب جديد» من الرئيسية."));
    a.forEach(function(m){l.appendChild(card(m,true))});
  });
}

/* ---- settings ---- */
function theme(v){
  var r=document.documentElement;
  if(v==="light"||v==="dark")r.setAttribute("data-theme",v);else r.removeAttribute("data-theme");
  document.querySelectorAll("#thm button").forEach(function(b){b.classList.toggle("on",b.dataset.v===v)});
}
var tv=ls("theme")||"auto";theme(tv);
document.querySelectorAll("#thm button").forEach(function(b){b.onclick=function(){theme(b.dataset.v);ls("theme",b.dataset.v)}});
var f0=+ls("fs");if(f0>=14&&f0<=34){window.fs=f0;document.documentElement.style.setProperty("--fs",f0+"px")}
var fr=el("fsr");fr.value=window.fs;
fr.oninput=function(){window.fs=+fr.value;document.documentElement.style.setProperty("--fs",fr.value+"px");ls("fs",fr.value)};
var au=el("auto");au.checked=ls("auto")==="1";au.onchange=function(){ls("auto",au.checked?"1":"0")};

/* ---- navigation ---- */
el("goLib").onclick=function(){showView("libview");refresh()};
el("goSet").onclick=function(){showView("setview")};
el("back1").onclick=el("back2").onclick=function(){showView("start");refresh()};
el("again").addEventListener("click",function(){saveNow();cur=null;setTimeout(refresh,400)},true);

/* ---- phone back button ---- */
window.goBack=function(){
  var tp=document.getElementById("tp");
  if(tp&&tp.classList.contains("on")){tp.classList.remove("on");return true}
  if(el("reader").style.display==="block"){el("again").click();return true}
  if(el("libview").style.display==="block"||el("setview").style.display==="block"){showView("start");refresh();return true}
  return false;
};

/* ---- saving a newly picked book ---- */
el("file").addEventListener("change",function(e){
  var f=e.target.files[0];if(!f||!DB)return;
  var id=f.name+"|"+f.size,c=cur={id:id,name:f.name,ready:false};
  try{st("files","readwrite").put({id:id,blob:f})}catch(x){}
  rq(st("books","readonly").get(id)).then(function(old){
    var p=old&&old.pos;
    whenShown(function(){if(c!==cur)return;if(p)restore(p);else setTimeout(function(){c.ready=true},800)});
  });
});
addEventListener("scroll",function(){clearTimeout(tmr);tmr=setTimeout(saveNow,700)});
document.addEventListener("visibilitychange",function(){if(document.hidden)saveNow()});
addEventListener("pagehide",saveNow);
setInterval(saveNow,3000);

init().then(refresh).then(all).then(function(a){
  if(a[0]&&ls("auto")==="1")openSaved(a[0]);
}).catch(function(){});
})();
