// Figma Plugin API script; data is supplied by the runner.
const data=__SCENES__,scenes=data.scenes;
const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);page.name='Comparisons';
const createdNodeIds=[],createdVariableIds=[],createdStyleIds=[];
const priorCollections=await figma.variables.getLocalVariableCollectionsAsync();
if(priorCollections.some(c=>c.name==='Study primitives'))throw new Error('Foundations already exist; inspect the ledger before creating again');
const raw=figma.variables.createVariableCollection('Study primitives'),sem=figma.variables.createVariableCollection('Study semantics');raw.renameMode(raw.modes[0].modeId,'Default');sem.renameMode(sem.modes[0].modeId,'Default');
const rgba=hex=>({r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255,a:1});
const colors=new Set(data.colors),spaces=new Set(data.spaces),fonts=new Map();
for(const family of data.fonts)for(const style of ['Regular','Medium'])fonts.set(family+'|'+style,{family,style});
await Promise.all([...fonts.values()].map(f=>figma.loadFontAsync(f)));
const colorIds={},spaceIds={},radiusIds={};
for(const hex of colors){const p=figma.variables.createVariable('color/'+hex.slice(1),raw,'COLOR');p.scopes=[];p.setValueForMode(raw.modes[0].modeId,rgba(hex));p.setVariableCodeSyntax('WEB','var(--study-raw-'+hex.slice(1).toLowerCase()+')');const v=figma.variables.createVariable('color/'+hex.slice(1),sem,'COLOR');v.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setValueForMode(sem.modes[0].modeId,{type:'VARIABLE_ALIAS',id:p.id});v.setVariableCodeSyntax('WEB','var(--study-color-'+hex.slice(1).toLowerCase()+')');createdVariableIds.push(p.id,v.id);colorIds[hex]=v.id;}
for(const n of spaces){const v=figma.variables.createVariable('space/'+n,sem,'FLOAT');v.scopes=['GAP'];v.setValueForMode(sem.modes[0].modeId,n);v.setVariableCodeSyntax('WEB','var(--study-space-'+n+')');createdVariableIds.push(v.id);spaceIds[n]=v.id;}
for(const n of [0,3,4]){const v=figma.variables.createVariable('radius/'+n,sem,'FLOAT');v.scopes=['CORNER_RADIUS'];v.setValueForMode(sem.modes[0].modeId,n);v.setVariableCodeSyntax('WEB','var(--study-radius-'+n+')');createdVariableIds.push(v.id);radiusIds[n]=v.id;}
const wrappers=[];
for(const s of scenes){const name=s.name;if(page.children.some(c=>c.name===name))throw new Error('Existing wrapper '+name);const frame=figma.createAutoLayout('VERTICAL');frame.name=name;frame.resize(1280,1000);frame.layoutSizingHorizontal='FIXED';frame.primaryAxisSizingMode='AUTO';frame.counterAxisSizingMode='FIXED';frame.itemSpacing=0;frame.clipsContent=false;frame.placeholder=true;const ci=['a','b','c'].indexOf(s.themeId),ri=['week','quarter','all'].indexOf(s.view)*2+(s.lang==='en'?1:0);frame.x=160+ci*1440;frame.y=240+ri*1450;page.appendChild(frame);const cv=await figma.variables.getVariableByIdAsync(colorIds[s.bg.toUpperCase()]);frame.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:rgba(s.bg).r,g:rgba(s.bg).g,b:rgba(s.bg).b}},'color',cv)];createdNodeIds.push(frame.id);wrappers.push({id:frame.id,name:s.name,themeId:s.themeId,lang:s.lang,view:s.view});}
const library=figma.createAutoLayout('VERTICAL');library.name='Study components';library.resize(1280,100);library.primaryAxisSizingMode='AUTO';library.counterAxisSizingMode='FIXED';library.paddingTop=24;library.paddingBottom=24;library.paddingLeft=24;library.paddingRight=24;library.itemSpacing=24;library.x=4480;library.y=240;library.fills=[];createdNodeIds.push(library.id);
return {createdNodeIds,createdVariableIds,createdStyleIds,collections:{raw:raw.id,semantic:sem.id},colorIds,spaceIds,radiusIds,wrappers,libraryId:library.id,fontFamilies:[...new Set([...fonts.values()].map(f=>f.family))]};
