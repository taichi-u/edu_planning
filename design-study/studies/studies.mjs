const specs=await (await fetch('manifest.json')).json();
const data={
 dads:{head:Array(6).fill('ラベル'),rows:Array.from({length:3},()=>Array(6).fill('データ'))},
 smart:{head:['オブジェクト名','オブジェクトの情報1','オブジェクトの情報2'],rows:[['オブジェクト1','情報1','2024-11-26']]},
 primer:{head:['Repository','Type','Updated'],rows:[['codeql-dca-worker','Internal','Now'],['aegir','Public','5 minutes ago'],['strapi','Public','1 hour ago']]}
};
const state=document.querySelector('#state');
function render(){for(const study of specs.studies){const id=study.id,table=document.querySelector('#'+id),sample=data[id];table.replaceChildren();const head=table.createTHead(),tr=head.insertRow();for(const name of sample.head){const th=document.createElement('th');th.scope='col';th.textContent=name;tr.append(th);}const body=table.createTBody();if(state.value==='normal')for(const row of sample.rows){const tr=body.insertRow();for(const text of row)tr.insertCell().textContent=text;}
 else {const cell=body.insertRow().insertCell();cell.colSpan=sample.head.length;cell.textContent=state.value==='empty'?'データはありません':'取得できませんでした。前回の結果もありません。';}
 const measure=document.querySelector('#measure-'+id);measure.replaceChildren();if(state.value!=='normal')continue;const c=table.querySelector('tbody td:nth-child(2)'),style=getComputedStyle(c),actual={fontSize:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight),paddingBlock:parseFloat(style.paddingTop),paddingInline:parseFloat(style.paddingLeft),borderWidth:parseFloat(style.borderBottomWidth)||parseFloat(getComputedStyle(c.parentElement).borderTopWidth)||parseFloat(getComputedStyle(c.parentElement).borderBottomWidth)};
 const m=document.createElement('table');m.className='measure';m.innerHTML='<thead><tr><th>項目</th><th>ソースの指定値</th><th>再現の計算値</th><th>差</th></tr></thead>';const b=m.createTBody();for(const [key,expected]of Object.entries(study.expected)){const r=b.insertRow();for(const value of [key,expected+' px',actual[key].toFixed(2)+' px',(actual[key]-expected).toFixed(2)+' px'])r.insertCell().textContent=value;}measure.append(m);
 }}state.addEventListener('change',render);render();
