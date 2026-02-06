import { Employee, Role, Seat } from './types';

const RAW_EMPLOYEES = [
  { name: "MASUDA TAKEHIKO", role: "COO" },
  { name: "NGUYỄN TRUNG HIẾU", role: "Vice Director" },
  { name: "IMAMACHI", role: "CSO" },
  { name: "VI TRẦN PHƯƠNG LINH", role: "GA Leader" },
  { name: "NGUYỄN HOÀNG YẾN NHI", role: "GA" },
  { name: "MẠC TUẤN ANH", role: "GA" },
  { name: "PHẠM HỮU HẢI", role: "Đối ngoại" },
  { name: "TRƯƠNG NHỈ KHANG", role: "Marketing" },
  { name: "NGUYỄN THUỲ DUNG", role: "Marketing leader" },
  { name: "LÊ QUỐC THÁI", role: "Marketing" },
  { name: "HOSHIYAMA", role: "Matching Leader" },
  { name: "LÊ THẾ NGÂN", role: "Matching" },
  { name: "BẢO TRÂM", role: "Baito Matching" },
  { name: "CẨM LAN", role: "Matching" },
  { name: "THANH THẢO", role: "Matching" },
  { name: "TRẦN PHÚC", role: "Matching" },
  { name: "THU HÀ", role: "Thực tập Matching" },
  { name: "VĂN HOÀNG THỜI", role: "Matching" },
  { name: "NGUYỄN THỊ TUYẾT LINH", role: "Matching" },
  { name: "TRỊNH LÊ MỸ DUYÊN", role: "MS" },
  { name: "DƯƠNG ANH THƯ", role: "MS Leader" },
  { name: "QUỲNH NHƯ", role: "MS" },
  { name: "ĐẶNG THỊ LAN", role: "MS" },
  { name: "MỸ HOA", role: "MS" },
  { name: "KATSUMATA", role: "OS" },
  { name: "TRẦN ĐÌNH LĨNH", role: "OS" },
  { name: "NGUYỄN VĂN CHUYỀN", role: "OS" },
  { name: "TRẦN QUỐC LỘC", role: "OS" },
  { name: "TRẦN THỊ HUYỀN", role: "OS" },
  { name: "LÊ VĂN LỘC", role: "OS" },
  { name: "NGUYỄN THÀNH NGUYÊN", role: "OS" },
  { name: "TRẦN THANH KIM", role: "OS" },
  { name: "TRẦN BẢO", role: "OS" },
  { name: "TRẦN HOÀNG HOÀI NAM", role: "Matching" },
  { name: "NGUYỄN THỊ NGUYỆT QUỲNH", role: "Matching" },
  { name: "BÙI THANH YÊN", role: "Matching" },
  { name: "TAISEI 1", role: "Taisei" },
  { name: "TAISEI 2", role: "Taisei" },
  { name: "TAISEI 3", role: "Taisei" },
  { name: "TAISEI 4", role: "Taisei" }
];

export const MOCK_EMPLOYEES: Employee[] = RAW_EMPLOYEES.map((e, i) => ({
  id: `emp-${i + 1}`,
  name: e.name,
  role: e.role,
  avatar: `https://picsum.photos/seed/${i + 100}/100/100`
}));

// Generate Seats for Room 12 (Layout 3x4 roughly or 2x6)
// We will simply list them, the visual component handles grid placement
export const SEATS_ROOM_12: Seat[] = Array.from({ length: 12 }, (_, i) => ({
  id: `r12-s${i + 1}`,
  roomId: 'room-12',
  label: `A${i + 1}`
}));

// Generate Seats for Room 35 (Layout 5x7)
export const SEATS_ROOM_35: Seat[] = Array.from({ length: 35 }, (_, i) => ({
  id: `r35-s${i + 1}`,
  roomId: 'room-35',
  label: `B${i + 1}`
}));

export const ALL_SEATS = [...SEATS_ROOM_12, ...SEATS_ROOM_35];