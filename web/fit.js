// Đánh giá mức phù hợp và gợi ý điểm kết nối giữa người xem và chủ hồ sơ.
// Hai chiều: (1) nhu cầu của người xem ↔ năng lực trong hồ sơ, (2) điều người xem có thể đóng góp ↔ nhu cầu chủ hồ sơ đang tìm.
// Mọi kết luận đều dựa trên đoạn cụ thể của hồ sơ đã công bố và có thể mở nguồn để kiểm tra.
import {chunks,words} from './rag.js';

// Lưu ý: bỏ dấu làm một số cụm trùng nhau ("tư vấn tài chính" chứa "van tai"), nên tránh cụm ngắn dễ va chạm.
// Nhóm khái niệm: người dùng và hồ sơ có thể diễn đạt khác nhau nhưng cùng một ý. Từ khóa đã bỏ dấu, viết thường.
const CONCEPTS=[
 {id:'go',label:'Gỗ thu hồi',t:['go thu hoi','go tai che','go cu','vat lieu thu hoi','vat lieu tai su dung','vat lieu tai che']},
 {id:'noithat',label:'Nội thất',t:['noi that','furniture','ban ghe']},
 {id:'thietke',label:'Thiết kế sản phẩm',t:['thiet ke','design','nha thiet ke']},
 {id:'sanxuat',label:'Sản xuất / xưởng',t:['san xuat','xuong','che bien','gia cong','nha may']},
 {id:'cungung',label:'Cung ứng nguyên liệu',t:['cung ung','nguon cung','nha cung cap','thu mua','nguyen lieu']},
 {id:'phanphoi',label:'Phân phối / bán lẻ',t:['phan phoi','ban le','dai ly','cua hang','sieu thi','retail','distribution','showroom','kenh ban']},
 {id:'giaohang',label:'Giao hàng / vận chuyển',t:['giao hang','van chuyen','chang cuoi','xe tai','xe dien','giao nhan']},
 {id:'logistics',label:'Logistics',t:['logistics','kho bai','chuoi cung ung']},
 {id:'lanh',label:'Chuỗi lạnh',t:['kho lanh','chuoi lanh','giao hang lanh','hang lanh','bao quan lanh','so che']},
 {id:'nongsan',label:'Nông sản',t:['nong san','ca phe','rau cu','trai cay','thuc pham sach','canh tac','hop tac xa','nong nghiep','nong dan']},
 {id:'von',label:'Vốn / đầu tư',t:['goi von','dau tu','nha dau tu','quy dau tu','vong hat giong','hat giong','huy dong von','von dau tu']},
 {id:'xanh',label:'Bền vững / xanh',t:['ben vung','xanh','moi truong','tai su dung']},
 {id:'truyxuat',label:'Truy xuất nguồn gốc',t:['truy xuat','nguon goc']},
 {id:'nhansu',label:'Nhân sự / tuyển dụng',t:['tuyen dung','talent acquisition','recruitment','recruiting','nhan su','human resources']},
 {id:'congnghe',label:'Công nghệ / AI',t:['tri tue nhan tao','artificial intelligence','phan mem','cong nghe','chuyen doi so']},
 {id:'taichinh',label:'Tài chính / kế toán',t:['tai chinh','ke toan','kiem toan']}
];
const conceptsIn=text=>{const t=' '+words(text).join(' ')+' ';return CONCEPTS.filter(c=>c.t.some(x=>t.includes(' '+x+' ')));};

// Vai trò có sẵn để người xem chọn nhanh; có thể sửa lại nội dung trước khi tìm.
export const ROLE_PRESETS=[
 {label:'Nhà thiết kế nội thất',need:'nguồn gỗ thu hồi và xưởng sản xuất',offer:'thiết kế sản phẩm nội thất bền vững'},
 {label:'Đơn vị bán lẻ, phân phối',need:'sản phẩm nội thất thiết kế bền vững để phân phối',offer:'hệ thống showroom và kênh bán lẻ'},
 {label:'Đơn vị giao hàng',need:'khách hàng cần giao hàng chặng cuối',offer:'đội xe điện giao hàng cồng kềnh'},
 {label:'Nhà đầu tư',need:'doanh nghiệp tạo tác động xanh',offer:'vốn đầu tư giai đoạn hạt giống'},
 {label:'Nhà cung cấp nông sản',need:'đối tác phân phối siêu thị và giao hàng lạnh',offer:'nông sản sạch có truy xuất nguồn gốc'}
];

