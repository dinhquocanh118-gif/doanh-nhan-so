// Bộ hồ sơ demo. Toàn bộ nhân vật, doanh nghiệp, số liệu và email đều là dữ liệu giả định.
// Các hồ sơ có cặp "năng lực ↔ nhu cầu" bổ trợ nhau để phần ghép đối tác dễ trình diễn:
// gỗ thu hồi (Hưng) → thiết kế (Minh Anh) → bán lẻ (Thu Hà) → giao hàng (Long) → nông sản (Mai) → vốn (Lan).
const labels={name:'Họ và tên',role:'Chức danh',company:'Doanh nghiệp',bio:'Giới thiệu',skills:'Năng lực',experience:'Kinh nghiệm',projects:'Dự án',goals:'Nhu cầu hợp tác',contact:'Liên hệ'};
const sourceText=d=>Object.entries(labels).filter(([k])=>d[k]).map(([k,l])=>l+': '+d[k]).join('\n');
const make=(n,draft,verified=[])=>({
 id:`b1000000-0000-4000-8000-00000000000${n}`,
 share:`a1000000-0000-4000-8000-00000000000${n}`,
 draft,
 verified,
 sources:[{label:'Tiểu sử giới thiệu (mẫu).txt',kind:'TXT',text:sourceText(draft)}]
});

export const SEED=[
 make(1,{name:'Trần Minh Anh',role:'Nhà sáng lập',company:'Mộc Studio',
  bio:'Tôi phát triển các sản phẩm nội thất từ vật liệu tái sử dụng. Tại Mộc Studio, tôi phụ trách thiết kế sản phẩm và xây dựng mạng lưới đối tác sản xuất.',
  skills:'Thiết kế sản phẩm, Phát triển đối tác, Vật liệu bền vững',
  experience:'2021 - nay | Nhà sáng lập, Mộc Studio\n2017 - 2021 | Phụ trách phát triển sản phẩm tại xưởng thiết kế nội thất',
  projects:'Dòng nội thất Gỗ Mới | Phát triển bộ bàn ghế mô-đun từ gỗ thu hồi.\nXưởng Mở | Tổ chức chương trình trải nghiệm thiết kế cho sinh viên.',
  goals:'Kết nối với đối tác phân phối nội thất và các xưởng cung cấp gỗ thu hồi tại Việt Nam.',
  contact:'minhanh@example.com'},['role','company','experience']),
 make(2,{name:'Lê Quốc Hưng',role:'Giám đốc',company:'Xưởng Gỗ Tân Phát',
  bio:'Tôi điều hành xưởng thu mua, xử lý và cung cấp gỗ thu hồi từ công trình cũ cho các đơn vị nội thất tại miền Nam. Xưởng có dây chuyền sấy và quy trình phân loại gỗ riêng.',
  skills:'Cung ứng gỗ thu hồi, Xử lý và sấy gỗ, Quản lý xưởng sản xuất',
  experience:'2019 - nay | Giám đốc, Xưởng Gỗ Tân Phát (Bình Dương)\n2012 - 2019 | Quản đốc xưởng, Công ty Chế biến Gỗ Đông Nam',
  projects:'Chuỗi cung ứng gỗ thu hồi | Cung cấp khoảng 300 m3 gỗ thu hồi mỗi năm cho 12 xưởng nội thất.\nDây chuyền sấy mới | Đầu tư dây chuyền sấy giúp giảm một nửa thời gian xử lý gỗ.',
  goals:'Tìm nhà thiết kế và thương hiệu nội thất cần nguồn gỗ thu hồi ổn định, ưu tiên hợp đồng cung ứng dài hạn.',
  contact:'hung@example.com'},['role','company','experience','projects']),
 make(3,{name:'Nguyễn Thu Hà',role:'Giám đốc Kinh doanh',company:'Nhà Việt Retail',
  bio:'Tôi phụ trách kinh doanh cho chuỗi 9 showroom nội thất tại TP.HCM, Đà Nẵng và Hà Nội. Tôi chọn nhà cung cấp và xây dựng khu trưng bày cho các thương hiệu thiết kế trong nước.',
  skills:'Phân phối bán lẻ nội thất, Phát triển nhà cung cấp, Quản lý showroom',
  experience:'2020 - nay | Giám đốc Kinh doanh, Nhà Việt Retail\n2014 - 2020 | Quản lý ngành hàng nội thất, Hệ thống bán lẻ Gia Định',
  projects:'Góc Sống Xanh | Mở khu trưng bày sản phẩm thân thiện môi trường tại 4 showroom.\nChương trình nhà thiết kế trẻ | Đưa sản phẩm của 8 nhà thiết kế độc lập vào hệ thống phân phối.',
  goals:'Tìm thương hiệu nội thất thiết kế bền vững có thể sản xuất ổn định để đưa vào showroom, và đơn vị giao hàng nội thất cồng kềnh.',
  contact:'thuha@example.com'},['role','company']),
 make(4,{name:'Phạm Đức Long',role:'Nhà sáng lập',company:'GreenMile Logistics',
  bio:'Tôi xây dựng dịch vụ giao hàng chặng cuối cho hàng cồng kềnh và hàng lạnh bằng đội xe điện tại TP.HCM. Tôi tập trung vào tối ưu tuyến giao hàng và giảm chi phí vận hành.',
  skills:'Logistics chặng cuối, Vận hành đội xe điện, Tối ưu tuyến giao hàng',
  experience:'2022 - nay | Nhà sáng lập, GreenMile Logistics\n2016 - 2022 | Quản lý vận hành, Công ty Giao nhận Sài Gòn Express',
  projects:'Đội xe điện giao hàng cồng kềnh | Vận hành 40 xe điện giao nội thất và thiết bị gia dụng tại TP.HCM.\nTuyến giao nông sản lạnh | Thử nghiệm giao nông sản trong 6 giờ từ Lâm Đồng.',
  goals:'Tìm khách hàng là thương hiệu nội thất, bán lẻ và nông sản cần giao hàng chặng cuối, và đối tác kho tại Bình Dương.',
  contact:'long@example.com'},['company']),
 make(5,{name:'Đặng Thị Mai',role:'Giám đốc',company:'Nông sản Cao Nguyên',
  bio:'Tôi điều hành hợp tác xã nông sản sạch tại Lâm Đồng với hơn 60 hộ thành viên. Chúng tôi có khu sơ chế và kho lạnh, cung cấp rau củ và trái cây theo đơn hàng.',
  skills:'Canh tác nông sản sạch, Sơ chế và chuỗi lạnh, Quản lý hợp tác xã',
  experience:'2018 - nay | Giám đốc, Hợp tác xã Nông sản Cao Nguyên\n2013 - 2018 | Kỹ sư nông nghiệp, Trung tâm Khuyến nông Lâm Đồng',
  projects:'Khu sơ chế và kho lạnh | Xây dựng kho lạnh 120 m2 phục vụ đơn hàng siêu thị.\nChương trình truy xuất nguồn gốc | Gắn mã QR cho 15 sản phẩm theo từng lô canh tác.',
  goals:'Tìm đối tác phân phối cho siêu thị và cửa hàng thực phẩm sạch, và đơn vị giao hàng lạnh trong ngày.',
  contact:'mai@example.com'},['role','company','experience','skills']),
 make(6,{name:'Võ Ngọc Lan',role:'Quản lý đầu tư',company:'Quỹ Đầu tư Phương Nam Xanh',
  bio:'Tôi quản lý danh mục đầu tư giai đoạn hạt giống của quỹ, tập trung vào doanh nghiệp tạo tác động môi trường và xã hội. Tôi hỗ trợ doanh nghiệp chuẩn bị hồ sơ gọi vốn.',
  skills:'Thẩm định đầu tư, Tài chính doanh nghiệp, Phát triển danh mục',
  experience:'2021 - nay | Quản lý đầu tư, Quỹ Đầu tư Phương Nam Xanh\n2015 - 2021 | Chuyên viên tài chính doanh nghiệp, Công ty Tư vấn Tài chính Bến Thành',
  projects:'Danh mục tác động xanh | Đầu tư vào 7 doanh nghiệp nhỏ về nông nghiệp, nội thất bền vững và logistics xanh.\nChương trình chuẩn bị gọi vốn | Hướng dẫn 20 doanh nghiệp xây dựng hồ sơ năng lực cho vòng hạt giống.',
  goals:'Tìm doanh nghiệp bền vững giai đoạn hạt giống trong nội thất, nông nghiệp và logistics xanh.',
  contact:'ngoclan@example.com'},[])
];

