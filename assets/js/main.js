/* Amazona Jungle Resort · shared site script (multi-page site and single-file bundle) */
(function(){
  function $(id){return document.getElementById(id);}

  /* ---------- opening day: stays can be booked from the body's data-earliest date (the API refuses earlier ones too) ---------- */
  /* Bali calendar day as yyyy-mm-dd, whatever the visitor's own time zone */
  function baliToday(){return new Date(Date.now()+8*3600000).toISOString().slice(0,10);}
  window.amzEarliest=function(){var e=document.body&&document.body.getAttribute("data-earliest"); return /^\d{4}-\d{2}-\d{2}$/.test(e||"")?e:"";};
  /* the "now booking from 15 December" bar retires itself on the opening day */
  (function(){var e=amzEarliest(); if(!e||baliToday()>=e) document.querySelectorAll(".pre-open").forEach(function(b){b.remove();});})();

  /* ---------- lead capture: forms post to api/lead.php on our server, which forwards to Zapier -> GoHighLevel ---------- */
  var T0=Date.now();
  (function(){try{var q=new URLSearchParams(location.search),u={};
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid"].forEach(function(k){if(q.get(k))u[k]=q.get(k);});
    if(Object.keys(u).length) sessionStorage.setItem("amz_utm",JSON.stringify(u));
    if(sessionStorage.getItem("amz_ref")===null) sessionStorage.setItem("amz_ref",document.referrer||"direct");}catch(e){}})();
  window.amzSend=function(fields){
    var d=new URLSearchParams(), ep=document.body.getAttribute("data-endpoint");
    function add(k,v){if(v!==undefined&&v!==null&&v!=="") d.append(k,String(v));}
    Object.keys(fields).forEach(function(k){add(k,fields[k]);});
    add("page_url",location.href.split("#")[0]); add("elapsed_ms",Date.now()-T0); add("display_currency",CCY);
    try{add("timezone",Intl.DateTimeFormat().resolvedOptions().timeZone);}catch(e){}
    try{var u=JSON.parse(sessionStorage.getItem("amz_utm")||"{}"); Object.keys(u).forEach(function(k){add(k,u[k]);}); add("referrer",sessionStorage.getItem("amz_ref"));}catch(e){}
    if(!ep||!window.fetch) return Promise.reject(new Error("unavailable"));
    return fetch(ep,{method:"POST",body:d,headers:{"Accept":"application/json"},credentials:"same-origin"})
      .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok||!j.ok){var e=new Error(j.message||("HTTP "+r.status)); e.errors=j.errors||{}; e.status=r.status; throw e;} return j;});});
  };
  /* when a send fails, offer the same details as a ready-made WhatsApp message */
  function waLink(lines){var w=document.body.getAttribute("data-wa")||"https://wa.me/4593806513"; return w+"?text="+encodeURIComponent(lines.filter(Boolean).join("\n"));}
  function failMsg(el,lines,e){
    var why=e&&e.status===429?"You&rsquo;ve sent a few requests already. Please wait a few minutes and try again, or ":"Sorry, that didn&rsquo;t go through. Please try again, or ";
    el.innerHTML=why+'<a href="'+waLink(lines).replace(/"/g,"&quot;")+'" target="_blank" rel="noopener">send it to us on WhatsApp</a>.';
  }

  /* ---------- lazy photos: [data-bg] gets its background when it comes within ~800px of the viewport ---------- */
  (function(){
    function show(el){var u=el.getAttribute("data-bg"); if(!u) return; el.style.backgroundImage=/^var\(/.test(u)?u:"url('"+u+"')"; el.removeAttribute("data-bg");}
    window.amzShowAll=function(){[].slice.call(document.querySelectorAll("[data-bg]")).forEach(show);};
    var els=[].slice.call(document.querySelectorAll("[data-bg]"));
    if(!("IntersectionObserver" in window)){els.forEach(show);return;}
    /* photos inside a horizontal slider all load once the slider nears the viewport, so slides are ready before they are swiped in */
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting) return; var t=e.target;
      if(t.matches(".sltrack,.expgrid,.rgrid3,.cgrid.cats")) [].slice.call(t.querySelectorAll("[data-bg]")).forEach(show); else show(t); io.unobserve(t);});},{rootMargin:"800px 800px"});
    var tracks=[];
    els.forEach(function(el){var t=el.closest&&el.closest(".sltrack,.expgrid,.rgrid3,.cgrid.cats"); if(t){if(tracks.indexOf(t)<0){tracks.push(t);io.observe(t);}} else io.observe(el);});
    window.addEventListener("beforeprint",window.amzShowAll);
  })();
  function pad(n){return (n<10?"0":"")+n;}
  var reduceMotion=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)");
  function smooth(){return reduceMotion&&reduceMotion.matches?"auto":"smooth";}

  /* ---------- currency ---------- */
  /* prices are set in EUR. IDR and USD start from backup rates, then switch to the booking API's live
     rates (/api/fx/rates): the IDR shown there is the IDR rate a card is actually charged at. */
  var RATES={EUR:1, IDR:20400, USD:1.16};
  var SYM={IDR:"IDR ", EUR:"€", USD:"$"};
  var CCY="EUR";
  try{var s=localStorage.getItem("amz_ccy_v3"); if(s&&RATES[s]) CCY=s;}catch(e){}
  /* F17: convert once, round once, then do all maths in the display currency */
  function conv(eur){return Math.round((+eur||0)*RATES[CCY]);}
  function fmtD(v){return CCY==="IDR"?"IDR "+v.toLocaleString("id-ID"):SYM[CCY]+v.toLocaleString("en-US");}
  function fmt(eur){return fmtD(conv(eur));}
  window.fmtMoney=fmt; window.amzConv=conv; window.amzFmtD=fmtD;
  (function(){
    var api=(document.body.getAttribute("data-api")||"https://book.amazonajungleresort.com").replace(/\/+$/,"");
    function use(r){if(r&&+r.IDR>0) RATES.IDR=+r.IDR; if(r&&+r.USD>0) RATES.USD=+r.USD;}
    try{use(JSON.parse(sessionStorage.getItem("amz_fx")||"null"));}catch(e){}
    if(!window.fetch) return;
    fetch(api+"/api/fx/rates",{headers:{"Accept":"application/json"},credentials:"omit"}).then(function(r){return r.ok?r.json():null;})
      .then(function(j){if(!j||!j.rates) return; use(j.rates); try{sessionStorage.setItem("amz_fx",JSON.stringify(j.rates));}catch(e){} if(CCY!=="EUR") apply();})
      .catch(function(){});
  })();
  function apply(){
    document.querySelectorAll(".ccy").forEach(function(t){t.textContent=fmt(t.getAttribute("data-eur"));});
    document.querySelectorAll("select[data-prices] option").forEach(function(o){var p=o.getAttribute("data-price");
      if(p) o.textContent=o.getAttribute("data-name")+" · from "+fmt(p)+" / night";});
    document.querySelectorAll(".curSel").forEach(function(c){c.value=CCY;c.dispatchEvent(new Event("input"));});
    document.dispatchEvent(new Event("ccychange"));
  }
  document.addEventListener("change",function(e){if(e.target.classList&&e.target.classList.contains("curSel")){
    CCY=e.target.value; try{localStorage.setItem("amz_ccy_v3",CCY);}catch(x){} apply();}});

  /* long-stay discount tiers (replaced by the booking API's own tiers when it answers) */
  var TIERS=[[30,26],[14,16],[10,11],[7,10]];
  function tier(n){for(var i=0;i<TIERS.length;i++){if(n>=TIERS[i][0]) return TIERS[i][1];} return 0;}
  window.amzTier=tier;

  /* One source for prices: the booking API's /api/residences (the rates the guest is charged).
     The HTML carries the same figures, so the page reads right even before (or without) the API. */
  (function(){
    var api=(document.body.getAttribute("data-api")||"https://book.amazonajungleresort.com").replace(/\/+$/,"");
    function use(j){
      if(!j||!j.residences) return;
      var rate={}; j.residences.forEach(function(r){rate[r.id]=+r.rate;});
      if(+j.max_units>0) window.amzMaxUnits=+j.max_units;
      if(j.earliest_check_in&&/^\d{4}-\d{2}-\d{2}$/.test(j.earliest_check_in)) document.body.setAttribute("data-earliest",j.earliest_check_in);
      if(j.hasOwnProperty("earliest_check_in")&&!j.earliest_check_in) document.body.removeAttribute("data-earliest");
      if(j.long_stay_discounts){var t=[]; Object.keys(j.long_stay_discounts).forEach(function(k){t.push([+k,+j.long_stay_discounts[k]]);}); t.sort(function(a,b){return b[0]-a[0];}); if(t.length) TIERS=t;}
      document.querySelectorAll("[data-res][data-eur]").forEach(function(el){var r=rate[el.getAttribute("data-res")], n=+el.getAttribute("data-n")||1;
        if(r>0) el.setAttribute("data-eur",String(Math.round(r*n*(100-tier(n)))/100));});
      document.querySelectorAll("[data-select][data-price]").forEach(function(el){var r=rate[el.getAttribute("data-select")]; if(r>0) el.setAttribute("data-price",String(r));});
      document.querySelectorAll("select[data-prices] option[value]").forEach(function(o){var r=rate[o.value]; if(r>0) o.setAttribute("data-price",String(r));});
      apply();
    }
    try{use(JSON.parse(sessionStorage.getItem("amz_res")||"null"));}catch(e){}
    if(!window.fetch) return;
    fetch(api+"/api/residences",{headers:{"Accept":"application/json"},credentials:"omit"}).then(function(r){return r.ok?r.json():null;})
      .then(function(j){if(!j) return; try{sessionStorage.setItem("amz_res",JSON.stringify(j));}catch(e){} use(j);}).catch(function(){});
  })();

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
  function bgUrl(el){var d=el.getAttribute("data-bg"); if(d) return d; var m=getComputedStyle(el).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);return m?m[1]:null;}
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
      if($("calcReg")) $("calcReg").setAttribute("href",(window.AMZ_SPA?"#booking:register?":"booking.html?")+"residence="+encodeURIComponent(res.value)+"&nights="+n+(window.AMZ_SPA?"":"#register"));
    }
    res.addEventListener("change",upd); len.addEventListener("change",upd); document.addEventListener("ccychange",upd); upd();
  }

  /* ---------- booking API (Laravel, see amazona-booking-api): the page's data-api names it ---------- */
  var API=(document.body.getAttribute("data-api")||"").replace(/\/+$/,"");
  function amzApi(method,path,body){
    if(!API||!window.fetch) return Promise.reject(new Error(""));
    return fetch(API+path,{method:method,headers:{"Accept":"application/json","Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,credentials:"omit"})
      .then(function(r){return r.json().catch(function(){return {};}).then(function(j){
        if(!r.ok){var e=new Error(j.message||""); e.status=r.status; e.body=j; e.errors=j.errors; throw e;} return j;});});
  }
  function statusUrl(ref,t){return "booking-status.html?ref="+encodeURIComponent(ref)+"&t="+encodeURIComponent(t);}

  /* ---------- payment result page: DOKU sends the guest here. The redirect proves nothing, so we ask the API. ---------- */
  function bookingStatus(){
    var root=$("bkStatus"); if(!root) return;
    var q=new URLSearchParams(location.search), ref=q.get("ref"), t=q.get("t"), back=q.get("back")==="1", started=Date.now(), timer=null;
    if(!ref||!t){try{var sv=JSON.parse(sessionStorage.getItem("amz_booking")||"{}"); ref=ref||sv.ref; t=t||sv.t;}catch(e){}}
    function esc(v){return String(v==null?"":v).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
    function day(s){var p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).replace(/,/g,"");}
    function money(v){return "€"+(+v).toLocaleString("en-US",{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2});}
    var WA=document.body.getAttribute("data-wa")||"https://wa.me/4593806513";
    function wa(b){return WA+"?text="+encodeURIComponent("Hi Amazona, about my booking"+(b&&b.reference?" "+b.reference:"")+".");}
    function details(b){var qq=b.quote;
      return '<div class="st-sum"><div class="srow"><span>Reference</span><span><b>'+esc(b.reference)+'</b></span></div>'+
        '<div class="srow"><span>Residence</span><span>'+esc(b.residence.name)+'</span></div>'+
        '<div class="srow"><span>Check-in</span><span>'+day(b.check_in)+'</span></div>'+
        '<div class="srow"><span>Check-out</span><span>'+day(b.check_out)+'</span></div>'+
        '<div class="srow"><span>Guests</span><span>'+b.guests+'</span></div>'+
        '<div class="srow total"><span>'+(b.status==="awaiting_payment"?"Total to pay":"Total paid")+'</span><span>'+money(qq.total)+'</span></div>'+
        (b.charged_idr?'<p class="st-note">Charged as IDR '+(+b.charged_idr).toLocaleString("id-ID")+' by DOKU.</p>':'')+'</div>';}
    function show(h1,eyebrow,html){root.innerHTML='<div class="eyebrow">'+eyebrow+'</div><h1>'+h1+'</h1>'+html; root.setAttribute("aria-busy","false");}
    function payBtn(b,label){return '<div class="st-btns"><button class="btn btn-solid" type="button" id="stPay">'+(label||"Pay now")+'</button><a class="btn btn-ghost" href="'+wa(b)+'" target="_blank" rel="noopener">WhatsApp us</a></div><p class="fmsg" id="stMsg" role="alert"></p>';}
    function wirePay(){var bt=$("stPay"); if(!bt) return; bt.addEventListener("click",function(){
      bt.disabled=true; bt.textContent="Opening secure payment...";
      amzApi("POST","/api/bookings/"+encodeURIComponent(ref)+"/pay",{t:t}).then(function(j){
        if(j.paid){render(j.booking); return;} location.href=j.payment_url;
      }).catch(function(e){
        if(e.body&&e.body.booking&&e.body.booking.status!=="awaiting_payment"){render(e.body.booking); return;}
        bt.disabled=false; bt.textContent="Try again"; $("stMsg").textContent=e.message||"Sorry, that didn't work. Please try again, or message us on WhatsApp.";});});}
    var payShown=false;
    function render(b){
      if(b.status==="confirmed") return show("Your stay is <em>confirmed.</em>","Booking confirmed",
        '<p class="sub">Thank you, '+esc(b.first_name)+'. Your payment has been received and '+esc(b.residence.name)+' is reserved for you. A confirmation is on its way to '+esc(b.email)+'.</p>'+details(b)+
        '<div class="st-btns"><a class="btn btn-solid" href="index.html">Back to home</a><a class="btn btn-ghost" href="'+wa(b)+'" target="_blank" rel="noopener">Arrange your arrival on WhatsApp</a></div>');
      if(b.status==="paid") return show("Payment <em>received.</em>","Thank you",
        '<p class="sub">Thank you, '+esc(b.first_name)+'. We have your payment and our team is confirming '+esc(b.residence.name)+' now. You will receive an email at '+esc(b.email)+' shortly.</p>'+details(b)+
        '<div class="st-btns"><a class="btn btn-solid" href="index.html">Back to home</a><a class="btn btn-ghost" href="'+wa(b)+'" target="_blank" rel="noopener">WhatsApp us</a></div>');
      if(b.status==="expired") return show("This booking has <em>expired.</em>","Not paid",
        '<p class="sub">No payment was received in time, so the dates were released. You can start a new booking, and we will check the dates again.</p>'+details(b)+
        '<div class="st-btns"><a class="btn btn-solid" href="booking.html?residence='+encodeURIComponent(b.residence.id)+'&checkin='+b.check_in+'&checkout='+b.check_out+'&guests='+b.guests+'">Book again</a><a class="btn btn-ghost" href="'+wa(b)+'" target="_blank" rel="noopener">WhatsApp us</a></div>');
      /* awaiting payment */
      var waited=Date.now()-started;
      if(!back&&waited<90000){
        show("Checking your <em>payment.</em>","One moment",'<p class="sub">We are confirming your payment with DOKU. This usually takes a few seconds; please keep this page open.</p>'+details(b));
        root.setAttribute("aria-busy","true"); timer=setTimeout(load,waited<20000?3000:6000); return;}
      /* keep checking quietly in case a slow payment lands; don't redraw the button under the guest's finger */
      if(!back) timer=setTimeout(load,15000);
      if(payShown) return;
      payShown=true;
      show(back?"Payment not <em>completed.</em>":"We haven&rsquo;t received your <em>payment yet.</em>","Your dates are held",
        '<p class="sub">'+(back?"Your payment wasn&rsquo;t completed. ":"If you have just paid, it can take a few minutes to come through, and this page will update. ")+
        'Your dates are held for a short while, so you can pay now to keep them.</p>'+details(b)+payBtn(b));
      wirePay();
    }
    function load(){
      clearTimeout(timer);
      if(!ref||!t){show("We couldn&rsquo;t find <em>that booking.</em>","Booking",'<p class="sub">Please use the link from your booking, or message us and we will help.</p><div class="st-btns"><a class="btn btn-solid" href="booking.html">Book your stay</a><a class="btn btn-ghost" href="'+wa()+'" target="_blank" rel="noopener">WhatsApp us</a></div>'); return;}
      amzApi("GET","/api/bookings/"+encodeURIComponent(ref)+"?t="+encodeURIComponent(t)).then(function(b){render(b);}).catch(function(e){
        if(e.status===404){ref=null; load(); return;}
        show("We&rsquo;re having trouble <em>checking.</em>","One moment",'<p class="sub">We couldn&rsquo;t reach our booking system just now. Your payment is safe either way. This page will try again, or message us with your reference '+esc(ref)+'.</p><div class="st-btns"><a class="btn btn-ghost" href="'+wa({reference:ref})+'" target="_blank" rel="noopener">WhatsApp us</a></div>');
        timer=setTimeout(load,10000);});
    }
    load();
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
    /* first bookable check-in: today, or the opening day if that is later */
    function firstIn(){var t=today(), e=parse(window.amzEarliest?amzEarliest():""); return e&&e>t?e:t;}
    function openDay(){var e=parse(window.amzEarliest?amzEarliest():""); return e&&e>today()?nice2(e):"";}
    function nice2(d){return d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});}
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
      (id?[id]:["checkin","checkout","fn","em","ph","cc"]).forEach(function(k){var el0=$(k); if(!el0) return;var el=$(k), f=el.closest(".field"), m=$("err-"+k);
        f.classList.remove("err"); el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby");
        if(m){m.textContent=""; m.hidden=true;}});
    }
    function markErr(k,msg){var el=$(k), m=$("err-"+k); if(!el||!m) return;
      el.closest(".field").classList.add("err"); el.setAttribute("aria-invalid","true");
      m.textContent=msg; m.hidden=false; el.setAttribute("aria-describedby","err-"+k);}
    function validate(){
      clearErr(); var errs=[], a=parse(ci.value), b=parse(co.value), t=today();
      if(!a) errs.push(["checkin","Choose a check-in date."]);
      else if(a<t) errs.push(["checkin","Check-in can’t be in the past. Choose today or a later date."]);
      else if(a<firstIn()) errs.push(["checkin","We welcome our first guests on "+openDay()+". Please choose a check-in from "+openDay()+"."]);
      if(!b) errs.push(["checkout","Choose a check-out date."]);
      else if(a&&b<=a) errs.push(["checkout","Check-out must be at least one night after check-in."]);
      if(!$("fn").value.trim()) errs.push(["fn","Please add your first name."]);
      if(!$("em").value.trim()) errs.push(["em","Please add your email so we can confirm your stay."]);
      else if(!$("em").checkValidity()) errs.push(["em","Please check the email address, for example name@example.com."]);
      if(API&&$("err-ph")){var pd=$("ph").value.replace(/\D+/g,"").replace(/^00/,"");
        if(!pd) errs.push(["ph","Please add a phone or WhatsApp number."]);
        else if(/^0/.test(pd)) errs.push(["ph","Please include your country code, for example +62 for Indonesia."]);
        else if(pd.length<8||pd.length>16) errs.push(["ph","Please check the phone number."]);}
      errs.forEach(function(x){markErr(x[0],x[1]);});
      var msg=$("dateMsg");
      if(errs.length){msg.textContent=errs.length===1?errs[0][1]:"Please check the "+errs.length+" highlighted fields.";
        var first=$(errs[0][0]), fr=first.closest(".field").getBoundingClientRect();
        first.focus({preventScroll:true});
        if(fr.top<90||fr.bottom>window.innerHeight) window.scrollTo({top:fr.top+window.scrollY-110,behavior:"auto"});
        return false;}
      msg.textContent=""; return true;
    }
    ["checkin","checkout","fn","em","ph","cc"].forEach(function(k){if($(k)) $(k).addEventListener("input",function(){clearErr(k);});});

    /* check-out is always at least one night after check-in */
    function syncDates(){
      ci.min=ymd(firstIn());
      var a=parse(ci.value); if(!a) return;
      var minOut=addDays(a,1); co.min=ymd(minOut);
      var b=parse(co.value); if(!b||b<=a) co.value=ymd(minOut);
    }
    ci.addEventListener("change",function(){syncDates(); clearErr("checkout"); summary();});
    co.addEventListener("change",summary); gs.addEventListener("change",summary);

    /* Guests: up to the residence's capacity times the units a group may book (Coco's multi-unit booking).
       A group bigger than one residence gets several of the same type, in one booking and one payment. */
    function maxUnits(){return window.amzMaxUnits||4;}
    function unitsFor(g,max){return max>0?Math.max(1,Math.ceil(g/max)):1;}
    function setGuests(max,want){
      var top=max*maxUnits(), v=Math.min(Math.max(+want||+gs.value||2,1),top); gs.innerHTML="";
      for(var i=1;i<=top;i++){var o=document.createElement("option"), u=unitsFor(i,max); o.value=i;
        o.textContent=i+" Guest"+(i>1?"s":"")+(u>1?" ("+u+" residences)":""); gs.appendChild(o);}
      gs.value=String(v); gs.dispatchEvent(new Event("input"));
      var h=$("guestHint"); if(h) h.textContent=!state.name?"":state.name+" sleeps up to "+max+" guest"+(max>1?"s":"")+". Bigger groups get more than one "+state.name+" in the same booking, up to "+top+" guests.";
    }

    /* ----- summary ----- */
    function summary(){
      var nn=nights(), ok=nn>0, nr=conv(state.price), base=nr*Math.max(nn,0), pct=ok?tier(nn):0,
          g=+gs.value||0, u=unitsFor(g,state.max||1);
      base=base*u; var disc=Math.round(base*pct/100), tot=base-disc;
      var line=(u>1&&state.name?u+" × ":"")+(state.name||"No residence")+" · "+(ok?nn+" night"+(nn>1?"s":""):"choose dates")+(ok&&state.price?" · "+fmtD(tot):"");
      var body='<div class="bs-head"><h3>Your stay</h3><button type="button" class="bs-change" onclick="bkStep(1)">Change<span class="sr"> residence</span></button></div>'+
        '<div class="bs-res"><span class="bs-th" style="background-image:'+(state.img?bgv(state.img).replace(/"/g,"&quot;"):"none")+'"></span>'+
          '<div><div class="bs-type">'+(state.type||"")+'</div><div class="bs-name">'+(state.name||"Not selected")+'</div></div></div>'+
        '<div class="srow"><span>Check-in</span><span>'+nice(parse(ci.value))+'</span></div>'+
        '<div class="srow"><span>Check-out</span><span>'+nice(parse(co.value))+'</span></div>'+
        '<div class="srow"><span>Guests</span><span>'+g+' guest'+(g>1?"s":"")+(u>1?", "+u+" residences":"")+'</span></div>'+
        (ok?'<div class="srow"><span>'+fmtD(nr)+' × '+nn+' night'+(nn>1?"s":"")+(u>1?" × "+u:"")+'</span><span>'+fmtD(base)+'</span></div>':
            '<div class="srow"><span>Rate / night</span><span>'+fmtD(nr)+'</span></div>')+
        (ok&&pct?'<div class="srow disc"><span>'+nn+'-night rate, '+pct+'% off</span><span>– '+fmtD(disc)+'</span></div>':'')+
        '<div class="srow total"><span>Estimated total</span><span>'+(ok?fmtD(tot):"–")+'</span></div>'+
        (CCY!=="EUR"?'<p class="bs-note">Shown in '+CCY+' as a guide. Rates are set in euros; cards are charged in IDR, converted from the euro price.</p>':'');
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
    var sending=false, sent=false, quoted=null;
    function eur(v){return "€"+(+v).toLocaleString("en-US",{minimumFractionDigits:v%1?2:0,maximumFractionDigits:2});}
    function code(){var c=$("cc"); return c?c.value.replace(/\s+/g,"").toUpperCase():"";}
    function stay(){var o={residence:state.res,check_in:ci.value,check_out:co.value,guests:+gs.value}, c=code(); if(c) o.coupon_code=c; return o;}
    function sameStay(a,b){return a&&b&&a.residence===b.residence&&a.check_in===b.check_in&&a.check_out===b.check_out&&a.guests===b.guests&&(a.coupon_code||"")===(b.coupon_code||"");}
    function showQuote(q,longer,cp){
      var nn=q.nights, un=+q.units||1, rows='<div class="srow"><span>'+eur(q.rate)+' × '+nn+' night'+(nn>1?"s":"")+(un>1?" × "+un+" residences":"")+'</span><span>'+eur(q.subtotal)+'</span></div>'+
        (q.discount_pct?'<div class="srow disc"><span>'+nn+'-night rate, '+q.discount_pct+'% off</span><span>– '+eur(q.discount)+'</span></div>':'')+
        (q.coupon?'<div class="srow disc"><span>Code '+q.coupon.code+' ('+q.coupon.pct+'% off)</span><span>– '+eur(q.coupon.discount)+'</span></div>':'')+
        (q.fee>0?'<div class="srow"><span>Payment processing fee ('+q.fee_pct+'%)</span><span>'+eur(q.fee)+'</span></div>':'')+
        '<div class="srow total"><span>Total to pay</span><span>'+eur(q.total)+'</span></div>';
      /* the 30-night rate can make 30 nights cheaper than 27 to 29: say so and offer the longer stay */
      if(longer&&longer.nights) rows+='<div class="bk-longer"><p>Staying '+longer.nights+' nights costs '+eur(longer.stay_total)+' before the fee, '+eur(longer.saving)+' less than '+nn+' nights.</p>'+
        '<button type="button" class="btn btn-ghost" id="bkLonger">Change to '+longer.nights+' nights</button></div>';
      if(cp&&cp.ok===false) rows+='<p class="pcode">'+String(cp.message||"That code didn't work.").replace(/</g,"&lt;")+' <button type="button" class="linkbtn" onclick="bkStep(2)">Change it</button></p>';
      $("payQuote").innerHTML='<h3>Your price</h3>'+rows;
      /* the summary bar shows the real figure once the server has priced the stay (code and fee included) */
      document.querySelectorAll(".bsum .bsd-line").forEach(function(l){l.textContent=(un>1?un+" × ":"")+(state.name||"")+" · "+nn+" night"+(nn>1?"s":"")+" · "+eur(q.total);});
      var lb=$("bkLonger"); if(lb) lb.addEventListener("click",function(){
        var a=parse(ci.value); if(!a) return; co.value=ymd(addDays(a,longer.nights)); co.dispatchEvent(new Event("input")); summary(); quote();});
    }
    /* step 3: the API checks the dates in Guesty and gives the exact price before anything is held */
    function quote(){
      var want=stay(), btn=$("bkConfirm"), pm=$("payMsg"); pm.textContent="";
      if(sameStay(quoted,want)) return;
      quoted=null; btn.disabled=true; $("payQuote").innerHTML='<p class="pwait">Checking availability&hellip;</p>';
      amzApi("POST","/api/availability",want).then(function(j){
        if(j.available===false){step(2,{focus:false}); $("dateMsg").textContent=j.message; return;}
        quoted=want; showQuote(j.quote,j.cheaper_longer,j.coupon); btn.disabled=false;
        /* a code that didn't work must not be sent with the booking (it would be refused): the guest fixes or clears it first */
        if(j.coupon&&j.coupon.ok===false){btn.disabled=true; markErr("cc",j.coupon.message);}
      }).catch(function(e){
        $("payQuote").innerHTML=""; btn.disabled=false;
        pm.innerHTML=(e.message?e.message.replace(/</g,"&lt;")+" ":"")+'You can still continue, or <a href="'+waLink(["Hi Amazona, I'd like to book "+state.name+".","Dates: "+ci.value+" to "+co.value+", "+gs.value+" guests."]).replace(/"/g,"&quot;")+'" target="_blank" rel="noopener">book with us on WhatsApp</a>.';
      });
    }
    function payNow(){
      if(sending) return;
      var btn=$("bkConfirm"), pm=$("payMsg"); pm.textContent="";
      if(!$("bkTerms").checked){pm.textContent="Please accept the booking terms to continue."; $("bkTerms").focus(); return;}
      var t={}; try{t=JSON.parse(sessionStorage.getItem("amz_utm")||"{}"); t.referrer=sessionStorage.getItem("amz_ref");}catch(e){}
      t.page_url=location.href.split("#")[0]; t.display_currency=CCY; try{t.timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch(e){}
      var body=stay(); body.first_name=$("fn").value.trim(); body.last_name=$("ln").value.trim(); body.email=$("em").value.trim();
      body.phone=$("ph").value.trim(); body.notes=$("rq").value.trim(); body.marketing_opt_in=$("bkNews").checked; body.accept_terms=true;
      body.tracking=t; if($("bkWebsite").value) body.website=$("bkWebsite").value;
      sending=true; btn.disabled=true; btn.textContent="Reserving your dates...";
      amzApi("POST","/api/bookings",body).then(function(j){
        try{sessionStorage.setItem("amz_booking",JSON.stringify({ref:j.reference,t:j.token}));}catch(e){}
        btn.textContent="Opening secure payment..."; location.href=j.payment_url;
      }).catch(function(e){
        sending=false; btn.disabled=false; btn.textContent="Continue to secure payment";
        var j=e.body||{};
        if(e.status===502&&j.reference&&j.token){ /* dates held, payment page didn't open: offer the same booking again */
          pm.innerHTML=(j.message||"We couldn't open the payment page.")+' <a href="'+statusUrl(j.reference,j.token)+'&back=1">Try the payment again</a>.'; return;}
        if(e.status===422&&j.reason==="coupon_invalid"){quoted=null; step(2,{focus:false}); markErr("cc",j.message); $("dateMsg").textContent=j.message; return;}
        if(e.status===422&&e.errors){var map={first_name:"fn",email:"em",phone:"ph",coupon_code:"cc"}, k=Object.keys(e.errors).filter(function(f){return map[f];});
          if(k.length){step(2,{focus:false}); k.forEach(function(f){markErr(map[f],e.errors[f][0]);}); $("dateMsg").textContent=e.errors[k[0]][0]; return;}}
        if(e.status===409&&j.reason&&j.reason!=="reservations_closed"){quoted=null; step(2,{focus:false}); $("dateMsg").textContent=j.message; return;}
        failMsg(pm,["Hi Amazona, I'd like to book "+state.name+".","Dates: "+ci.value+" to "+co.value+", "+gs.value+" guests.","Name: "+body.first_name+" "+body.last_name,"Email: "+body.email,"Phone: "+body.phone,body.notes?"Notes: "+body.notes:""],e);
        if(j.message&&e.status!==429) pm.insertAdjacentHTML("afterbegin",j.message.replace(/</g,"&lt;")+" ");
      });
    }
    window.bkStep=function(n){
      if(n>=2&&!state.res){step(1,{focus:true});return;}
      if(n>=3&&!validate()){if(cur!==2){summary();step(2,{focus:false});validate();}return;}
      if(API&&n===3){summary(); step(3,{focus:true}); quote(); return;}
      if(API&&n===4){payNow(); return;}
      if(n===4&&!sent){
        if(sending) return;
        var a0=parse(ci.value), nn=nights(), pct=tier(nn), ref="AMZ-"+String(a0.getFullYear()).slice(2)+pad(a0.getMonth()+1)+pad(a0.getDate())+"-"+(CODES[state.res]||"RES");
        var pay0=(document.querySelector('input[name="pay"]:checked')||{}).value||"card", btn=$("bkConfirm"), pm=$("payMsg");
        var data={form_type:"booking_request",first_name:$("fn").value.trim(),last_name:$("ln").value.trim(),email:$("em").value.trim(),phone:$("ph").value.trim(),
          residence:state.name,residence_id:state.res,check_in:ci.value,check_out:co.value,nights:nn,guests:gs.value,rate_eur:state.price,
          discount_pct:pct,total_eur:Math.round(state.price*nn*(100-pct)/100),payment_method:pay0,booking_ref:ref,message:$("rq").value.trim()};
        sending=true; btn.disabled=true; btn.textContent="Sending..."; pm.textContent="";
        amzSend(data).then(function(){sent=true; bkStep(4);}).catch(function(e){
          failMsg(pm,["Hi Amazona, I'd like to book "+state.name+".","Dates: "+ci.value+" to "+co.value+" ("+nn+" nights), "+gs.value+" guests.","Name: "+data.first_name+" "+data.last_name,"Email: "+data.email,data.phone?"Phone: "+data.phone:"",data.message?"Notes: "+data.message:""],e);
        }).then(function(){sending=false; btn.disabled=false; btn.textContent="Confirm reservation";});
        return;
      }
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
      q=amzParams(); clearErr(); $("dateMsg").textContent=""; sent=false; quoted=null; if($("payMsg")) $("payMsg").textContent="";
      if(window.amzLeadPrefill) amzLeadPrefill();
      document.querySelectorAll("#bp1 .rescard").forEach(function(c){c.classList.remove("sel");});
      state={res:null,price:0,name:"",type:"",img:"",max:5};
      var t=today(), nq=Math.max(1,parseInt(q.get("nights"),10)||7);
      var qi=parse(q.get("checkin")), qo=parse(q.get("checkout"));
      var f0=firstIn(), d21=addDays(t,21), a=(qi&&qi>=f0)?qi:(d21>f0?d21:f0), b=(qo&&qo>a)?qo:addDays(a,nq);
      ci.value=ymd(a); co.value=ymd(b); syncDates();
      /* ambassador links can carry their code: booking.html?code=MARINE10 */
      var qc=(q.get("code")||"").replace(/[^A-Za-z0-9]/g,"").slice(0,20); if($("cc")&&qc) $("cc").value=qc.toUpperCase();
      var want=parseInt(q.get("guests"),10)||2;
      var pre=q.get("residence"), btn=pre&&document.querySelector('[data-select="'+pre+'"]');
      if(btn){select(btn); setGuests(state.max,want); summary(); step(2,{scroll:false});}
      else{setGuests(5,want); summary(); step(1,{scroll:false});}
    };
    amzBookingPrefill();
  }


  /* ---------- custom dropdowns: the native list highlights options in the OS blue, so every <select>
     gets an on-brand listbox. The native select stays the source of truth (forms, tests, a11y). ---------- */
  var openX=null;
  function closeX(focusBtn){if(!openX)return;var o=openX;openX=null;o.list.hidden=true;o.btn.setAttribute("aria-expanded","false");o.wrap.classList.remove("open");if(focusBtn)o.btn.focus();}
  /* ---------- custom date picker: replaces the browser's blue calendar with an on-brand one.
     The real <input type="date"> stays in the page (invisible) as the source of truth, so forms, validation and scripts work unchanged. ---------- */
  function enhanceDates(){
    var MON=["January","February","March","April","May","June","July","August","September","October","November","December"];
    var DOW=["Mo","Tu","We","Th","Fr","Sa","Su"], DOWL=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    var desc=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
    function iso(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
    function parseD(v){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||""); return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
    function nice(d){return d.getDate()+" "+MON[d.getMonth()].slice(0,3)+" "+d.getFullYear();}
    var pairs={lci:"lco",checkin:"checkout"}, back={lco:"lci",checkout:"checkin"}, openOne=null;
    document.querySelectorAll('input[type="date"]:not([data-x])').forEach(function(inp){
      inp.setAttribute("data-x","1");
      var wrap=document.createElement("div"); wrap.className="xdate";
      inp.parentNode.insertBefore(wrap,inp); wrap.appendChild(inp);
      inp.classList.add("xdate-native"); inp.tabIndex=-1; inp.setAttribute("aria-hidden","true");
      var lab=document.querySelector('label[for="'+inp.id+'"]');
      var btn=document.createElement("button"); btn.type="button"; btn.className="xdate-btn"; btn.id=inp.id+"-btn";
      btn.setAttribute("aria-haspopup","dialog"); btn.setAttribute("aria-expanded","false");
      if(lab){lab.id=lab.id||inp.id+"-lab"; lab.setAttribute("for",btn.id);}
      btn.innerHTML='<span class="xdate-val"></span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
      wrap.appendChild(btn);
      var pop=document.createElement("div"); pop.className="xdate-pop"; pop.hidden=true; pop.setAttribute("role","dialog");
      pop.setAttribute("aria-label",(lab?lab.textContent.replace(/\(optional\)/,"").trim():"Date")+": choose a date");
      wrap.appendChild(pop);
      var view=null, focusD=null;
      function label(){var d=parseD(desc.get.call(inp)), v=btn.firstChild;
        v.textContent=d?nice(d):"Select a date"; btn.classList.toggle("empty",!d);
        btn.setAttribute("aria-label",(lab?lab.textContent.replace(/\(optional\)/,"").trim():"Date")+", "+(d?DOWL[(d.getDay()+6)%7]+" "+nice(d):"no date selected"));}
      /* scripts that set inp.value directly also refresh the label */
      Object.defineProperty(inp,"value",{configurable:true,get:function(){return desc.get.call(inp);},set:function(v){desc.set.call(inp,v); label();}});
      inp.addEventListener("change",label); inp.addEventListener("input",label);
      inp.addEventListener("focus",function(){btn.focus();});
      function lim(a){var d=parseD(inp.getAttribute(a)); return d;}
      function ok(d){var mn=lim("min"), mx=lim("max"); return !(mn&&d<mn)&&!(mx&&d>mx);}
      function rangeEnds(){var a=null,b=null;
        if(pairs[inp.id]){a=parseD(desc.get.call(inp)); b=parseD(($(pairs[inp.id])||{}).value);}
        else if(back[inp.id]){a=parseD(($(back[inp.id])||{}).value); b=parseD(desc.get.call(inp));}
        return [a,b];}
      function draw(){
        var y=view.getFullYear(), m=view.getMonth(), first=new Date(y,m,1), start=new Date(y,m,1-((first.getDay()+6)%7));
        var sel=parseD(desc.get.call(inp)), today=new Date(); today.setHours(0,0,0,0); var re=rangeEnds();
        var prevOk=!lim("min")||new Date(y,m,0)>=lim("min"), nextOk=!lim("max")||new Date(y,m+1,1)<=lim("max");
        var h='<div class="xdate-head"><button type="button" class="xdate-nav" data-nav="-1" aria-label="Previous month"'+(prevOk?"":" disabled")+'><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>'+
          '<div class="xdate-title" aria-live="polite">'+MON[m]+" "+y+'</div>'+
          '<button type="button" class="xdate-nav" data-nav="1" aria-label="Next month"'+(nextOk?"":" disabled")+'><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div>'+
          '<table class="xdate-grid" role="grid"><thead><tr>'+DOW.map(function(d,i){return '<th scope="col" abbr="'+DOWL[i]+'">'+d+'</th>';}).join("")+'</tr></thead><tbody>';
        var weeks=Math.ceil(((first.getDay()+6)%7+new Date(y,m+1,0).getDate())/7);
        for(var w=0;w<weeks;w++){h+="<tr>";
          for(var i=0;i<7;i++){var d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+w*7+i), v=iso(d), c=["xd"];
            if(d.getMonth()!==m) c.push("out"); if(!ok(d)) c.push("dis"); if(+d===+today) c.push("today");
            if(sel&&+d===+sel) c.push("sel");
            if(re[0]&&re[1]&&d>re[0]&&d<re[1]) c.push("inr"); if(re[0]&&+d===+re[0]) c.push("rs"); if(re[1]&&+d===+re[1]) c.push("re");
            var foc=focusD&&+d===+focusD;
            if(d.getMonth()!==m){h+='<td></td>'; continue;}
            h+='<td role="gridcell"'+(sel&&+d===+sel?' aria-selected="true"':'')+'><button type="button" class="'+c.join(" ")+'" data-d="'+v+'" tabindex="'+(foc?0:-1)+'"'+
              (ok(d)?"":' aria-disabled="true"')+' aria-label="'+DOWL[(d.getDay()+6)%7]+" "+nice(d)+'">'+d.getDate()+'</button></td>';}
          h+="</tr>";}
        h+='</tbody></table><div class="xdate-foot"><button type="button" class="xdate-link" data-act="clear">Clear</button><button type="button" class="xdate-link" data-act="today">Today</button></div>';
        pop.innerHTML=h;
      }
      function focusDay(){var b=pop.querySelector('button[data-d="'+iso(focusD)+'"]'); if(b) b.focus();}
      function open(){
        if(openOne&&openOne!==close) openOne();
        var sel=parseD(desc.get.call(inp)), mn=lim("min"), t=new Date(); t.setHours(0,0,0,0);
        focusD=sel||(mn&&mn>t?mn:t); if(!ok(focusD)&&mn) focusD=mn; view=new Date(focusD.getFullYear(),focusD.getMonth(),1);
        draw(); pop.style.left="0px"; pop.hidden=false; wrap.classList.add("open"); btn.setAttribute("aria-expanded","true");
        /* keep the calendar inside the screen (16px gutter) on narrow phones */
        var vw=document.documentElement.clientWidth, pr=pop.getBoundingClientRect(), sh=0;
        if(pr.right>vw-16) sh=vw-16-pr.right; if(pr.left+sh<16) sh=16-pr.left; pop.style.left=sh+"px";
        var r=pop.getBoundingClientRect(); wrap.classList.toggle("up",r.bottom>innerHeight-8&&r.top>r.height+80);
        openOne=close; focusDay();
      }
      function close(refocus){pop.hidden=true; wrap.classList.remove("open","up"); btn.setAttribute("aria-expanded","false"); if(openOne===close) openOne=null; if(refocus) btn.focus();}
      function pick(v){inp.value=v; inp.dispatchEvent(new Event("input",{bubbles:true})); inp.dispatchEvent(new Event("change",{bubbles:true})); close(true);}
      btn.addEventListener("click",function(){pop.hidden?open():close(true);});
      btn.addEventListener("keydown",function(e){if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault(); open();}});
      pop.addEventListener("click",function(e){
        var n=e.target.closest("[data-nav]"), d=e.target.closest("[data-d]"), a=e.target.closest("[data-act]");
        if(n&&!n.disabled){view=new Date(view.getFullYear(),view.getMonth()+(+n.getAttribute("data-nav")),1); focusD=new Date(view); if(!ok(focusD)&&lim("min")) focusD=lim("min"); draw(); pop.querySelector('[data-nav="'+n.getAttribute("data-nav")+'"]').focus();}
        else if(d&&!d.classList.contains("dis")) pick(d.getAttribute("data-d"));
        else if(a){if(a.getAttribute("data-act")==="clear") pick(""); else{var t=new Date(); t.setHours(0,0,0,0); if(ok(t)) pick(iso(t)); else{focusD=lim("min")||t; view=new Date(focusD.getFullYear(),focusD.getMonth(),1); draw(); focusDay();}}}
      });
      pop.addEventListener("keydown",function(e){
        if(e.key==="Escape"){e.preventDefault(); close(true); return;}
        if(e.key==="Tab"){var f=[].slice.call(pop.querySelectorAll("button:not([disabled])")).filter(function(b){return b.tabIndex!==-1||!b.hasAttribute("data-d");});
          var i=f.indexOf(document.activeElement); if(e.shiftKey&&i<=0){e.preventDefault(); f[f.length-1].focus();} else if(!e.shiftKey&&i===f.length-1){e.preventDefault(); f[0].focus();} return;}
        if(!e.target.hasAttribute("data-d")) return;
        var step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key], nd=null;
        if(step) nd=new Date(focusD.getFullYear(),focusD.getMonth(),focusD.getDate()+step);
        else if(e.key==="PageUp"||e.key==="PageDown") nd=new Date(focusD.getFullYear(),focusD.getMonth()+(e.key==="PageUp"?-1:1),focusD.getDate());
        else if(e.key==="Home") nd=new Date(focusD.getFullYear(),focusD.getMonth(),focusD.getDate()-((focusD.getDay()+6)%7));
        else if(e.key==="End") nd=new Date(focusD.getFullYear(),focusD.getMonth(),focusD.getDate()+6-((focusD.getDay()+6)%7));
        else if(e.key==="Enter"||e.key===" "){e.preventDefault(); if(ok(focusD)) pick(iso(focusD)); return;}
        if(nd){e.preventDefault(); focusD=nd; if(nd.getMonth()!==view.getMonth()||nd.getFullYear()!==view.getFullYear()) view=new Date(nd.getFullYear(),nd.getMonth(),1); draw(); focusDay();}
      });
      document.addEventListener("mousedown",function(e){if(!pop.hidden&&!wrap.contains(e.target)) close(false);});
      label();
    });
  }

  function enhanceSelects(){
    document.querySelectorAll("select:not([data-x])").forEach(function(sel,k){
      sel.setAttribute("data-x","1");
      var wrap=document.createElement("div"); wrap.className="xsel";
      sel.parentNode.insertBefore(wrap,sel); wrap.appendChild(sel);
      sel.classList.add("xsel-native"); sel.tabIndex=-1; sel.setAttribute("aria-hidden","true");
      var bid=(sel.id||("xs"+k))+"-btn", lid=(sel.id||("xs"+k))+"-list";
      var btn=document.createElement("button"); btn.type="button"; btn.className="xsel-btn"; btn.id=bid;
      btn.setAttribute("aria-haspopup","listbox"); btn.setAttribute("aria-expanded","false"); btn.setAttribute("aria-controls",lid);
      var lab=sel.id&&document.querySelector('label[for="'+sel.id+'"]');
      if(lab){lab.htmlFor=bid;} else if(sel.getAttribute("aria-label")) btn.setAttribute("aria-label",sel.getAttribute("aria-label"));
      if(sel.getAttribute("aria-describedby")) btn.setAttribute("aria-describedby",sel.getAttribute("aria-describedby"));
      var val=document.createElement("span"); val.className="xsel-val"; btn.appendChild(val);
      var list=document.createElement("ul"); list.className="xsel-list"; list.id=lid; list.setAttribute("role","listbox"); list.tabIndex=-1; list.hidden=true;
      wrap.appendChild(btn); wrap.appendChild(list);
      var o={sel:sel,btn:btn,list:list,wrap:wrap,act:0};
      function label(){var op=sel.options[sel.selectedIndex]; val.textContent=op?op.text:"";}
      function build(){list.innerHTML="";
        [].forEach.call(sel.options,function(op,i){var li=document.createElement("li"); li.id=lid+"-"+i; li.setAttribute("role","option");
          li.textContent=op.text; li.setAttribute("aria-selected",i===sel.selectedIndex?"true":"false"); li.dataset.i=i;
          li.addEventListener("mousedown",function(e){e.preventDefault();});
          li.addEventListener("click",function(){choose(i);});
          li.addEventListener("mousemove",function(){mark(i);});
          list.appendChild(li);});}
      function mark(i){o.act=i;[].forEach.call(list.children,function(li,j){li.classList.toggle("act",j===i);});
        var li=list.children[i]; if(li){list.setAttribute("aria-activedescendant",li.id); var t=li.offsetTop,b=t+li.offsetHeight;
          if(t<list.scrollTop)list.scrollTop=t; else if(b>list.scrollTop+list.clientHeight)list.scrollTop=b-list.clientHeight;}}
      function open(){if(openX&&openX!==o)closeX(false); build(); list.hidden=false; wrap.classList.add("open"); btn.setAttribute("aria-expanded","true");
        openX=o; mark(Math.max(0,sel.selectedIndex)); list.focus({preventScroll:true});}
      function choose(i){var changed=sel.selectedIndex!==i; sel.selectedIndex=i; label(); closeX(true);
        if(changed){sel.dispatchEvent(new Event("input",{bubbles:true})); sel.dispatchEvent(new Event("change",{bubbles:true}));}}
      btn.addEventListener("click",function(){if(openX===o)closeX(true); else open();});
      btn.addEventListener("keydown",function(e){if(["ArrowDown","ArrowUp","Enter"," "].indexOf(e.key)>=0){e.preventDefault();open();}});
      list.addEventListener("keydown",function(e){var n=sel.options.length;
        if(e.key==="ArrowDown"){e.preventDefault();mark(Math.min(n-1,o.act+1));}
        else if(e.key==="ArrowUp"){e.preventDefault();mark(Math.max(0,o.act-1));}
        else if(e.key==="Home"){e.preventDefault();mark(0);} else if(e.key==="End"){e.preventDefault();mark(n-1);}
        else if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(o.act);}
        else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closeX(true);}
        else if(e.key==="Tab"){closeX(false);}
        else if(e.key.length===1){var c=e.key.toLowerCase();for(var j=1;j<=n;j++){var q=(o.act+j)%n;if(sel.options[q].text.toLowerCase().charAt(0)===c){mark(q);break;}}}});
      list.addEventListener("blur",function(){setTimeout(function(){if(openX===o&&!wrap.contains(document.activeElement))closeX(false);},0);});
      sel.addEventListener("change",label); sel.addEventListener("input",label);
      document.addEventListener("ccychange",label);
      if(window.MutationObserver) new MutationObserver(function(){label(); if(openX===o)build(),mark(o.act);}).observe(sel,{childList:true,subtree:true,characterData:true});
      label();
    });
  }
  window.amzSelRefresh=function(){document.querySelectorAll(".xsel .xsel-native").forEach(function(s){s.dispatchEvent(new Event("input"));});};
  document.addEventListener("mousedown",function(e){if(openX&&!openX.wrap.contains(e.target))closeX(false);});
  function leadForm(){
    var f=$("leadForm"); if(!f) return;
    var btn=$("leadBtn"), msg=$("leadMsg"), lci=$("lci"), lco=$("lco");
    function mark(id,t){var el=$(id),fl=el.closest(".field"),p=$("err-"+id); fl.classList.add("err"); el.setAttribute("aria-invalid","true");
      if(p){p.textContent=t; p.hidden=false; el.setAttribute("aria-describedby","err-"+id);}}
    function clear(id){var el=$(id); if(!el) return; el.closest(".field").classList.remove("err"); el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby");
      var p=$("err-"+id); if(p){p.hidden=true; p.textContent="";}}
    ["lfn","lem","lph","lco"].forEach(function(id){$(id).addEventListener("input",function(){clear(id);});});
    var t=new Date(); t.setHours(0,0,0,0); function ymd2(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
    var e0=window.amzEarliest?amzEarliest():""; lci.min=e0&&e0>ymd2(t)?e0:ymd2(t); lco.min=lci.min;
    lci.addEventListener("change",function(){if(!lci.value) return; var d=new Date(lci.value+"T00:00:00"); d.setDate(d.getDate()+1); lco.min=ymd2(d);
      if(lco.value&&lco.value<=lci.value) lco.value=""; clear("lco");});
    function done(name){$("leadName").textContent=name; if(!name) $("leadDone").querySelector("h3").textContent="Thank you."; f.hidden=true; var d=$("leadDone"); d.hidden=false; d.focus({preventScroll:true});
      var r=d.getBoundingClientRect(); if(r.top<90||r.top>innerHeight-120) scrollTo({top:r.top+scrollY-120,behavior:"auto"});}
    f.addEventListener("submit",function(ev){
      ev.preventDefault(); ["lfn","lem","lph","lco"].forEach(clear); msg.textContent="";
      var v=function(n){return (f.elements[n].value||"").trim();}, errs=[];
      if(!v("first_name")) errs.push(["lfn","Please add your first name."]);
      if(!v("email")) errs.push(["lem","Please add your email so we can reach you."]);
      else if(!$("lem").checkValidity()) errs.push(["lem","Please check the email address, for example name@example.com."]);
      if(v("phone")&&(v("phone").match(/\d/g)||[]).length<7) errs.push(["lph","Please check the number, including the country code."]);
      if(lci.value&&lco.value&&lco.value<=lci.value) errs.push(["lco","Departure must be after arrival."]);
      if(errs.length){errs.forEach(function(x){mark(x[0],x[1]);}); msg.textContent=errs.length===1?errs[0][1]:"Please check the "+errs.length+" highlighted fields.";
        $(errs[0][0]).focus(); return;}
      var sel=$("lres"), nights=(lci.value&&lco.value)?Math.round((new Date(lco.value)-new Date(lci.value))/864e5):"";
      var data={form_type:"register_interest",first_name:v("first_name"),last_name:v("last_name"),email:v("email"),phone:v("phone"),
        residence_id:sel.value,residence:sel.value?sel.options[sel.selectedIndex].text:"",guests:v("guests"),check_in:lci.value,check_out:lco.value,nights:nights,
        message:v("message"),marketing_opt_in:f.elements.marketing_opt_in.checked?"yes":"no",company_website:v("company_website")};
      btn.disabled=true; btn.textContent="Sending...";
      amzSend(data).then(function(){done(data.first_name);}).catch(function(e){
        if(e&&e.errors){var map={first_name:"lfn",email:"lem",phone:"lph",check_out:"lco"}; Object.keys(e.errors).forEach(function(k){if(map[k]) mark(map[k],e.errors[k]);});}
        failMsg(msg,["Hi Amazona, please let me know when reservations open.","Name: "+data.first_name+" "+data.last_name,"Email: "+data.email,
          data.phone?"Phone: "+data.phone:"",data.residence?"Residence: "+data.residence:"",data.check_in?"Dates: "+data.check_in+(data.check_out?" to "+data.check_out:""):"",
          "Guests: "+data.guests,data.message?"Notes: "+data.message:""],e);
      }).then(function(){btn.disabled=false; btn.textContent="Register my interest";});
    });
    /* residence and nights from the link (home calculator, residence pages) */
    window.amzLeadPrefill=function(){var q=amzParams(), r=q.get("residence"), sel=$("lres");
      if(r&&sel.querySelector('option[value="'+r.replace(/[^a-z-]/g,"")+'"]')){sel.value=r; sel.dispatchEvent(new Event("change"));}
      if(q.get("lead")==="ok") done("");};
    amzLeadPrefill();
  }

  document.addEventListener("DOMContentLoaded",function(){
    enhanceSelects(); enhanceDates(); apply(); counter("resTrack","resCount"); counter("resTrack2","resCount2"); counter("facTrack","facCount");
    galA11y(); resGallery(); calc(); leadForm(); booking(); bookingStatus(); mbar(); mapFallback();
  });
})();
