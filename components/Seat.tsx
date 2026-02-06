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
            // Use the full name or last 2 words as before, but ensure we allow wrapping
            const displayText = assignedEmployee.name.toUpperCase();
            // Simple heuristic: if it's very long, allow wrap with hyphens
            const isLongName = displayText.length > 10;

            return (
              <span
                className={`
                  ${isLongName ? 'text-[9px] leading-[10px]' : 'text-[10px] leading-3'} 
                  font-bold text-center text-blue-900 select-none
                  break-words whitespace-normal hyphens-auto w-full
                `}
                style={{ overflowWrap: 'break-word', wordBreak: 'break-word', hyphens: 'auto', WebkitHyphens: 'auto' }}
              >
                {displayText}
              </span>
            );
          })()}
        </div>
        </div>
  ) : (
    <div className="text-gray-300 flex items-center justify-center h-full w-full relative">
      <div className="text-[9px] font-bold text-gray-400 absolute top-0 left-0.5">{seat.label}</div>
      {isTargetCandidate ? <Plus size={16} className="text-green-500" /> : <div className="w-3 h-3 border rounded-sm border-gray-200" />}
    </div>
  )
}
    </div >
  );
};

export default Seat;