/* © 2026 مهند رضا — جميع الحقوق محفوظة / All rights reserved */
(function(){
var tag=document.createElement("div");
tag.id="zp";
tag.style.cssText="position:fixed;top:calc(env(safe-area-inset-top,0px) + 96px);left:50%;transform:translateX(-50%);background:rgba(15,20,40,.82);color:#fff;border-radius:999px;padding:7px 16px;font-weight:700;z-index:30;display:none";
document.body.appendChild(tag);
var mx=0,my=0,on=false,d0=0,fs0=19,pz0=1,pz=1,raf=0,anc=null,top0=0,hideT=null;
var isPdf=function(){return window.BOOK&&window.BOOK.type==="pdf"};
function dist(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)}
function anchorEl(){
  var us=document.querySelectorAll("#book [data-u]");
  for(var i=0;i<us.length;i++){if(us[i].getBoundingClientRect().bottom>150)return us[i]}
  return null;
}
function apply(sc){
  if(isPdf()){
    pz=Math.max(1,Math.min(3,pz0*sc));
    document.documentElement.style.setProperty("--pz",pz.toFixed(3));
    tag.textContent=Math.round(pz*100)+"%";
  }else{
    window.fs=Math.max(14,Math.min(44,Math.round(fs0*sc)));
    document.documentElement.style.setProperty("--fs",window.fs+"px");
    var f=document.getElementById("fsv");if(f)f.textContent=window.fs;
    tag.textContent="حجم الخط "+window.fs;
  }
  tag.style.display="block";
  if(anc){var r=anc.getBoundingClientRect();if(Math.abs(r.top-top0)>1)window.scrollBy(0,r.top-top0)}
}
function repaint(){
  document.querySelectorAll(".pg").forEach(function(d){
    if(!d.querySelector("canvas:not(.ink)"))return;
    var r=d.getBoundingClientRect();
    if(r.bottom>-1500&&r.top<innerHeight+1500&&window.paintPage){window.paintPage(d);if(window.inkRedraw)window.inkRedraw(d)}
    else d.done=0;
  });
}
function finish(){
  if(!on)return;on=false;anc=null;
  if(isPdf())repaint();
  else{try{localStorage.setItem("fs",window.fs)}catch(e){}var r=document.getElementById("fsr");if(r)r.value=window.fs}
  clearTimeout(hideT);hideT=setTimeout(function(){tag.style.display="none"},700);
}
document.addEventListener("touchstart",function(e){
  if(e.touches.length===2&&document.getElementById("reader").style.display==="block"&&!(window.sheetOpen&&window.sheetOpen())){
    on=true;d0=dist(e.touches)||1;fs0=window.fs||19;pz0=pz;mx=(e.touches[0].clientX+e.touches[1].clientX)/2;my=(e.touches[0].clientY+e.touches[1].clientY)/2;
    anc=anchorEl();top0=anc?anc.getBoundingClientRect().top:0;
  }
},{passive:true});
document.addEventListener("touchmove",function(e){
  if(!on||e.touches.length!==2)return;
  e.preventDefault();
  var sc=dist(e.touches)/d0;
  var cx=(e.touches[0].clientX+e.touches[1].clientX)/2,cy=(e.touches[0].clientY+e.touches[1].clientY)/2,dx=cx-mx,dy=cy-my;mx=cx;my=cy;
  window.scrollBy(0,-dy);top0+=dy;
  var sec=anc&&anc.closest?anc.closest('section'):null;if(sec&&sec.scrollWidth>sec.clientWidth)sec.scrollLeft-=dx;
  cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){apply(sc)});
},{passive:false});
document.addEventListener("touchend",function(e){if(on&&e.touches.length<2)finish()},{passive:true});
document.addEventListener("touchcancel",finish,{passive:true});
})();
