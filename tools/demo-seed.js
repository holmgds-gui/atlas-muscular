/* Dados de exemplo (4 semanas de treino, cardio, 2 treinos montados, peso 80 kg) usados pelos prints da apresentação e da loja.
   Roda dentro da página (p.evaluate(seed)). */
module.exports=()=>{
  localStorage.clear();
  const R=(id,sel={})=>{const f=FAMBY[id];const s={...f.d,...sel};return [vName(f,s),mkRef(f,s)]};
  const it=(id,sets,t="8-12")=>{const x=R(id);return {name:x[0],ref:x[1],target:t,notes:"",sets:sets.map(([r,kg])=>({r:String(r),kg:String(kg)}))}};
  const pl=(id,s,r)=>{const x=R(id);return {name:x[0],ref:x[1],sets:s,reps:r}};
  const S=(n,r,kg)=>Array.from({length:n},()=>[r,kg]);
  const A=f=>[it("supino",S(4,8,80*f)),it("remcurv",S(4,8,70*f)),it("desenv",S(3,8,45*f)),it("puxada",S(3,10,60*f)),it("rosca",S(3,10,30*f),"10-15"),it("pushdown",S(3,12,30*f),"10-15")];
  const B=f=>[it("agach",S(4,6,100*f)),it("stiff",S(3,8,80*f)),it("legpress",S(3,12,200*f),"10-15"),it("flexora",S(3,12,45*f),"10-15"),it("pant",S(4,15,80*f),"12-20"),it("crunch",S(3,15,0),"12-20")];
  const C=f=>[it("barrafixa",S(4,8,0)),it("elevlat",S(4,15,10*f),"12-20"),it("crucifixo",S(3,12,16*f),"10-15"),it("remapoiada",S(3,10,26*f)),it("frances",S(3,12,20*f),"10-15"),it("encolh",S(3,12,60*f),"10-15")];
  const D=f=>[it("terra",S(3,5,140*f),"4-6"),it("hipthrust",S(3,10,120*f)),it("extensora",S(3,12,50*f),"10-15"),it("afundo",S(3,10,20*f)),it("pant",S(3,15,80*f),"12-20"),it("prancha",S(3,1,0))];
  const day=o=>{const d=new Date();d.setDate(d.getDate()-o);return isoDate(d)};
  const W=[];let id=0;
  // hoje = sábado: seg (5), ter (4), qui (2), sex (1); e as 3 semanas anteriores com cargas um pouco menores
  for(const [wk,f] of [[0,1],[1,.95],[2,.92],[3,.9]]){
    for(const [o,t,fn] of [[5,"Superior A",A],[4,"Inferior A",B],[2,"Superior B",C],[1,"Inferior B",D]])
      W.push({id:"w"+(id++),date:day(o+wk*7),title:t,planId:"p"+t,done:true,notes:"",items:fn(f)});
  }
  // cardio nesta semana: corrida (qua, 30 min moderado) e bike (sáb, 40 min forte)
  const car=(o,k,min,int)=>({id:"c"+(id++),date:day(o),title:"Cardio",planId:null,done:true,notes:"",items:[{name:k,ref:"cardio:"+k,target:"",notes:"",sets:[{min:String(min),km:"",int,ok:true}]}]});
  W.push(car(3,"run",30,"m"),car(0,"bike",40,"f"));
  localStorage.setItem("atlas-workouts",JSON.stringify(W));
  const P=[["Superior A",[pl("supino",4,"6-10"),pl("remcurv",4,"6-10"),pl("desenv",3,"8-12"),pl("puxada",3,"8-12"),pl("rosca",3,"10-15"),pl("pushdown",3,"10-15")]],
    ["Inferior A",[pl("agach",4,"6-10"),pl("stiff",3,"8-12"),pl("legpress",3,"10-15"),pl("flexora",3,"10-15"),pl("pant",4,"12-20")]]];
  localStorage.setItem("atlas-plans",JSON.stringify(P.map(([n,items],i)=>({id:"p"+n,name:n,days:i?[1,4]:[0,3],items}))));
  localStorage.setItem("atlas-rank",JSON.stringify({bw:80,man:[]}));
  localStorage.setItem("atlas-intro","1");
};
