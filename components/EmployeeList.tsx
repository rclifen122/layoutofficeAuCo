import React from 'react';
import { Employee, Role } from '../types';
import { Search, UserCircle, Briefcase } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  onAutoAssign: () => void;
  isGenerating: boolean;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  onAutoAssign,
  isGenerating
}) => {
  const [filter, setFilter] = React.useState('');

  const filtered = employees.filter(e => {
    return e.name.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-xl z-20 w-80 flex-shrink-0">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Danh sách nhân sự</h2>
        <div className="text-sm text-gray-500 mb-4">
          Chưa xếp chỗ: <span className="font-semibold text-orange-600">{filtered.length}</span>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm theo tên..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <button
          onClick={onAutoAssign}
          disabled={isGenerating || employees.length === 0}
          className={`mt-4 w-full py-2 px-4 rounded-md text-sm font-medium text-white transition-colors flex items-center justify-center gap-2
            ${isGenerating || employees.length === 0 ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}
          `}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI đang sắp xếp...
            </>
          ) : (
            <>
              <Briefcase className="w-4 h-4" />
              AI Sắp xếp tự động
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.map(emp => (
          <div
            key={emp.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('employeeId', emp.id);
              const target = e.currentTarget as HTMLElement;
              const avatarEl = target.firstElementChild as HTMLElement;
              if (avatarEl) {
                e.dataTransfer.setDragImage(avatarEl, 20, 20);
              }
            }}
            onClick={() => onSelectEmployee(emp.id)}
            className={`
              flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-sm
              ${selectedEmployeeId === emp.id
                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                : 'bg-white border-gray-200 hover:border-blue-300'}
            `}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
              <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{emp.name}</p>
              <p className="text-xs text-gray-500 truncate">{emp.role}</p>
            </div>
            {selectedEmployeeId === emp.id && (
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Không tìm thấy nhân viên nào
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;