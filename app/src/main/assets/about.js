/* © 2026 مهند رضا — جميع الحقوق محفوظة */
(function(){
var OWNER={name:"مهند رضا",year:2026,app:"قارئ الفصول",pkg:"com.chapterreader.app",ver:"1.0"};
var css=document.createElement("style");
css.textContent=".ab-h{text-align:center;padding:22px 16px}.ab-h svg{width:72px;height:72px}.ab-h h3{margin:10px 0 2px;font-size:24px}.ab-h small{color:var(--muted)}"+
".ab-r{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);align-items:flex-start}.ab-r:last-child{border-bottom:0}.ab-r span{color:var(--muted);flex:none}.ab-r b{text-align:end;word-break:break-word}"+
".ab-fp{direction:ltr;font-family:monospace;letter-spacing:.5px;font-size:13px}.ab-n{color:var(--muted);font-size:13px;line-height:1.8;margin:14px 4px}.ab-c{width:100%;margin-top:14px;padding:13px;border:0;border-radius:16px;background:var(--g,linear-gradient(135deg,#4f46e5,#7c3aed));color:#fff;font-weight:700}";
document.head.appendChild(css);

var logo=document.querySelector(".brand .logo");
var v=el("aboutview");
v.innerHTML='<div class="top"><button class="ib" id="back3" aria-label="رجوع"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button><h2>حول التطبيق</h2></div>'+
'<div class="card ab-h">'+(logo?logo.outerHTML:"")+'<h3>'+OWNER.app+'</h3><small>الإصدار '+OWNER.ver+'</small></div>'+
'<div class="card" style="margin-top:14px">'+
'<div class="ab-r"><span>المالك والمطوّر</span><b>'+OWNER.name+'</b></div>'+
'<div class="ab-r"><span>حقوق النشر</span><b>© '+OWNER.year+' '+OWNER.name+'</b></div>'+
'<div class="ab-r"><span>معرّف التطبيق</span><b class="ab-fp">'+OWNER.pkg+'</b></div>'+
'<div class="ab-r"><span>بصمة الملكية</span><b class="ab-fp" id="abfp">…</b></div>'+
'</div>'+
'<p class="ab-n">جميع الحقوق محفوظة. لا يجوز نسخ التطبيق أو توزيعه أو تعديله أو بيعه دون إذن كتابي من المالك. المكتبات الخارجية المستخدمة (قراءة Word وPDF) تبقى مملوكة لأصحابها وتخضع لتراخيصها.</p>'+
'<button class="ab-c" id="abcopy">نسخ بيان الملكية</button>';

var fpv="—";
function statement(){
  return OWNER.app+" © "+OWNER.year+" "+OWNER.name+". جميع الحقوق محفوظة. معرّف التطبيق: "+OWNER.pkg+". بصمة الملكية: "+fpv;
}
try{
  var data=new TextEncoder().encode([OWNER.name,OWNER.pkg,OWNER.year].join("|"));
  crypto.subtle.digest("SHA-256",data).then(function(h){
    var s=Array.from(new Uint8Array(h)).map(function(b){return b.toString(16).padStart(2,"0")}).join("").toUpperCase();
    fpv=s.slice(0,32).match(/.{8}/g).join("-");el("abfp").textContent=fpv;
  }).catch(function(){el("abfp").textContent="—"});
}catch(e){el("abfp").textContent="—"}

el("abcopy").onclick=function(){
  var t=statement(),b=el("abcopy"),ok=function(){b.textContent="تم النسخ ✓";setTimeout(function(){b.textContent="نسخ بيان الملكية"},1800)};
  function fallback(){var a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove();ok()}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok).catch(fallback);else fallback();
};
el("back3").onclick=function(){showView("setview")};

/* entry in settings + footer on home */
var card=document.querySelector("#setview .card");
if(card){
  var r=document.createElement("div");r.className="row2";
  r.innerHTML='<span>حول التطبيق وحقوق الملكية</span><button id="goAbout">عرض</button>';
  card.appendChild(r);
  el("goAbout").onclick=function(){showView("aboutview")};
}
var f=document.createElement("p");f.className="muted";f.textContent="© "+OWNER.year+" "+OWNER.name+" · جميع الحقوق محفوظة";
el("start").appendChild(f);
})();
