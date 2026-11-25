/* sürüş / yürüyüş fiziği dayanıklılık testi: takılan, yan giden, üst üste binen araç var mı */
const fs=require('fs'),path=require('path'),vm=require('vm');
const {createCanvas}=require('@napi-rs/canvas');
const A=path.join(__dirname,'..','app','src','main','assets','js')+'/';
const EN=420,BOY=900;
const tuval=createCanvas(EN*2,BOY*2);
tuval.parentNode={clientWidth:EN,clientHeight:BOY};tuval.style={};tuval.addEventListener=function(){};
const depo={};
let saat=1e6;
const sandbox={console,performance:{now:()=>saat},Date:{now:()=>saat},
 localStorage:{getItem:k=>(k in depo?depo[k]:null),setItem:(k,v)=>{depo[k]=String(v)},removeItem:k=>{delete depo[k]}},
 devicePixelRatio:2,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},setTimeout:()=>0,addEventListener:()=>{},
 document:{getElementById:id=>(id==='tuval'?tuval:null),querySelectorAll:()=>[],
  createElement:(et)=>et==='canvas'?createCanvas(8,8):({classList:{add(){},remove(){},toggle(){}},style:{}}),
  body:{classList:{toggle(){},add(){},remove(){}},appendChild(){}},addEventListener:()=>{}}};
