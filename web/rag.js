// Hỏi đáp trên hồ sơ theo mô hình RAG: chia hồ sơ đã công bố thành đoạn có nhãn nguồn và mức tin cậy,
// truy xuất đoạn liên quan (BM25 + ý định câu hỏi), rồi trả lời kèm trích dẫn.
// Chỉ dùng dữ liệu đã công bố nên mục riêng tư không bao giờ vào ngữ cảnh. Không cần LLM hay khóa API;
// bước diễn giải bằng LLM (nếu có) chỉ nhận các đoạn đã truy xuất.
import {normalize} from './data.js';
import {entries} from './profile.js';

const STOP=new Set('toi la cua va ho so nguoi nay co gi hay cho biet ve can tim voi muon mot duoc khong the nao nhung trong da dang anh chi ban ay xin hoi bao nhieu nhu cac thi ma dieu gi'.split(' '));
export const words=t=>normalize(t).replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);
const terms=t=>words(t).filter(w=>w.length>1&&!STOP.has(w));

// Ý định câu hỏi → loại đoạn nên ưu tiên. Khóa 'role' gồm cả chức danh và doanh nghiệp.
const INTENTS={
 experience:['kinh nghiem','lam viec','cong tac','tung lam','qua trinh','su nghiep'],
 projects:['du an','project','san pham tieu bieu','thanh tich','thanh tuu'],
 skills:['nang luc','ky nang','chuyen mon','gioi ve','lam duoc'],
 goals:['nhu cau','tim kiem','dang tim','hop tac','mong muon','muc tieu'],
 role:['chuc danh','chuc vu','vi tri','vai tro','cong ty','doanh nghiep','to chuc','dang lam'],
 bio:['gioi thieu','la ai','tom tat'],
 contact:['lien he','email','dien thoai','lien lac']
};
const TRUST=['xac nhan','xac thuc','tin cay','uy tin','kiem chung','dang tin','that khong'];
const has=(nq,cue)=>nq.includes(' '+cue+' ');

export function chunks(d){
 const m=d._meta||{};
 const tier=k=>m.verified?.[k]?'ok':m.sources?'doc':'self';
 const out=[];
 const add=(key,label,text,anchor,over)=>{if(!text)return;const v=m.verified?.[key];out.push({id:out.length+1,key,label,text,anchor,tier:over??tier(key),by:v?.by,at:v?.at});};
 if(d.role||d.company){
  const vk=['role','company'].find(k=>m.verified?.[k]),v=m.verified?.[vk];
  out.push({id:1,key:'role',label:'Vị trí hiện tại',text:[d.role&&'Chức danh: '+d.role,d.company&&'Doanh nghiệp: '+d.company].filter(Boolean).join(' · '),anchor:null,tier:vk?'ok':tier('role'),by:v?.by,at:v?.at});
 }
 add('bio','Giới thiệu',d.bio,'s-bio');
 entries(d.experience).forEach((t,i)=>add('experience','Kinh nghiệm',t,'e-experience-'+i));
 entries(d.projects).forEach((t,i)=>add('projects','Dự án',t,'e-projects-'+i));
 add('skills','Năng lực',d.skills,'s-skills');
 add('goals','Nhu cầu hợp tác',d.goals,'s-goals','self');
 add('contact','Liên hệ',d.contact,'s-contact','self');
 return out.map((c,i)=>({...c,id:i+1}));
}

export function ask(d,question){
 const all=chunks(d),nq=' '+words(question).join(' ')+' ';
 const covered=[...new Set(all.map(c=>c.label))];
 if(TRUST.some(t=>has(nq,t)))return {kind:'trust',passages:all.filter(c=>c.tier==='ok'),sources:!!d._meta?.sources,covered};
 const intents=Object.entries(INTENTS).filter(([,cues])=>cues.some(c=>has(nq,c))).map(([k])=>k);
 const cueWords=new Set(intents.flatMap(k=>INTENTS[k].flatMap(words)));
 const qt=terms(question).filter(w=>!cueWords.has(w));
 const N=all.length,docs=all.map(c=>words(c.text));
 const idf=w=>{const df=docs.filter(x=>x.includes(w)).length;return Math.log(1+(N-df+.5)/(df+.5));};
 const scored=all.map((c,i)=>{
  const dw=docs[i];
  let lexical=qt.reduce((s,w)=>s+(dw.includes(w)?idf(w):0),0);
  for(let j=1;j<qt.length;j++)for(let p=1;p<dw.length;p++)if(dw[p-1]===qt[j-1]&&dw[p]===qt[j])lexical+=1.5;
  const boost=intents.includes(c.key)?2:0;
  return {...c,score:lexical+boost,lexical};
 });
 // Khi câu hỏi nêu chủ đề, ưu tiên đoạn thuộc chủ đề đó; chỉ mở rộng sang mục khác nếu chủ đề không có đoạn khớp từ khóa.
 const pool=scored.filter(c=>intents.includes(c.key)),lex=scored.filter(c=>c.lexical>0),poolLex=pool.filter(c=>c.lexical>0);
 let hits=poolLex.length?poolLex:qt.length&&lex.length?lex:pool;
 hits=hits.sort((a,b)=>b.score-a.score||a.id-b.id).slice(0,4);
 return hits.length?{kind:'answer',passages:hits,covered}:{kind:'none',passages:[],covered};
}
