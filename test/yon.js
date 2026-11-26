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
['veri.js','durum.js','sim.js','izo.js','model.js','ekler.js'].forEach(f=>vm.runInContext(fs.readFileSync(A+f,'utf8'),ctx,{filename:f}));
const D=vm.runInContext("D",ctx),SIM=vm.runInContext("SIM",ctx),IZO=vm.runInContext("IZO",ctx);
const yaz=require('fs');
for(const yolSv of [1,2,3]) for(const kv of [0,2]){
  D.yeni();D.s.para=9e7;D.s.seviye=20; const sb=D.sube(); sb.yol=yolSv; sb.kavsak=kv; sb.giris=3;
  SIM.pompaKoy&&0; IZO._sahneAnahtar=null; IZO.kur(); D.s.saat=13;
  const ek=SIM.yolEk(sb), orta=sb.h+2+ek/2; const iz=new Map(); let ters={}, top=0; const dt=1/30;
  for(let k=0;k<200*30;k++){ saat+=dt*1000; if(k%30===0){SIM.tik(1);D.s.saat=13;}
    if(k%15===0) sb.kuyruk.forEach(m=>{ if(m.durum==='pompada'){ try{SIM.servisBaslat(sb,m.id);}catch(e){} } });
    IZO.guncelle(dt);
    IZO.arabalar.forEach(a=>{ const z=iz.get(a); if(z&&a.gy>sb.h+1.05){ const dx=a.gx-z.x; if(Math.abs(dx)>0.01){ top++; const yakin=a.gy<orta; const kavsakta=a.karsidan; if((yakin&&dx<0)||(!yakin&&dx>0)){ const an=(a.mid?'mus':'trafik')+':'+a.durum+(kavsakta?':karsi':'')+' gy'+(a.gy-sb.h).toFixed(1); ters[an]=(ters[an]||0)+1; } } } iz.set(a,{x:a.gx}); });
    if(k===3000&&yolSv===3&&kv===2){ IZO.ciz(); yaz.writeFileSync('yon.png',tuval.toBuffer('image/png')); }
  }
  console.log('yol',yolSv,'kavsak',kv,'serit',JSON.stringify(IZO.trafikSeritleri(sb)),'orta',orta-sb.h,'hareket',top,'ters',JSON.stringify(ters));
}
