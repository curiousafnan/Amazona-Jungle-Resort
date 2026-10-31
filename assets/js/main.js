/* Amazona Jungle Resort · shared site script (multi-page site and single-file bundle) */
(function(){
  function $(id){return document.getElementById(id);}
  function pad(n){return (n<10?"0":"")+n;}
  var reduceMotion=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)");
  function smooth(){return reduceMotion&&reduceMotion.matches?"auto":"smooth";}

  /* ---------- currency ---------- */
  /* prices are set in USD; IDR and EUR are fixed indicative rates */
  var FX={IDR_PER_USD:16300, IDR_PER_EUR:17600};
  var RATES={USD:1, IDR:FX.IDR_PER_USD, EUR:FX.IDR_PER_USD/FX.IDR_PER_EUR};
  var SYM={IDR:"IDR ", EUR:"€", USD:"$"};
  var CCY="USD";
  try{var s=localStorage.getItem("amz_ccy_v2"); if(s&&RATES[s]) CCY=s;}catch(e){}
  /* F17: convert once, round once, then do all maths in the display currency */
  function conv(usd){return Math.round((+usd||0)*RATES[CCY]);}
  function fmtD(v){return CCY==="IDR"?"IDR "+v.toLocaleString("id-ID"):SYM[CCY]+v.toLocaleString("en-US");}
  function fmt(usd){return fmtD(conv(usd));}
  window.fmtMoney=fmt; window.amzConv=conv; window.amzFmtD=fmtD;
  function apply(){
    document.querySelectorAll(".ccy").forEach(function(t){t.textContent=fmt(t.getAttribute("data-usd"));});
    document.querySelectorAll("select[data-prices] option").forEach(function(o){var p=o.getAttribute("data-price");
      if(p) o.textContent=o.getAttribute("data-name")+" · from "+fmt(p)+" / night";});
    document.querySelectorAll(".curSel").forEach(function(c){c.value=CCY;});
    document.dispatchEvent(new Event("ccychange"));
  }
  document.addEventListener("change",function(e){if(e.target.classList&&e.target.classList.contains("curSel")){
    CCY=e.target.value; try{localStorage.setItem("amz_ccy_v2",CCY);}catch(x){} apply();}});

  /* long-stay discount tiers */
  function tier(n){return n>=30?26:n>=14?16:n>=10?11:n>=7?10:0;}
  window.amzTier=tier;

  /* ---------- dialogs: focus in, trap Tab, Esc, focus back (F6) ---------- */
  var FOCUSABLE='a[href],button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function visible(el){return el.getClientRects().length>0&&getComputedStyle(el).visibility!=="hidden";}
  function trap(e,box){
    var f=[].filter.call(box.querySelectorAll(FOCUSABLE),visible); if(!f.length)return;
    var a=f[0], z=f[f.length-1], act=document.activeElement;
    if(!box.contains(act)){e.preventDefault();a.focus();}
    else if(e.shiftKey&&act===a){e.preventDefault();z.focus();}
    else if(!e.shiftKey&&act===z){e.preventDefault();a.focus();}
  }
  function setInert(on){
    document.querySelectorAll("body > nav, body > main, body > footer, body > .note, body > .wa").forEach(function(el){
      if(on) el.setAttribute("inert",""); else el.removeAttribute("inert");});
  }
  var openDialog=null;

  /* ---------- menu ---------- */
  window.menu=function(on){var m=$("menu"); if(!m)return;
    on=!!on; if(m.classList.contains("on")===on) return;
    var b=document.querySelector(".burger");
    m.classList.toggle("on",on); document.body.style.overflow=on?"hidden":"";
    if(b) b.setAttribute("aria-expanded",on?"true":"false");
    setInert(on);
    if(on){openDialog=m; var c=m.querySelector(".mclose"); if(c) c.focus();}
    else{openDialog=null; if(b&&visible(b)) b.focus({preventScroll:true});}
  };

  /* ---------- lightbox ---------- */
  var LB={list:[],i:0,opener:null};
  function bgv(u){return /^(var|url)\(/.test(u)?u:'url("'+u+'")';}
  window.amzParams=function(){var h=location.hash,i=h.indexOf("?");return new URLSearchParams(i>=0?h.slice(i+1):location.search);};
  function lbSize(el,w,h){
    if(w&&h){el.style.setProperty("--lbw",(w*1.5)+"px"); el.style.setProperty("--lbh",(h*1.5)+"px");}
    else{el.style.removeProperty("--lbw"); el.style.removeProperty("--lbh");}
  }
  function lbShow(){
    var it=LB.list[LB.i]; if(typeof it==="string") it={src:it};
    var el=$("lbimg"); el.style.backgroundImage=bgv(it.src);
    el.setAttribute("aria-label",it.alt||it.label||"Photo");
    /* F3: never show a photo above 1.5x its natural size. Sizes are embedded at build time;
       a plain file URL without sizes is measured with new Image() as a fallback. */
    if(it.w&&it.h) lbSize(el,it.w,it.h);
    else if(!/^var\(/.test(it.src)){lbSize(el,0,0); var im=new Image(), want=it;
      im.onload=function(){if(LB.list[LB.i]===want||LB.list[LB.i].src===want.src) lbSize(el,im.naturalWidth,im.naturalHeight);};
      im.src=String(it.src).replace(/^url\(["']?/,"").replace(/["']?\)$/,"");}
    else lbSize(el,0,0);
    var c=$("lbcount"); if(c) c.textContent=(LB.i+1)+" / "+LB.list.length;
  }
  window.lbOpen=function(list,i){var box=$("lb"); LB.list=list;LB.i=i||0;
    if(!box.classList.contains("on")) LB.opener=document.activeElement;
    lbShow(); box.classList.add("on"); document.body.style.overflow="hidden"; setInert(true); openDialog=box;
    var x=box.querySelector(".lbx"); if(x) x.focus();};
  window.lb=function(on){var box=$("lb"); if(on||!box||!box.classList.contains("on")) return;
    box.classList.remove("on"); document.body.style.overflow=""; setInert(false); openDialog=null;
    var o=LB.opener; LB.opener=null; if(o&&o.focus&&document.contains(o)&&visible(o)) o.focus({preventScroll:true});};
  window.lbStep=function(d){if(!LB.list.length)return;LB.i=(LB.i+d+LB.list.length)%LB.list.length;lbShow();};
  function bgUrl(el){var m=getComputedStyle(el).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);return m?m[1]:null;}
  function openGal(g){
    var cells=[].slice.call(g.parentNode.querySelectorAll(".ph"));
    var list=cells.map(function(c){return {src:bgUrl(c),w:+c.getAttribute("data-w")||0,h:+c.getAttribute("data-h")||0,alt:c.getAttribute("data-alt")||""};});
    lbOpen(list,cells.indexOf(g));
  }
  document.addEventListener("click",function(e){
    var g=e.target.closest&&e.target.closest(".gal .ph"); if(g) openGal(g);
  });
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"){ if($("lb")&&$("lb").classList.contains("on")) lb(0); else menu(0); return; }
    if(e.key==="Tab"&&openDialog){trap(e,openDialog);return;}
    if($("lb")&&$("lb").classList.contains("on")){if(e.key==="ArrowRight")lbStep(1);if(e.key==="ArrowLeft")lbStep(-1);return;}
    var t=e.target;
    if((e.key==="Enter"||e.key===" ")&&t&&t.matches&&t.matches(".gal .ph")){e.preventDefault();openGal(t);}
  });
  function galA11y(){
    document.querySelectorAll(".gal").forEach(function(g){var cells=g.querySelectorAll(".ph");
      cells.forEach(function(p,i){p.tabIndex=0;p.setAttribute("role","button");
        p.setAttribute("aria-label","Open photo "+(i+1)+" of "+cells.length+(p.getAttribute("data-alt")?": "+p.getAttribute("data-alt"):""));});});
  }

  /* ---------- sliders (F10): whole cards, step = card + real gap, range counter ---------- */
  function cardStep(t){var c=t.firstElementChild, gap=parseFloat(getComputedStyle(t).columnGap)||0;
    return {s:c?c.getBoundingClientRect().width+gap:360, gap:gap};}
  window.slide=function(id,dir){var t=$(id);if(!t)return; t.scrollBy({left:dir*cardStep(t).s,behavior:smooth()});};
  function counter(tid,cid){var t=$(tid),c=$(cid);if(!t||!c)return;
    var box=t.closest(".slideshow"), prev=box&&box.querySelector(".slnav.prev"), next=box&&box.querySelector(".slnav.next");
    function upd(){var n=t.children.length, st=cardStep(t);
      if(!st.s||!t.clientWidth)return;
      var vis=Math.max(1,Math.min(n,Math.floor((t.clientWidth+st.gap+2)/st.s)));
      var atEnd=t.scrollLeft+t.clientWidth>=t.scrollWidth-2, atStart=t.scrollLeft<=2;
      var first=atEnd?n-vis:Math.min(n-vis,Math.round(t.scrollLeft/st.s));
      c.textContent=(vis>1?pad(first+1)+"–"+pad(first+vis):pad(first+1))+" / "+pad(n);
      var fp=document.activeElement;
      if(prev) prev.disabled=atStart; if(next) next.disabled=atEnd;
      if(fp===next&&atEnd&&prev&&!prev.disabled) prev.focus({preventScroll:true});
      if(fp===prev&&atStart&&next&&!next.disabled) next.focus({preventScroll:true});
    }
    t.addEventListener("scroll",upd,{passive:true}); window.addEventListener("resize",upd);
    if(window.ResizeObserver) new ResizeObserver(upd).observe(t);
    upd();
  }

  /* ---------- residence gallery (F3, F6, F8) ---------- */
  function resGallery(){document.querySelectorAll(".rd-gal").forEach(oneGallery);}
  function oneGallery(g){
    var list=JSON.parse(g.getAttribute("data-imgs")).map(function(x){return typeof x==="string"?{src:x}:x;});
    var i=0, main=g.querySelector(".rd-main"), label=g.querySelector(".rd-label"), strip=g.querySelectorAll(".rd-strip button, .rd-strip span");
    function show(k){i=(k+list.length)%list.length; var it=list[i];
      main.style.backgroundImage=bgv(it.src);
      if(it.label){ if(label) label.textContent=it.label; main.setAttribute("aria-label",it.label+(it.alt?". "+it.alt:"")); }
      strip.forEach(function(s,j){s.classList.toggle("on",j===i); if(j===i) s.setAttribute("aria-current","true"); else s.removeAttribute("aria-current");});}
    g.querySelector(".rd-arrow.p").onclick=function(){show(i-1);};
    g.querySelector(".rd-arrow.n").onclick=function(){show(i+1);};
    strip.forEach(function(s,j){s.onclick=function(){show(j);};});
    main.onclick=function(){lbOpen(list,i);};
    g.querySelector(".rd-count").onclick=function(){lbOpen(list,i);};
    show(0);
  }

  /* ---------- mobile booking bar on residence pages (F9) ---------- */
  function mbar(){
    /* a scroll check rather than an IntersectionObserver alone: a jump (anchor, scroll restore, fling)
       can move .rd-cta from below the fold to above it without ever intersecting */
    var bars=[].map.call(document.querySelectorAll(".mbar"),function(bar){
      var scope=bar.closest(".page")||document; return {bar:bar,cta:scope.querySelector(".rd-cta")};}).filter(function(x){return x.cta;});
    if(!bars.length) return;
    var queued=false;
    function upd(){queued=false; bars.forEach(function(x){x.bar.classList.toggle("on",x.cta.getBoundingClientRect().bottom<0);});}
    function q(){if(!queued){queued=true; requestAnimationFrame(upd);}}
    window.addEventListener("scroll",q,{passive:true}); window.addEventListener("resize",q); window.addEventListener("hashchange",q);
    upd();
  }

  /* ---------- contact map fallback (F21) ---------- */
  function mapFallback(){
    var w=$("mapwrap"); if(!w) return;
    w.classList.add("probing");
    var im=new Image();
    im.onload=function(){w.classList.remove("probing");};
    im.onerror=function(){w.classList.remove("probing"); w.classList.add("fail");};
    im.src="https://www.google.com/favicon.ico?amz="+Date.now();
  }

  /* ---------- home calculator ---------- */
  function calc(){
    var res=$("calcRes"), len=$("calcLen"); if(!res||!len) return;
    function upd(){
      var o=res.options[res.selectedIndex], pr=+o.getAttribute("data-price"), nm=o.getAttribute("data-name");
      var n=+len.value, nr=conv(pr), base=nr*n, pct=tier(n), disc=Math.round(base*pct/100), total=base-disc;
      $("cUnit").textContent=nm; $("cNights").textContent=n+" nights";
      $("cLineL").textContent=fmtD(nr)+" × "+n+" nights"; $("cLineR").textContent=fmtD(base);
      if(pct>0){$("cDiscRow").style.display="flex"; $("cDiscL").textContent=n+"-night rate, "+pct+"% off"; $("cDiscR").textContent="– "+fmtD(disc);
        $("cSave").textContent="You save "+fmtD(disc); $("cSave").style.visibility="visible";}
      else{$("cDiscRow").style.display="none"; $("cSave").style.visibility="hidden";}
      $("cTotal").textContent=fmtD(total);
      $("calcGo").setAttribute("href",(window.AMZ_SPA?"#booking?":"booking.html?")+"residence="+encodeURIComponent(res.value)+"&nights="+n);
    }
    res.addEventListener("change",upd); len.addEventListener("change",upd); document.addEventListener("ccychange",upd); upd();
  }

  /* ---------- booking page (F4, F7) ---------- */
  function booking(){
    var root=$("bookingApp"); if(!root) return;
    var state={res:null,price:0,name:"",type:"",img:"",max:5}, cur=1, q;
    var ci=$("checkin"), co=$("checkout"), gs=$("guests");
    var CODES={"cabana":"CAB","azoria":"AZO","kartika":"KAR","kartika-extended":"KXT"};
    var H1={1:"Choose your <em>residence.</em>",2:"Your dates and <em>details.</em>",3:"Review and <em>confirm.</em>",4:"Request <em>received.</em>"};
    var wide=window.matchMedia?matchMedia("(min-width: 901px)"):{matches:true};
    /* dates are handled as LOCAL calendar days; toISOString() is UTC and gives yesterday in Bali before 08:00 */
    function ymd(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
    function parse(s){var p=String(s||"").split("-"); return p.length===3&&+p[0]?new Date(+p[0],+p[1]-1,+p[2]):null;}
    function today(){var d=new Date(); d.setHours(0,0,0,0); return d;}
    function addDays(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()+n); return x;}
    function nice(d){return d?d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).replace(/,/g,""):"–";}
    function nights(){var a=parse(ci.value),b=parse(co.value);return (a&&b)?Math.round((b-a)/86400000):0;}

    function step(n,o){
      cur=n;
      [1,2,3,4].forEach(function(k){$("bp"+k).classList.toggle("on",k===n);});
      [1,2,3].forEach(function(k){var st=$("bs"+k), done=k<n, on=k===n;
        st.classList.toggle("done",done); st.classList.toggle("on",on);
        if(on) st.setAttribute("aria-current","step"); else st.removeAttribute("aria-current");
        st.querySelector(".sn").textContent=done?"✓":String(k);});
      var h=$("bkH1"); if(h) h.innerHTML=H1[n];
      if(o&&o.scroll===false) return;
      /* scroll only when the stepper (or the new panel's top) is above the viewport */
      var bar=root.querySelector(".bsteps"), top=bar.getBoundingClientRect().top, ptop=$("bp"+n).getBoundingClientRect().top;
      if(top<0||ptop<0) window.scrollTo({top:top+window.scrollY-90,behavior:"auto"});
      var p=$("bp"+n); if(p&&o&&o.focus){p.setAttribute("tabindex","-1"); p.focus({preventScroll:true});}
    }

    /* ----- validation ----- */
    function clearErr(id){
      (id?[id]:["checkin","checkout","fn","em"]).forEach(function(k){var el=$(k), f=el.closest(".field"), m=$("err-"+k);
        f.classList.remove("err"); el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby");
        if(m){m.textContent=""; m.hidden=true;}});
    }
    function markErr(k,msg){var el=$(k), m=$("err-"+k);
      el.closest(".field").classList.add("err"); el.setAttribute("aria-invalid","true");
      m.textContent=msg; m.hidden=false; el.setAttribute("aria-describedby","err-"+k);}
    function validate(){
      clearErr(); var errs=[], a=parse(ci.value), b=parse(co.value), t=today();
      if(!a) errs.push(["checkin","Choose a check-in date."]);
      else if(a<t) errs.push(["checkin","Check-in can’t be in the past. Choose today or a later date."]);
      if(!b) errs.push(["checkout","Choose a check-out date."]);
      else if(a&&b<=a) errs.push(["checkout","Check-out must be at least one night after check-in."]);
      if(!$("fn").value.trim()) errs.push(["fn","Please add your first name."]);
      if(!$("em").value.trim()) errs.push(["em","Please add your email so we can confirm your stay."]);
      else if(!$("em").checkValidity()) errs.push(["em","Please check the email address, for example name@example.com."]);
      errs.forEach(function(x){markErr(x[0],x[1]);});
      var msg=$("dateMsg");
      if(errs.length){msg.textContent=errs.length===1?errs[0][1]:"Please check the "+errs.length+" highlighted fields.";
        var first=$(errs[0][0]), fr=first.closest(".field").getBoundingClientRect();
        first.focus({preventScroll:true});
        if(fr.top<90||fr.bottom>window.innerHeight) window.scrollTo({top:fr.top+window.scrollY-110,behavior:"auto"});
        return false;}
      msg.textContent=""; return true;
    }
    ["checkin","checkout","fn","em"].forEach(function(k){$(k).addEventListener("input",function(){clearErr(k);});});

    /* check-out is always at least one night after check-in */
    function syncDates(){
      var t=today(); ci.min=ymd(t);
      var a=parse(ci.value); if(!a) return;
      var minOut=addDays(a,1); co.min=ymd(minOut);
      var b=parse(co.value); if(!b||b<=a) co.value=ymd(minOut);
    }
    ci.addEventListener("change",function(){syncDates(); clearErr("checkout"); summary();});
    co.addEventListener("change",summary); gs.addEventListener("change",summary);

    /* guests follow the residence's capacity */
    function setGuests(max,want){
      var v=Math.min(Math.max(+want||+gs.value||2,1),max); gs.innerHTML="";
      for(var i=1;i<=max;i++){var o=document.createElement("option"); o.value=i; o.textContent=i+" Guest"+(i>1?"s":""); gs.appendChild(o);}
      gs.value=String(v);
      var h=$("guestHint"); if(h) h.textContent=!state.name?"":state.name+" sleeps up to "+max+" guest"+(max>1?"s":"")+". Larger groups can book more than one residence.";
    }

    /* ----- summary ----- */
    function summary(){
      var nn=nights(), ok=nn>0, nr=conv(state.price), base=nr*Math.max(nn,0), pct=ok?tier(nn):0,
          disc=Math.round(base*pct/100), tot=base-disc, g=+gs.value||0;
      var line=(state.name||"No residence")+" · "+(ok?nn+" night"+(nn>1?"s":""):"choose dates")+(ok&&state.price?" · "+fmtD(tot):"");
      var body='<div class="bs-head"><h3>Your stay</h3><button type="button" class="bs-change" onclick="bkStep(1)">Change<span class="sr"> residence</span></button></div>'+
        '<div class="bs-res"><span class="bs-th" style="background-image:'+(state.img?bgv(state.img).replace(/"/g,"&quot;"):"none")+'"></span>'+
          '<div><div class="bs-type">'+(state.type||"")+'</div><div class="bs-name">'+(state.name||"Not selected")+'</div></div></div>'+
        '<div class="srow"><span>Check-in</span><span>'+nice(parse(ci.value))+'</span></div>'+
        '<div class="srow"><span>Check-out</span><span>'+nice(parse(co.value))+'</span></div>'+
        '<div class="srow"><span>Guests</span><span>'+g+' guest'+(g>1?"s":"")+'</span></div>'+
        (ok?'<div class="srow"><span>'+fmtD(nr)+' × '+nn+' night'+(nn>1?"s":"")+'</span><span>'+fmtD(base)+'</span></div>':
            '<div class="srow"><span>Rate / night</span><span>'+fmtD(nr)+'</span></div>')+
        (ok&&pct?'<div class="srow disc"><span>'+nn+'-night rate, '+pct+'% off</span><span>– '+fmtD(disc)+'</span></div>':'')+
        '<div class="srow total"><span>Estimated total</span><span>'+(ok?fmtD(tot):"–")+'</span></div>'+
        (CCY!=="USD"?'<p class="bs-note">Shown in '+CCY+' at a fixed indicative rate. Rates are set in USD.</p>':'');
      document.querySelectorAll(".bsum").forEach(function(s){
        var d=s.querySelector("details.bsd");
        if(!d){s.innerHTML='<details class="bsd"><summary><span class="bsd-line"></span><span class="bsd-t" aria-hidden="true"></span></summary><div class="bsd-b"></div></details>';
          d=s.querySelector("details.bsd"); d.open=wide.matches||!!s.closest("#bp4");}
        d.querySelector(".bsd-line").textContent=line;
        d.querySelector(".bsd-b").innerHTML=body;
      });
    }
    function onWide(){document.querySelectorAll(".bsum details.bsd").forEach(function(d){d.open=wide.matches||!!d.closest("#bp4");});}
    if(wide.addEventListener) wide.addEventListener("change",onWide); else if(wide.addListener) wide.addListener(onWide);
    document.addEventListener("ccychange",summary);

    function select(b){
      document.querySelectorAll("#bp1 .rescard").forEach(function(c){c.classList.remove("sel");});
      b.closest(".rescard").classList.add("sel");
      state.res=b.getAttribute("data-select"); state.price=+b.getAttribute("data-price"); state.name=b.getAttribute("data-name");
      state.type=b.getAttribute("data-type")||""; state.img=b.getAttribute("data-img")||""; state.max=+b.getAttribute("data-max")||5;
    }
    window.bkStep=function(n){
      if(n>=2&&!state.res){step(1,{focus:true});return;}
      if(n>=3&&!validate()){if(cur!==2){summary();step(2,{focus:false});validate();}return;}
      if(n===4){
        $("doneName").textContent=$("fn").value.trim(); $("doneRes").textContent=state.name;
        var a=parse(ci.value); $("doneRef").textContent="AMZ-"+String(a.getFullYear()).slice(2)+pad(a.getMonth()+1)+pad(a.getDate())+"-"+(CODES[state.res]||"RES");
        var pay=(document.querySelector('input[name="pay"]:checked')||{}).value;
        $("donePay").textContent=pay==="bank"?"Bank transfer details arrive with your confirmation email.":
          pay==="hold"?"No payment now. Your dates are held while our team confirms them.":
          "Your secure payment link arrives by email with the confirmation.";
      }
      summary(); step(n,{focus:true});
    };
    document.querySelectorAll("[data-select]").forEach(function(b){b.addEventListener("click",function(){
      select(b); setGuests(state.max,gs.value); bkStep(2);});});

    window.amzBookingPrefill=function(){
      q=amzParams(); clearErr(); $("dateMsg").textContent="";
      document.querySelectorAll("#bp1 .rescard").forEach(function(c){c.classList.remove("sel");});
      state={res:null,price:0,name:"",type:"",img:"",max:5};
      var t=today(), nq=Math.max(1,parseInt(q.get("nights"),10)||7);
      var qi=parse(q.get("checkin")), qo=parse(q.get("checkout"));
      var a=(qi&&qi>=t)?qi:addDays(t,21), b=(qo&&qo>a)?qo:addDays(a,nq);
      ci.value=ymd(a); co.value=ymd(b); syncDates();
      var want=parseInt(q.get("guests"),10)||2;
      var pre=q.get("residence"), btn=pre&&document.querySelector('[data-select="'+pre+'"]');
      if(btn){select(btn); setGuests(state.max,want); summary(); step(2,{scroll:false});}
      else{setGuests(5,want); summary(); step(1,{scroll:false});}
    };
    amzBookingPrefill();
  }

  document.addEventListener("DOMContentLoaded",function(){
    apply(); counter("resTrack","resCount"); counter("resTrack2","resCount2"); counter("facTrack","facCount");
    galA11y(); resGallery(); calc(); booking(); mbar(); mapFallback();
  });
})();