sandbox.window=sandbox;
const ctx=vm.createContext(sandbox);
vm.runInContext('var UI={bildir:function(){},ciz:function(){},modal:function(){},tikCiz:function(){},basarimToast:function(){},hucreTik:function(){},rehberKontrol:function(){}};var OYUN={duruyor:false};var SES={cal:function(){}};',ctx);
['veri.js','durum.js','sim.js','izo.js','model.js'].forEach(f=>vm.runInContext(fs.readFileSync(A+f,'utf8'),ctx,{filename:f}));
const D=vm.runInContext('D',ctx),SIM=vm.runInContext('SIM',ctx),IZO=vm.runInContext('IZO',ctx);
let hata=0; const kontrol=(k,m)=>{ if(!k){console.log('  ✗ '+m);hata++;} };
function kos(ad, kur, sn){
  D.yeni();D.s.para=9e7;D.s.seviye=20;
  const sb=D.sube(); kur(sb);
  sb.tank.benzin.dolu=sb.tank.benzin.kap||9000;sb.tank.dizel.dolu=sb.tank.dizel.kap||9000;sb.tank.lpg.dolu=3000;
  IZO._sahneAnahtar=null; IZO.kur(); D.s.saat=13;
  const iz=new Map(); let enUzunDuran=0, yan=0, toplamKare=0, binis=0, servis=0, maxArac=0, cikan=0, uzakDolum=0;
  const dt=1/30;
  for(let k=0;k<sn*30;k++){
    saat+=dt*1000;
    if(k%30===0){ try{SIM.tik(1);}catch(e){ console.log('tik hatası',e.message); hata++; break; } D.s.saat=13; }
    /* oyuncu yerine servis: pompadaki müşteriyi hemen sat */
    if(k%15===0){ sb.kuyruk.forEach(m=>{ if(m.durum==='pompada'){ try{ SIM.servisBaslat?SIM.servisBaslat(sb,m.id):0; }catch(e){} } }); }
    IZO.guncelle(dt);
    if(process.env.TIK){ IZO.arabalar.forEach(a=>{ if(a._tikali>5.9&&a._tikali<5.95){ const ca=Math.cos(a.aci),sa=Math.sin(a.aci); const bl=IZO.arabalar.filter(b=>b!==a&&Math.hypot(b.gx-a.gx,b.gy-a.gy)<1.6&&((b.gx-a.gx)*ca+(b.gy-a.gy)*sa)>0).map(b=>[b.durum,b.mid?'m':'t',b.gx.toFixed(2),b.gy.toFixed(2),(b.yol||[]).length,(b._tikali||0).toFixed(1),(b.bekle||0).toFixed(1)]); console.log('TIK',a.durum,a.mid?'m':'t',a.gx.toFixed(2),a.gy.toFixed(2),a.aci.toFixed(2),JSON.stringify(a.yol[0]),'<-',JSON.stringify(bl)); } }); }
    if(process.env.IZ){ IZO.arabalar.forEach(a=>{ if(a.mid&&a.bekYeri&&(!a.yol||!a.yol.length)&&Math.abs(a.gx-a.bekYeri.gx)>0.3&&!a._log){a._log=1;console.log('KOPUK',k,a.durum,a.gx.toFixed(2),a.gy.toFixed(2),JSON.stringify(a.bekYeri),a._onceYol);} a._onceYol=JSON.stringify(a.yol)+a.durum; }); }
    maxArac=Math.max(maxArac,IZO.arabalar.length);
    sb.kuyruk.forEach(m=>{ if(m.pompa!==null&&m.durum==='pompada'&&!m.yolda){ const a=IZO.arabalar.find(x=>x.mid===m.id); const px=m.pompa%sb.w,py=Math.floor(m.pompa/sb.w); if(!a||Math.hypot(a.gx-px-0.52,a.gy-py-0.82)>0.3) uzakDolum++; } });
    IZO.arabalar.forEach(a=>{
      let z=iz.get(a); if(!z){ z={gx:a.gx,gy:a.gy,dur:0}; iz.set(a,z); }
      const dx=a.gx-z.gx, dy=a.gy-z.gy, u=Math.hypot(dx,dy);
      if(u>1e-4){
        toplamKare++;
        const hareket=Math.atan2(dy,dx); let f=Math.abs(hareket-a.aci)%(2*Math.PI); if(f>Math.PI)f=2*Math.PI-f;
        if(f>0.6 && u>0.004) yan++;
        z.dur=0;
      } else if(a.yol&&a.yol.length&&!(a.bekle>0)){ z.dur+=dt; enUzunDuran=Math.max(enUzunDuran,z.dur); }
      z.gx=a.gx; z.gy=a.gy;
      if(a.sil||a.gx>sb.w+6) cikan++;
    });
    /* hareket halindeki iki araç iç içe mi */
    for(let i=0;i<IZO.arabalar.length;i++)for(let j=i+1;j<IZO.arabalar.length;j++){
      const p=IZO.arabalar[i],q=IZO.arabalar[j];
      if(Math.hypot(p.gx-q.gx,p.gy-q.gy)<0.2){ binis++; if(process.env.AYR&&binis%40===1)console.log(p.durum,p.mid?"m":"t",p.gx.toFixed(2),p.gy.toFixed(2),(p.yol||[]).length,"|",q.durum,q.mid?"m":"t",q.gx.toFixed(2),q.gy.toFixed(2),(q.yol||[]).length,"h",sb.h, JSON.stringify([p,q].map(x=>{const m=sb.kuyruk.find(m=>m.id===x.mid);return m?[m.pompa,m.durum,sb.kuyruk.indexOf(m),x.hedefPompa,x.bekYeri]:null}))); }
    }
    if(k%10===0){ try{IZO.ciz();}catch(e){ console.log('çizim hatası',e.message); hata++; break; } }
  }
  const yuzde=toplamKare?yan/toplamKare*100:0;
  console.log(`  ${ad}: araç tepe ${maxArac}, en uzun takılma ${enUzunDuran.toFixed(1)} sn, yan kayma %${yuzde.toFixed(2)}, iç içe kare ${binis}, satış ${sb.gunSatis||''}`);
  kontrol(enUzunDuran<25, ad+': araç '+enUzunDuran.toFixed(1)+' sn takıldı');
  kontrol(yuzde<1.5, ad+': yan giden araç %'+yuzde.toFixed(2));
  kontrol(binis<sn*2, ad+': iç içe araç '+binis);
  kontrol(maxArac>0, ad+': hiç araç yok');
  kontrol(uzakDolum===0, ad+': araç pompada değilken dolum açık ('+uzakDolum+' kare)');
  (IZO.yayalar||[]).forEach(p=>kontrol(isFinite(p.gx)&&isFinite(p.gy),'yaya konumu bozuk'));
}
console.log('FİZİK TEST — sürüş ve yürüyüş');
kos('başlangıç', sb=>{}, 240);
kos('büyük', sb=>{ for(let g=0;g<30&&(sb.w<9||sb.h<7);g++)SIM.arsaGenislet(sb); for(let i=0;i<sb.beton.length;i++)sb.beton[i]=true;
  for(let i=0;i<5;i++){const y=SIM.yerAc(sb,'pompa'); if(y>=0)SIM.pompaKur(sb,y,i%2?'dizel':'benzin');}
  ['market','kafe','depo','wc','yikama','totem','atm','restoran'].forEach(t=>{const y=SIM.yerAc(sb,'bina');if(y>=0)SIM.binaKur(sb,y,t);});
  for(let i=0;i<6;i++) try{SIM.personelAl(sb,'pompaci');}catch(e){} }, 300);
fs.writeFileSync(path.join(__dirname,'sahne-fizik.png'),tuval.toBuffer('image/png'));
console.log(hata?('❌ '+hata+' hata'):'✅ FİZİK TESTLERİ GEÇTİ');
process.exit(hata?1:0);