// Tổ chức mẫu (giả định) và mã quản trị demo. Mã này công khai trên màn hình đăng nhập để dễ trình diễn.
export const ORG={id:'org-phuong-nam',name:'Hiệp hội Doanh nghiệp Sáng tạo Phương Nam (mẫu)',short:'Hiệp hội Phương Nam',code:'PHUONGNAM-DEMO'};
export const VERIFIABLE=['role','company','experience','projects','skills'];

// Bản công bố mặc định của hồ sơ mẫu: mọi trường trong hồ sơ.
export const published=row=>({...row.draft});
export const seedById=id=>SEED.find(x=>x.id===id);
export const seedByShare=share=>SEED.find(x=>x.share===share);

// Văn bản giả định dùng cho bước "nhập tài liệu" khi demo (nút "Dùng văn bản mẫu").
export const SAMPLE_TEXT=`Trương Quốc Bảo
Chức danh: Nhà sáng lập
Doanh nghiệp: Cà Phê Cao Nguyên Xanh

Giới thiệu
Tôi sáng lập thương hiệu cà phê đặc sản canh tác bền vững tại Lâm Đồng, làm việc trực tiếp với 40 hộ nông dân và xây dựng quy trình rang xay riêng.

Kinh nghiệm
2020 - nay | Nhà sáng lập, Cà Phê Cao Nguyên Xanh
2014 - 2020 | Quản lý vùng nguyên liệu, Công ty Xuất khẩu Nông sản Tây Nguyên

Dự án
Vùng cà phê hữu cơ 25 ha | Chuyển đổi 25 ha canh tác sang quy trình hữu cơ.
Xưởng rang xay mới | Xây dựng xưởng rang xay công suất 2 tấn mỗi tháng.

Năng lực
Canh tác bền vững, Rang xay cà phê đặc sản, Quản lý vùng nguyên liệu

Nhu cầu hợp tác
Tìm đối tác phân phối cho chuỗi cửa hàng và siêu thị, và đơn vị giao hàng lạnh trong ngày.

Liên hệ
bao@example.com
`;
