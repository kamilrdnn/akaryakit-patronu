/* çizim hızı ölçümü */
const fs=require('fs'),path=require('path'),vm=require('vm');
const {createCanvas}=require('@napi-rs/canvas');
const A=path.join(__dirname,'..','app','src','main','assets','js')+'/';
const EN=420,BOY=900;
const tuval=createCanvas(EN*2,BOY*2);
tuval.parentNode={clientWidth:EN,clientHeight:BOY};tuval.style={};tuval.addEventListener=function(){};
const depo={};
const sandbox={console,performance:{now:()=>Number(process.hrtime.bigint()/1000n)/1000},
 localStorage:{getItem:k=>(k in depo?depo[k]:null),setItem:(k,v)=>{depo[k]=String(v)},removeItem:k=>{delete depo[k]}},
 devicePixelRatio:2,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},setTimeout:()=>0,addEventListener:()=>{},
 document:{getElementById:id=>(id==='tuval'?tuval:null),querySelectorAll:()=>[],
  createElement:(et)=>et==='canvas'?createCanvas(8,8):({classList:{add(){},remove(){},toggle(){}},style:{}}),
  body:{classList:{toggle(){},add(){},remove(){}},appendChild(){}},addEventListener:()=>{}}};
sandbox.window=sandbox;
const ctx=vm.createContext(sandbox);
vm.runInContext('var UI={bildir:function(){},ciz:function(){},modal:function(){},tikCiz:function(){},basarimToast:function(){},hucreTik:function(){}};',ctx);
['veri.js','durum.js','sim.js','izo.js','model.js','ekler.js'].forEach(f=>vm.runInContext(fs.readFileSync(A+f,'utf8'),ctx,{filename:f}));
const D=vm.runInContext('D',ctx),SIM=vm.runInContext('SIM',ctx),IZO=vm.runInContext('IZO',ctx);
D.yeni();D.s.para=9e7;D.s.seviye=20;
const sb=D.sube();
for(let g=0;g<30 && (sb.w<9||sb.h<7);g++) SIM.arsaGenislet(sb);
for(let i=0;i<sb.beton.length;i++) sb.beton[i]=true;
for(let i=0;i<5;i++){const y=SIM.yerAc(sb,'pompa'); if(y>=0) SIM.pompaKur(sb,y,i%2?'dizel':'benzin');}
['market','kafe','depo','wc','yikama','totem','gunes','atm','mescit','havasu','restoran','yag'].forEach(t=>{const y=SIM.yerAc(sb,'bina');if(y>=0)SIM.binaKur(sb,y,t);});
sb.tank.benzin.dolu=9000;sb.tank.dizel.dolu=9000;sb.tank.lpg.dolu=3000;
for(let i=0;i<60 && sb.kuyruk.length<8;i++){const m=SIM.musteriYap(sb);if(m)sb.kuyruk.push(m);}
IZO.kur();
D.s.saat=13;
for(let i=0;i<30;i++){IZO.guncelle(0.016);IZO.ciz();}
let t0=Number(process.hrtime.bigint());
const N=120;
for(let i=0;i<N;i++){IZO.guncelle(0.016);IZO.ciz();}
let t1=Number(process.hrtime.bigint());
const ms=(t1-t0)/1e6/N;
console.log('kare başına:',ms.toFixed(2),'ms  ·  ~',Math.round(1000/ms),'fps (masaüstü node)');
console.log('süs sayısı:',IZO.susler.length,'araç:',IZO.arabalar.length,'yaya:',(IZO.yayalar||[]).length);

/* --- bölüm bölüm ölçüm --- */
function olc(ad, fn, kez) {
  kez = kez || 60;
  const t0 = Number(process.hrtime.bigint());
  for (let i = 0; i < kez; i++) fn();
  const t1 = Number(process.hrtime.bigint());
  console.log('  ' + ad + ': ' + ((t1 - t0) / 1e6 / kez).toFixed(2) + ' ms');
}
console.log('--- bölümler ---');
const cz = IZO.cz;
olc('zemin blit', () => IZO.zeminBlit(sb, 1));
const eskiZemin = IZO.zeminBlit;
IZO.zeminBlit = () => true;
olc('zeminsiz tam kare', () => IZO.ciz());
IZO.zeminBlit = eskiZemin;
const eskiSus = IZO.susCiz;
IZO.susCiz = () => {};
olc('süssüz tam kare', () => IZO.ciz());
IZO.susCiz = eskiSus;
const eskiYapi = IZO.yapiCiz;
IZO.yapiCiz = () => {};
olc('yapısız tam kare', () => IZO.ciz());
IZO.yapiCiz = eskiYapi;
olc('tam kare', () => IZO.ciz());
