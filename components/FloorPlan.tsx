import React from 'react';
import { Seat as SeatType, Employee, Assignment, Seat } from '../types';
import SeatComponent from './Seat';
import { SEATS_ROOM_12, SEATS_ROOM_35 } from '../constants';
import { Layers, Coffee, DoorOpen, ArrowUpCircle, Archive } from 'lucide-react';

interface FloorPlanProps {
  assignments: Assignment[];
  employees: Employee[];
  selectedEmployeeId: string | null;
  onSeatClick: (seatId: string) => void;
  onDrop: (seatId: string, employeeId: string) => void;
}

const FloorPlan: React.FC<FloorPlanProps> = ({
  assignments,
  employees,
  selectedEmployeeId,
  onSeatClick,
  onDrop
}) => {
  const getEmployeeForSeat = (seatId: string) => {
    const assignment = assignments.find(a => a.seatId === seatId);
    if (!assignment) return undefined;
    return employees.find(e => e.id === assignment.employeeId);
  };

  const renderSeat = (seat: SeatType) => (
    <SeatComponent
      key={seat.id}
      seat={seat}
      assignedEmployee={getEmployeeForSeat(seat.id)}
      isSelected={false}
      onSelect={() => onSeatClick(seat.id)}
      onDrop={onDrop}
      isTargetCandidate={!!selectedEmployeeId && !getEmployeeForSeat(seat.id)}
    />
  );

  // Helper to render a separator line
  const renderSeparator = () => (
    <div className="h-full w-px border-r border-dashed border-gray-300 mx-3"></div>
  );

  // Helper to render a cluster of seats with minimal gap
  const renderCluster = (topSeats: SeatType[], bottomSeats: SeatType[]) => (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex gap-0.5 justify-center w-full">
        {topSeats.map(renderSeat)}
      </div>
      <div className="flex gap-0.5 justify-center w-full">
        {bottomSeats.map(renderSeat)}
      </div>
    </div>
  );

  // Helper for rendering doors (Red outlined rectangles as requested)
  const renderDoor = (className: string) => (
    <div className={`absolute bg-white border-2 border-red-500 z-20 flex items-center justify-center ${className}`}>
      <div className="w-full h-full bg-red-50 opacity-20"></div>
    </div>
  );

  return (
    <div className="relative w-full h-full bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-300 text-gray-700 select-none">
      {/* Grid Container for Layout with Corridor */}
      <div className="grid grid-cols-12 h-full">

        {/* === LEFT COLUMN (Workspaces) === Span 7 of 12 */}
        <div className="col-span-7 flex flex-col border-r-2 border-gray-400">

          {/* Top: Lớp học hiện trạng (Classroom) */}
          <div className="flex-[0.3] bg-hatch border-b-4 border-gray-800 relative p-4">
            <div className="absolute top-2 right-2 border-2 border-dashed border-gray-500 p-2 rounded transform rotate-12">
              <span className="text-2xl font-black text-gray-400 uppercase opacity-50 block">Lớp học</span>
              <span className="text-sm font-bold text-gray-400 block opacity-50">Hiện trạng</span>
            </div>
            {/* Columns */}
            <div className="w-10 h-10 bg-black absolute top-10 left-10"></div>
            <div className="w-10 h-10 bg-black absolute top-10 right-32"></div>
            <div className="w-10 h-10 bg-black absolute bottom-0 left-10"></div>
            <div className="w-10 h-10 bg-black absolute bottom-0 right-32"></div>
          </div>

          {/* Middle: Room 12 People */}
          <div className="flex-[0.25] border-b-4 border-gray-800 p-4 relative bg-gray-50 flex flex-col justify-between">
            <h3 className="absolute top-0 right-0 bg-gray-200 px-2 py-1 text-xs font-bold border-bl rounded-bl z-10">PHÒNG 12 NGƯỜI</h3>

            {/* DOOR: Bottom Right of this room */}
            {renderDoor("right-0 top-8 w-1.5 h-12 translate-x-[2px]")}

            {/* Row 1: Top Wall - 6 seats (Tight gap) */}
            <div className="flex justify-center gap-0.5 mt-2">
              {SEATS_ROOM_12.slice(0, 6).map(renderSeat)}
            </div>

            {/* Empty Center Space */}
            <div className="flex-1 flex items-center justify-center">
              <span className="text-gray-300 text-xs tracking-widest font-semibold opacity-50">KHÔNG GIAN CHUNG</span>
            </div>

            {/* Row 2: Bottom Wall - 6 seats (Tight gap) */}
            <div className="flex justify-center gap-0.5 mb-2">
              {SEATS_ROOM_12.slice(6, 12).map(renderSeat)}
            </div>

            {/* Columns */}
            <div className="w-6 h-6 bg-black absolute bottom-0 left-0"></div>
            <div className="w-6 h-6 bg-black absolute bottom-0 right-0"></div>
          </div>

          {/* Bottom: Room 35 People */}
          <div className="flex-[0.45] p-6 relative bg-white flex flex-col justify-between">
            <h3 className="absolute top-0 right-0 bg-gray-200 px-2 py-1 text-xs font-bold border-bl rounded-bl z-10">PHÒNG 35 NGƯỜI</h3>

            {/* DOOR: Top Right of this room */}
            {renderDoor("right-0 top-12 w-1.5 h-12 translate-x-[2px]")}

            {/* CABINETS: Bottom Right (3 stacked) */}
            <div className="absolute bottom-6 right-0 flex flex-col gap-0.5 z-10">
              <div className="w-8 h-10 bg-gray-200 border-2 border-red-400 flex flex-col justify-between p-1">
                <div className="w-full h-0.5 bg-gray-400"></div>
                <div className="w-full h-0.5 bg-gray-400"></div>
                <div className="w-full h-0.5 bg-gray-400"></div>
              </div>
              <div className="w-8 h-10 bg-gray-200 border-2 border-red-400 flex flex-col justify-between p-1">
                <div className="w-full h-0.5 bg-gray-400"></div>
                <div className="w-full h-0.5 bg-gray-400"></div>
                <div className="w-full h-0.5 bg-gray-400"></div>
              </div>
              <div className="w-8 h-10 bg-gray-200 border-2 border-red-400 flex flex-col justify-between p-1">
                <div className="w-full h-0.5 bg-gray-400"></div>
                <div className="w-full h-0.5 bg-gray-400"></div>
                <div className="w-full h-0.5 bg-gray-400"></div>
              </div>
              <span className="text-[8px] font-bold text-center text-red-500">TỦ</span>
            </div>

            {/* Block 1: 12 seats (Indices 0-11) */}
            <div className="flex items-center justify-center h-full mr-12"> {/* mr-12 to make space for cabinets visual if needed, but actually content centers */}
              {renderCluster(SEATS_ROOM_35.slice(0, 2), SEATS_ROOM_35.slice(6, 8))}
              {renderSeparator()}
              {renderCluster(SEATS_ROOM_35.slice(2, 4), SEATS_ROOM_35.slice(8, 10))}
              {renderSeparator()}
              {renderCluster(SEATS_ROOM_35.slice(4, 6), SEATS_ROOM_35.slice(10, 12))}
            </div>

            {/* Block 2: 11 seats */}
            <div className="flex items-center justify-center h-full border-t border-b border-gray-100 py-2 my-2 mr-12">
              {/* Left Cluster: 3 seats (Top: 12,13 | Bottom: 18) */}
              {renderCluster(SEATS_ROOM_35.slice(12, 14), SEATS_ROOM_35.slice(18, 19))}

              {renderSeparator()}

              {/* Middle Cluster: 4 seats (Top: 14,15 | Bottom: 19,20) */}
              {renderCluster(SEATS_ROOM_35.slice(14, 16), SEATS_ROOM_35.slice(19, 21))}

              {renderSeparator()}

              {/* Right Cluster: 4 seats (Top: 16,17 | Bottom: 21,22) */}
              {renderCluster(SEATS_ROOM_35.slice(16, 18), SEATS_ROOM_35.slice(21, 23))}
            </div>

            {/* Block 3: 12 seats (Indices 23-34) */}
            <div className="flex items-center justify-center h-full mr-12">
              {renderCluster(SEATS_ROOM_35.slice(23, 25), SEATS_ROOM_35.slice(29, 31))}
              {renderSeparator()}
              {renderCluster(SEATS_ROOM_35.slice(25, 27), SEATS_ROOM_35.slice(31, 33))}
              {renderSeparator()}
              {renderCluster(SEATS_ROOM_35.slice(27, 29), SEATS_ROOM_35.slice(33, 35))}
            </div>

            {/* Columns */}
            <div className="w-6 h-6 bg-black absolute top-0 left-0"></div>
            <div className="w-6 h-6 bg-black absolute top-0 right-0"></div>
            <div className="w-6 h-6 bg-black absolute bottom-0 left-0"></div>
            <div className="w-6 h-6 bg-black absolute bottom-0 right-0"></div>
          </div>

        </div>

        {/* === CORRIDOR (Hành lang) === Span 1 */}
        <div className="col-span-1 bg-gray-100 border-r-2 border-gray-400 flex flex-col items-center justify-center relative">
          <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-gray-300"></div>
          <span className="text-gray-400 font-bold uppercase rotate-90 tracking-[0.5rem] whitespace-nowrap text-xs select-none">Hành Lang</span>
        </div>

        {/* === RIGHT COLUMN (Utilities) === Span 4 */}
        <div className="col-span-4 flex flex-col bg-gray-100">

          {/* Top: Storage & Stairs */}
          <div className="h-64 border-b-2 border-gray-400 p-4 relative">
            <div className="border border-gray-400 h-full bg-white flex flex-col p-2">
              <div className="flex-1 border-b border-gray-300 mb-2 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-xs font-bold">KHO</div>
                </div>
              </div>
              <div className="flex-[2] border border-gray-300 relative bg-gray-100">
                {/* Stairs Graphic */}
                <div className="absolute inset-2 border border-gray-400">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-3 w-full border-b border-gray-300"></div>
                  ))}
                </div>
                <span className="absolute bottom-1 w-full text-center text-[10px] font-bold">THANG BỘ</span>
              </div>
              <div className="flex-1 mt-2 border border-gray-300 bg-white flex items-center justify-center">
                <div className="w-8 h-8 border border-gray-400 flex items-center justify-center">
                  <ArrowUpCircle size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Restrooms */}
          <div className="h-48 border-b-2 border-gray-400 p-2 flex gap-2">
            <div className="flex-1 bg-white border border-gray-300 flex items-center justify-center relative">
              <span className="text-xs font-bold rotate-90">WC NAM</span>
              <div className="absolute top-2 right-2 w-4 h-4 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex-1 bg-white border border-gray-300 flex items-center justify-center relative">
              <span className="text-xs font-bold rotate-90">WC NỮ</span>
              <div className="absolute top-2 right-2 w-4 h-4 bg-gray-200 rounded-full"></div>
            </div>
          </div>

          {/* Bottom: Meeting Room & Pantry */}
          <div className="flex-1 flex flex-col relative">

            {/* DOOR: Meeting Room/Pantry Entrance (Left side facing corridor) */}
            {renderDoor("left-0 top-32 w-1.5 h-12 -translate-x-[2px]")}

            {/* Pantry / Waiting Area */}
            <div className="flex-1 border-b border-gray-300 p-4 bg-white relative">
              <div className="absolute top-2 left-2 text-[10px] font-bold">PHÒNG THỰC HÀNH CTO</div>
              <div className="w-full h-full flex items-center justify-center">
                <DoorOpen size={32} className="text-gray-400" />
              </div>
            </div>

            {/* Meeting Room */}
            <div className="flex-[2] p-6 bg-white relative">
              <h3 className="absolute bottom-2 right-2 text-xs font-bold text-gray-500">PHÒNG HỌP</h3>

              {/* Oval Table */}
              <div className="w-3/4 mx-auto h-32 border-2 border-gray-600 rounded-[50px] bg-gray-50 flex items-center justify-center shadow-sm relative mt-4">
                <span className="text-xs font-bold text-gray-400">BÀN HỌP</span>
                {/* Chairs around table */}
                <div className="absolute -top-4 w-5 h-5 bg-white border border-gray-400 rounded-full left-10"></div>
                <div className="absolute -top-4 w-5 h-5 bg-white border border-gray-400 rounded-full left-24"></div>
                <div className="absolute -top-4 w-5 h-5 bg-white border border-gray-400 rounded-full left-36"></div>

                <div className="absolute -bottom-4 w-5 h-5 bg-white border border-gray-400 rounded-full left-10"></div>
                <div className="absolute -bottom-4 w-5 h-5 bg-white border border-gray-400 rounded-full left-24"></div>
                <div className="absolute -bottom-4 w-5 h-5 bg-white border border-gray-400 rounded-full left-36"></div>

                <div className="absolute top-10 -left-4 w-5 h-5 bg-white border border-gray-400 rounded-full"></div>
                <div className="absolute top-10 -right-4 w-5 h-5 bg-white border border-gray-400 rounded-full"></div>
              </div>
            </div>

            {/* Stairs Exit */}
            <div className="h-20 border-t border-gray-400 relative">
              <div className="absolute bottom-2 right-2 w-16 h-16 rounded-full border border-gray-400 flex items-center justify-center">
                <div className="w-full border-t border-gray-400 rotate-45"></div>
                <div className="w-full border-t border-gray-400 -rotate-45 absolute"></div>
              </div>
              <span className="absolute bottom-1 right-20 text-[10px]">THANG THOÁT HIỂM</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default FloorPlan;