const GENERIC=new Set('cho can tim nhu cau doi tac hop khach nguoi cong ty doanh nghiep'.split(' '));
const WEIGHT={skills:1,projects:1,experience:.85,bio:.6,role:.5};
const weight=c=>Math.min(1,(WEIGHT[c.key]||0)+(c.tier==='ok'?.1:0));
const TONES=[[75,'Rất phù hợp','hi'],[50,'Phù hợp','mid'],[1,'Có điểm chung','low'],[0,'Chưa thấy điểm chung','none']];

export function fit(d,{need='',offer=''}={}){
 need=need.trim();offer=offer.trim();
 if(!need&&!offer)return {empty:true};
 const all=chunks(d),cap=all.filter(c=>WEIGHT[c.key]),goals=all.filter(c=>c.key==='goals');
 const pairs=[],gaps=[];
 // Chiều 1: nhu cầu của người xem ↔ năng lực của chủ hồ sơ.
 let cov1=0;
 if(need){
  const wanted=conceptsIn(need);
  if(wanted.length){
   const per=wanted.map(c=>{
    const best=cap.filter(x=>conceptsIn(x.text).some(y=>y.id===c.id)).sort((a,b)=>weight(b)-weight(a))[0];
    if(best)pairs.push({type:'need',label:c.label,chunk:best});else gaps.push(c.label);
    return best?weight(best):0;
   });
   cov1=per.reduce((a,b)=>a+b,0)/wanted.length;
  }else{ // Không nhận ra khái niệm nào: quay về so khớp từ khóa, và chấm thận trọng hơn.
   const nw=[...new Set(words(need))].filter(w=>w.length>=3&&!GENERIC.has(w));
   const hits=cap.map(c=>({c,n:nw.filter(w=>words(c.text).includes(w)).length})).filter(x=>x.n>=2).sort((x,y)=>y.n-x.n).slice(0,2).map(x=>x.c);
   hits.forEach(c=>pairs.push({type:'need',label:'Nội dung liên quan',chunk:c}));
   cov1=hits.length?Math.min(.5,.25*hits.length):0;
   if(!hits.length)gaps.push('nhu cầu bạn nêu');
  }
 }
 // Chiều 2: điều người xem có thể đóng góp ↔ nhu cầu chủ hồ sơ đang tìm.
 let cov2=0;
 if(offer){
  const mine=conceptsIn(offer),theirs=new Map();
  goals.forEach(g=>conceptsIn(g.text).forEach(c=>theirs.set(c.id,{c,g})));
  const shared=mine.filter(c=>theirs.has(c.id));
  shared.forEach(c=>pairs.push({type:'offer',label:c.label,chunk:theirs.get(c.id).g}));
  cov2=Math.min(1,shared.length/Math.max(1,Math.min(theirs.size,3)));
 }
 const raw=need&&offer?.65*cov1+.35*cov2:need?cov1:cov2;
 const score=raw>0?Math.max(1,Math.min(96,Math.round(raw*100))):0;
 const [,level,tone]=TONES.find(([min])=>score>=min);
 const used=[...new Set(pairs.filter(p=>p.type==='need').map(p=>p.chunk.id))];
 const evidence={total:used.length,verified:used.filter(id=>all.find(c=>c.id===id)?.tier==='ok').length};

 // Gộp các khái niệm cùng dựa trên một đoạn để người xem không đọc lại cùng một căn cứ nhiều lần.
 const merge=type=>[...pairs.filter(p=>p.type===type).reduce((m,p)=>m.has(p.chunk.id)?(m.get(p.chunk.id).label+=', '+p.label,m):m.set(p.chunk.id,{...p}),new Map()).values()];
 const needPairs=merge('need'),offerPairs=merge('offer'),scenarios=[];
 if(needPairs.length&&offerPairs.length)scenarios.push(`Hợp tác hai chiều: bạn cần “${needPairs[0].label}” và ${d.name} đang tìm “${offerPairs[0].label}”. Đề xuất một buổi khám phá 30 phút để thống nhất phạm vi và đầu mối.`);
 needPairs.slice(0,2).forEach(p=>scenarios.push(`Bắt đầu bằng một thử nghiệm nhỏ về “${p.label}”, dựa trên ${p.chunk.label.toLowerCase()} mà ${d.name} đã nêu, trước khi cam kết dài hạn.`));
 if(!needPairs.length&&offerPairs.length)scenarios.push(`Giới thiệu điều bạn có thể đóng góp về “${offerPairs[0].label}”, vì ${d.name} đang tìm hướng này.`);
 if(gaps.length&&scenarios.length<3)scenarios.push(`Trước khi cam kết, hỏi thêm về “${gaps[0]}” vì hồ sơ chưa có căn cứ.`);
 return {score,level,tone,pairs:[...needPairs,...offerPairs],gaps,scenarios:scenarios.slice(0,3),evidence,empty:false};
}
