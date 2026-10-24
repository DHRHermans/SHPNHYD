const KEY='sh-technieklab-work-v1';
export class AutoSave {
  constructor(storage,getSnapshot,status=()=>{}){Object.assign(this,{storage,getSnapshot,status});this.timer=null;}
  read(){try{const value=JSON.parse(this.storage.getItem(KEY)||'null');return value?.version===1&&value.current?.circuit?value:null;}catch{return null;}}
  schedule(){clearTimeout(this.timer);this.status('Bewaren…');this.timer=setTimeout(()=>this.flush(),350);}
  flush(){
    clearTimeout(this.timer);try{
      const snapshot=this.getSnapshot();if(!snapshot?.circuit)return false;
      const old=this.read(),serialized=JSON.stringify(snapshot.circuit),changed=old&&JSON.stringify(old.current.circuit)!==serialized;
      const backups=changed?[old.current,...(old.backups||[])].slice(0,4):old?.backups||[];
      this.storage.setItem(KEY,JSON.stringify({version:1,current:{...snapshot,savedAt:new Date().toISOString()},backups}));this.status('Lokaal bewaard');return true;
    }catch{this.status('Bewaren mislukt — exporteer JSON');return false;}
  }
}
