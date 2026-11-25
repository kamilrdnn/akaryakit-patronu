/* model galerisi: araç, insan ve binaları büyük ölçekte tek resme basar */
const fs=require('fs'),path=require('path'),vm=require('vm');
const {createCanvas}=require('@napi-rs/canvas');
const A=path.join(__dirname,'..','app','src','main','assets','js')+'/';
const EN=900,BOY=1100;
const tuval=createCanvas(EN,BOY);
tuval.parentNode={clientWidth:EN,clientHeight:BOY};tuval.style={};tuval.addEventListener=function(){};
const depo={};
const sandbox={console,performance:{now:()=>Date.now()},
 localStorage:{getItem:k=>(k in depo?depo[k]:null),setItem:(k,v)=>{depo[k]=String(v)},removeItem:k=>{delete depo[k]}},
 devicePixelRatio:1,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},setTimeout:()=>0,addEventListener:()=>{},
 document:{getElementById:id=>(id==='tuval'?tuval:null),querySelectorAll:()=>[],
  createElement:(et)=>et==='canvas'?createCanvas(8,8):({classList:{add(){},remove(){},toggle(){}},style:{}}),
  body:{classList:{toggle(){},add(){},remove(){}},appendChild(){}},addEventListener:()=>{}}};
sandbox.window=sandbox;
const ctx=vm.createContext(sandbox);
vm.runInContext('var UI={bildir:function(){},ciz:function(){},modal:function(){},tikCiz:function(){},basarimToast:function(){},hucreTik:function(){}};',ctx);
['veri.js','durum.js','sim.js','izo.js','model.js'].forEach(f=>vm.runInContext(fs.readFileSync(A+f,'utf8'),ctx,{filename:f}));
const D=vm.runInContext('D',ctx),IZO=vm.runInContext('IZO',ctx);
D.yeni(); D.s.saat=+(process.argv[2]||13);
IZO.kur();
const c=tuval.getContext('2d');
IZO.cz=c; c.setTransform(1,0,0,1,0,0);
c.fillStyle='#8fb872'; c.fillRect(0,0,EN,BOY);
IZO.vurus=[]; IZO.isaretler=[];
IZO.kam={x:450,y:120,olcek:2.6,kuruldu:true};
IZO._zengin=true;
const tipler=['oto','taksi','minibus','otobus','tir','traktor','motor'];
tipler.forEach((t,i)=>{ for(let k=0;k<4;k++){ IZO.arabalar=[]; const a={cesit:t,renk:['#d64545','#3f7fd0','#e0a92e','#f0f2f5'][k],gx:-1.2+k*1.5+i*1.25,gy:1.2-k*1.5+i*1.25,aci:[0,Math.PI/2,Math.PI,-Math.PI/2][k]+ (i%2?0.4:0)}; if(t==='taksi')a.renk='#e8b21f'; IZO.arabaCiz(a);} });
IZO._zengin=false;
['pompaci','temizlik','teknisyen','mudur',null,null,null].forEach((tp,i)=>{
  IZO.insanModel({gx:-3+i*0.7,gy:4+i*0.7,renk:['#2f6fa8','#3ec47a','#f0b429','#9f7aea','#c75f5f','#4f7fc0','#d1a23c'][i],tip:tp,faz:i*0.9,yuruyor:i>3||i==1,yon:i%2?1:-1,arkasi:i===6,calisiyor:i===0,tohum:i*7}, tp?'#e24e2f':null);
});
fs.writeFileSync(path.join(__dirname,'galeri.png'),tuval.toBuffer('image/png'));
c.fillStyle='#a9b1ba'; c.fillRect(0,0,EN,BOY);
const bl=['market','kafe','restoran','ofis','yag','lastikci','wc','mescit','depo','gunes','jenerator','smr','tirpark','havasu','atm','adblue','kamera','yangin','yikama'];
IZO.kam={x:450,y:170,olcek:3.3,kuruldu:true};
const sb=D.sube();
bl.forEach((t,i)=>{ const r=Math.floor(i/4), k=i%4; const gx=k*1.05 - r*1.05 + r*2.1*0+ r*1.05, gy=r*1.05 - k*1.05 + k*2.1*0 + r*0; IZO.binaCiz(sb,0,k*1.05+r*1.0-1.5, r*1.0-k*1.05+1.5,{t:t,sv:2}); });
IZO.kam={x:450,y:120,olcek:2.4,kuruldu:true};
IZO.pompaCiz(sb,0,3.5,6.5,{yakit:'benzin',sv:3}); IZO.pompaCiz(sb,0,5,5,{yakit:'ev',sv:1}); IZO.pompaCiz(sb,0,2,8,{yakit:'lpg',sv:2});
c.fillStyle=D.s.saat>19?'#39424d':'#a9b1ba'; c.fillRect(0,0,EN,BOY);
IZO.kam={x:140,y:520,olcek:3.2,kuruldu:true};
sb.fiyat.benzin=51.73;
['klasik','genis','kule','tente'].forEach((sk,k)=>{ D.s.tabela={ad:['KAMİL PETROL','ÖZKAN OIL','EGE','PETROL'][k],renk:['mavi','kirmizi','lacivert','turuncu'][k],sekil:sk,logo:'⛽',fiyat:true,kanopi:false}; IZO.binaCiz(sb,0,k*0.75,-k*0.75,{t:'totem',sv:1}); });
console.log('hata',IZO._sprHata||'-');
fs.writeFileSync(path.join(__dirname,'galeri2.png'),tuval.toBuffer('image/png'));
console.log('ok', IZO._sprHata||'');
