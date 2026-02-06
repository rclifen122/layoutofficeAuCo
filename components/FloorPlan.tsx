import React from 'react';
import { Seat as SeatType, Employee, Assignment, Seat } from '../types';
import SeatComponent from './Seat';
import { SEATS_ROOM_12, SEATS_ROOM_35 } from '../constants';
import { Layers, Coffee, DoorOpen, ArrowUpCircle, Archive, Armchair } from 'lucide-react';

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

  const renderSeat = (seat: SeatType, className: string = "") => (
    <SeatComponent
      key={seat.id}
      seat={seat}
      assignedEmployee={getEmployeeForSeat(seat.id)}
      isSelected={false}
      onSelect={() => onSeatClick(seat.id)}
      onDrop={onDrop}
      isTargetCandidate={!!selectedEmployeeId && !getEmployeeForSeat(seat.id)}
      className={className}
    />
  );

  // Helper to render a separator line
  const renderSeparator = () => (
    <div className="h-full w-8 flex items-center justify-center"></div>
  );

  // Helper to render a cluster of seats with minimal gap (Old style for Room 12)
  const renderCluster = (topSeats: SeatType[], bottomSeats: SeatType[]) => (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex gap-0.5 justify-center w-full">
        {topSeats.map(s => renderSeat(s))}
      </div>
      <div className="flex gap-0.5 justify-center w-full">
        {bottomSeats.map(s => renderSeat(s))}
      </div>
    </div>
  );

  // Helper to render a TABLE cluster (New style for Room 35)
  // Connected seats, thick border, chair icons outside
  const renderTableCluster = (topSeats: SeatType[], bottomSeats: SeatType[], bottomAlignRight: boolean = false) => (
    <div className="flex flex-col items-center gap-1">
      {/* Top Chairs */}
      <div className="flex justify-center w-full gap-0">
        {topSeats.map(s => (
          <div key={`chair-top-${s.id}`} className="w-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center bg-gray-50 text-gray-400 mb-1">
              <Armchair size={14} className="rotate-180" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Block */}
      <div className="flex flex-col border-4 border-gray-300 bg-white">
        <div className="flex w-full">
          {topSeats.map(s => renderSeat(s, "rounded-none border-gray-300 border-r-0 last:border-r hover:z-10"))}
        </div>
        <div className={`flex w-full ${bottomAlignRight ? 'justify-end' : ''}`}>
          {bottomSeats.map(s => renderSeat(s, "rounded-none border-gray-300 border-t-0 border-r-0 last:border-r hover:z-10"))}
        </div>
      </div>

      {/* Bottom Chairs */}
      <div className={`flex w-full gap-0 ${bottomAlignRight ? 'justify-end' : 'justify-center'}`}>
        {bottomSeats.map(s => (
          <div key={`chair-bot-${s.id}`} className="w-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center bg-gray-50 text-gray-400 mt-1">
              <Armchair size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Helper for Room 12: Table against Top Wall
  const renderWallTableTop = (seats: SeatType[]) => (
    <div className="flex flex-col items-center w-full">
      {/* Table Top */}
      <div className="flex border-4 border-gray-300 bg-white border-t-0">
        {seats.map(s => renderSeat(s, "rounded-none border-gray-300 border-r-0 last:border-r hover:z-10"))}
      </div>
      {/* Chairs Below */}
      <div className="flex justify-center w-full gap-0">
        {seats.map(s => (
          <div key={`chair-12-top-${s.id}`} className="w-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center bg-gray-50 text-gray-400 mt-1">
              <Armchair size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Helper for Room 12: Table against Bottom Wall
  const renderWallTableBottom = (seats: SeatType[]) => (
    <div className="flex flex-col items-center w-full">
      {/* Chairs Above */}
      <div className="flex justify-center w-full gap-0">
        {seats.map(s => (
          <div key={`chair-12-bot-${s.id}`} className="w-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center bg-gray-50 text-gray-400 mb-1">
              <Armchair size={14} className="rotate-180" />
            </div>
          </div>
        ))}
      </div>
      {/* Table Bottom */}
      <div className="flex border-4 border-gray-300 bg-white border-b-0">
        {seats.map(s => renderSeat(s, "rounded-none border-gray-300 border-r-0 last:border-r hover:z-10"))}
      </div>
    </div>
  );

  // Helper for rendering doors (Red outlined rectangles as requested)
  const renderDoor = (className: string) => (
    <div className={`absolute bg-white border-2 border-red-500 z-20 flex items-center justify-center ${className}`}>
      <div className="w-full h-full bg-red-50 opacity-20"></div>
    </div>
  );

  // State for dynamic scaling of Room 35
  const [autoScale, setAutoScale] = React.useState(1);
  const [userZoom, setUserZoom] = React.useState(1);
  const room35ContainerRef = React.useRef<HTMLDivElement>(null);
  const room35ContentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const calculateScale = () => {
      if (room35ContainerRef.current && room35ContentRef.current) {
        const container = room35ContainerRef.current.getBoundingClientRect();
        // Measure content *without* scale transform if possible, 
        // but scrollHeight on the inner element works well if we don't constrain its height.
        const contentHeight = room35ContentRef.current.scrollHeight;
        const contentWidth = room35ContentRef.current.scrollWidth;

        // Available space
        const containerHeight = container.height - 60; // Padding adjustment
        const containerWidth = container.width - 40;

        if (contentHeight > 0 && contentWidth > 0) {
          const scaleH = containerHeight / contentHeight;
          const scaleW = containerWidth / contentWidth;

          // Apply safety factor and cap auto-scale at 1 (no auto-upscale)
          const newScale = Math.min(1, Math.min(scaleH, scaleW)) * 0.95;
          setAutoScale(newScale);
        }
      }
    };

    // Observer for container resize
    const observer = new ResizeObserver(calculateScale);
    if (room35ContainerRef.current) {
      observer.observe(room35ContainerRef.current);
    }

    // Also recalculate on window resize
    window.addEventListener('resize', calculateScale);

    // Initial calculation sequence
    calculateScale();
    setTimeout(calculateScale, 100);
    setTimeout(calculateScale, 500); // Extra safety check

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [assignments]); // Dependency on assignments is minimal impact

  const handleZoomIn = () => setUserZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setUserZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setUserZoom(1);

  const appliedScale = autoScale * userZoom;

  return (
    <div className="relative w-full h-full min-h-[1500px] bg-white shadow-2xl rounded-sm border border-gray-300 text-gray-700 select-none flex flex-row">

      {/* === LEFT COLUMN (Workspaces) === */}
      <div className="flex-[3] flex flex-col border-r-2 border-gray-400 min-w-0 h-full">

        {/* Top: Lớp học hiện trạng (Classroom) */}
        <div className="flex-[0.15] bg-hatch border-b-4 border-gray-800 relative p-4 flex-shrink-0">
          <div className="absolute top-2 right-2 border-2 border-dashed border-gray-500 p-2 rounded transform rotate-12 bg-white/80 z-10">
            <span className="text-xl font-black text-gray-500 uppercase block">Lớp học</span>
            <span className="text-xs font-bold text-gray-400 block text-right">Hiện trạng</span>
          </div>
          {/* Columns */}
          <div className="w-10 h-10 bg-black absolute top-10 left-10"></div>
          <div className="w-10 h-10 bg-black absolute top-10 right-32"></div>
          <div className="w-10 h-10 bg-black absolute bottom-0 left-10"></div>
          <div className="w-10 h-10 bg-black absolute bottom-0 right-32"></div>
        </div>

        {/* Middle: Room 12 People */}
        <div className="flex-[0.22] border-b-4 border-gray-800 p-2 relative bg-gray-50 flex flex-col justify-between flex-shrink-0 min-h-[220px]">
          <div className="absolute top-0 right-0 bg-gray-200 px-3 py-1 text-xs font-bold border-bl rounded-bl z-20 shadow-sm border border-gray-300">
            PHÒNG 12 NGƯỜI
          </div>

          {/* DOOR: Bottom Right of this room */}
          {renderDoor("right-0 top-8 w-1.5 h-12 translate-x-[2px]")}

          <div className="flex flex-col h-full justify-between py-2">
            {/* Row 1: Top Wall - 6 seats (Connected against wall) */}
            <div className="flex justify-center scale-90 origin-top">
              {renderWallTableTop(SEATS_ROOM_12.slice(0, 6))}
            </div>

            {/* Empty Center Space */}
            <div className="flex-1 flex items-center justify-center">
              <span className="text-gray-300 text-xs tracking-widest font-semibold opacity-50">KHÔNG GIAN CHUNG</span>
            </div>

            {/* Row 2: Bottom Wall - 6 seats (Connected against wall) */}
            <div className="flex justify-center scale-90 origin-bottom">
              {renderWallTableBottom(SEATS_ROOM_12.slice(6, 12))}
            </div>
          </div>

          {/* Columns */}
          <div className="w-5 h-5 bg-black absolute bottom-0 left-0"></div>
          <div className="w-5 h-5 bg-black absolute bottom-0 right-0"></div>
        </div>

        {/* Bottom: Room 35 People (Auto-FIT) */}
        <div
          ref={room35ContainerRef}
          className="flex-[0.65] p-6 relative bg-white flex flex-col min-h-[850px]"
        >
          <div className="absolute top-0 right-0 bg-gray-200 px-3 py-1 text-xs font-bold border-bl rounded-bl z-20 shadow-sm border border-gray-300">
            PHÒNG 35 NGƯỜI
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <button onClick={handleZoomIn} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center font-bold shadow hover:bg-black" title="Zoom In">+</button>
              <button onClick={handleZoomOut} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center font-bold shadow hover:bg-black" title="Zoom Out">-</button>
            </div>
            <button onClick={handleResetZoom} className="px-2 py-1 bg-gray-200 text-xs font-bold rounded shadow hover:bg-gray-300" title="Reset Zoom">Auto-Fit</button>
            {/* Debug Info */}
            <div className="text-[10px] text-gray-400 font-mono">
              Scale: {(appliedScale * 100).toFixed(0)}%
            </div>
          </div>

          {/* DOOR: Top Right of this room */}
          {renderDoor("right-0 top-12 w-1.5 h-12 translate-x-[2px]")}

          {/* CABINETS: Bottom Right (3 stacked) */}
          <div className="absolute bottom-6 right-0 flex flex-col gap-0.5 z-10 transition-transform origin-right" style={{ transform: `scale(${Math.min(1, appliedScale + 0.2)})` }}>
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

          {/* MAIN CONTENT CONTAINER with Auto-Scale */}
          <div
            className="flex-1 flex items-center justify-center w-full h-full"
          >
            <div
              ref={room35ContentRef}
              style={{
                transform: `scale(${appliedScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out'
              }}
              className="flex flex-col items-center gap-12 py-8 px-8" // Use gap-12 as requested
            >
              {/* Row 1 */}
              <div className="flex items-center justify-center">
                {renderTableCluster(SEATS_ROOM_35.slice(0, 6), SEATS_ROOM_35.slice(6, 12))}
              </div>

              {/* Row 2 (Align Right) */}
              <div className="flex items-center justify-center w-full">
                {renderTableCluster(SEATS_ROOM_35.slice(12, 18), SEATS_ROOM_35.slice(18, 23), true)}
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-center">
                {renderTableCluster(SEATS_ROOM_35.slice(23, 29), SEATS_ROOM_35.slice(29, 35))}
              </div>
            </div>
          </div>

          {/* Columns */}
          <div className="w-5 h-5 bg-black absolute top-0 left-0"></div>
          <div className="w-5 h-5 bg-black absolute top-0 right-0"></div>
          <div className="w-5 h-5 bg-black absolute bottom-0 left-0"></div>
          <div className="w-5 h-5 bg-black absolute bottom-0 right-0"></div>
        </div>

      </div>

      {/* === CORRIDOR (Hành lang) === */}
      <div className="w-16 bg-gray-100 border-r-2 border-gray-400 flex flex-col items-center justify-center relative flex-shrink-0 z-10">
        <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-gray-300"></div>
        <span className="text-gray-400 font-bold uppercase rotate-90 tracking-[0.5rem] whitespace-nowrap text-xs select-none">Hành Lang</span>
      </div>

      {/* === RIGHT COLUMN (Utilities) === */}
      <div className="flex-[1.5] flex flex-col bg-gray-100 min-w-0 h-full">

        {/* Top: Storage & Stairs */}
        <div className="h-64 border-b-2 border-gray-400 p-4 relative flex-shrink-0">
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
                <Archive size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Restrooms */}
        <div className="h-48 border-b-2 border-gray-400 p-2 flex gap-2 flex-shrink-0">
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
        <div className="flex-1 flex flex-col relative min-h-0 overflow-y-auto">

          {/* DOOR: Meeting Room/Pantry Entrance (Left side facing corridor) */}
          {renderDoor("left-0 top-32 w-1.5 h-12 -translate-x-[2px]")}

          {/* Pantry / Waiting Area */}
          <div className="flex-1 border-b border-gray-300 p-4 bg-white relative min-h-[120px]">
            <div className="absolute top-2 left-2 text-[10px] font-bold z-10">PHÒNG THỰC HÀNH CTO</div>
            <div className="w-full h-full flex items-center justify-center">
              <DoorOpen size={32} className="text-gray-400" />
            </div>
          </div>

          {/* Meeting Room */}
          <div className="flex-[2] p-6 bg-white relative min-h-[200px]">
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
          <div className="h-20 border-t border-gray-400 relative flex-shrink-0">
            <div className="absolute bottom-2 right-2 w-16 h-16 rounded-full border border-gray-400 flex items-center justify-center">
              <div className="w-full border-t border-gray-400 rotate-45"></div>
              <div className="w-full border-t border-gray-400 -rotate-45 absolute"></div>
            </div>
            <span className="absolute bottom-1 right-20 text-[10px]">THANG THOÁT HIỂM</span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default FloorPlan;