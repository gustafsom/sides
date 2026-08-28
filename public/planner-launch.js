const params=new URLSearchParams(location.search),mode=params.get('mode');
if(mode){
  const click=()=>{
    if(mode==='session')document.querySelector('#startSession')?.click();
    else document.querySelector(`[data-view="${CSS.escape(mode)}"]`)?.click();
  };
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',()=>setTimeout(click,150),{once:true});else setTimeout(click,150);
}
