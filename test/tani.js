/* dokunma tanılama */
const fs=require('fs'),path=require('path'),vm=require('vm');
const {createCanvas}=require('@napi-rs/canvas');
const A=path.join(__dirname,'..','app','src','main','assets','js')+'/';
const EN=420,BOY=760;
const tuval=createCanvas(EN*2,BOY*2);
tuval.parentNode={clientWidth:EN,clientHeight:BOY};tuval.style={};tuval.addEventListener=function(){};
const depo={};
let tiklanan=[];
const sandbox={console,performance:{now:()=>Date.now()},
 localStorage:{getItem:k=>(k in depo?depo[k]:null),setItem:(k,v)=>{depo[k]=String(v)},removeItem:k=>{delete depo[k]}},
 devicePixelRatio:2,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},setTimeout:()=>0,addEventListener:()=>{},
 document:{getElementById:id=>(id==='tuval'?tuval:null),querySelectorAll:()=>[],
  createElement:(et)=>et==='canvas'?createCanvas(8,8):({classList:{add(){},remove(){},toggle(){}},style:{}}),
  body:{classList:{toggle(){},add(){},remove(){}},appendChild(){}},addEventListener:()=>{}}};
sandbox.window=sandbox;
const ctx=vm.createContext(sandbox);
vm.runInContext('var UI={bildir:function(){},ciz:function(){},modal:function(){},tikCiz:function(){},basarimToast:function(){},hucreTik:function(k){globalThis.__tik.push(k)}};',ctx);
vm.runInContext('globalThis.__tik=[];',ctx);
['veri.js','durum.js','sim.js','izo.js'].forEach(f=>vm.runInContext(fs.readFileSync(A+f,'utf8'),ctx,{filename:f}));
const D=vm.runInContext('D',ctx),SIM=vm.runInContext('SIM',ctx),IZO=vm.runInContext('IZO',ctx),VERI=vm.runInContext('VERI',ctx);
D.yeni();D.s.para=9e7;D.s.seviye=20;
const sb=D.sube();
for(let g=0;g<20 && (sb.w<5||sb.h<5);g++) SIM.arsaGenislet(sb);
for(let i=0;i<sb.beton.length;i++) sb.beton[i]=true;
SIM.pompaKur(sb,SIM.yerAc(sb,'pompa'),'lpg');
['market','kafe','depo','wc','yikama','totem'].forEach(t=>{const y=SIM.yerAc(sb,'bina');if(y>=0)SIM.binaKur(sb,y,t);});
IZO.kur();
D.s.saat=13;
IZO.guncelle(0.016);
IZO.ciz();
console.log('vurus poligon sayısı:',IZO.vurus.length);
let ok=0,kotu=0;
for(let i=0;i<sb.yapi.length;i++){
  const y=sb.yapi[i]; if(!y) continue;
  const gx=i%sb.w, gy=Math.floor(i/sb.w);
  const z = y.t==='pompa'?20:(y.t==='totem'?75:16);
  const p=IZO.ekran(gx+0.5,gy+0.5,z);
  vm.runInContext('globalThis.__tik=[]',ctx);
  IZO.dokunuldu(p.x,p.y);
  const tik=vm.runInContext('globalThis.__tik',ctx);
  const sonuc=tik.length?tik[0]:null;
  if(sonuc===i) ok++; else {kotu++; console.log(`  ✗ hücre ${i} (${y.t}) ekran(${p.x.toFixed(0)},${p.y.toFixed(0)}) -> ${sonuc}`);}
}
console.log(`isabet: ${ok} / hata: ${kotu}`);
