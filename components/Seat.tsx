import React from 'react';
import { Seat as SeatType, Employee } from '../types';
import { User, Plus } from 'lucide-react';

interface SeatProps {
  seat: SeatType;
  assignedEmployee?: Employee;
  isSelected?: boolean;
  onSelect: () => void;
  onDrop: (seatId: string, employeeId: string) => void;
  isTargetCandidate?: boolean;
  className?: string;
}

const Seat: React.FC<SeatProps> = ({ seat, assignedEmployee, isSelected, onSelect, onDrop, isTargetCandidate, className = "" }) => {
  return (
    <div
      onClick={onSelect}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const employeeId = e.dataTransfer.getData('employeeId');
        if (employeeId) {
          onDrop(seat.id, employeeId);
        }
      }}
      draggable={!!assignedEmployee}
      onDragStart={(e) => {
        if (assignedEmployee) {
          e.dataTransfer.setData('employeeId', assignedEmployee.id);
        }
      }}
      className={`
        relative flex flex-col items-center justify-center p-0.5 rounded-sm border-2 transition-all cursor-pointer w-12 h-12 shadow-sm
        ${assignedEmployee
          ? 'bg-blue-100 border-blue-500 cursor-grab active:cursor-grabbing'
          : isTargetCandidate
            ? 'bg-green-50 border-green-400 border-dashed animate-pulse'
            : 'bg-white border-gray-300 hover:border-gray-400'
        }
        ${isSelected ? 'ring-2 ring-offset-1 ring-blue-600 z-10' : ''}
        ${className}
      `}
      title={assignedEmployee ? `${assignedEmployee.name} - ${assignedEmployee.role}` : seat.label}
    >
      {assignedEmployee ? (
        <div className="w-full h-full flex items-center justify-center overflow-hidden px-0.5">
          {(() => {
            const displayText = assignedEmployee.name.split(' ').slice(-2).join(' ');
            const isLongName = ['MASUDA', 'IMAMACHI', 'KATSUMATA', 'HOSHIYAMA'].some(k => displayText.toUpperCase().includes(k)) || displayText.length > 12;

            return (
              <span className={`${isLongName ? 'text-[8px] leading-none' : 'text-[10px] leading-3'} font-bold text-center break-words whitespace-normal text-blue-900 select-none`}>
                {displayText}
              </span>
            );
          })()}
        </div>
      ) : (
        <div className="text-gray-300 flex items-center justify-center h-full w-full relative">
          <div className="text-[9px] font-bold text-gray-400 absolute top-0 left-0.5">{seat.label}</div>
          {isTargetCandidate ? <Plus size={16} className="text-green-500" /> : <div className="w-3 h-3 border rounded-sm border-gray-200" />}
        </div>
      )}
    </div>
  );
};

export default Seat;