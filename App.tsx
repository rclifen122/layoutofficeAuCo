import React, { useState, useEffect } from 'react';
import { Employee, Assignment, Seat } from './types';
import { MOCK_EMPLOYEES, ALL_SEATS } from './constants';
import EmployeeList from './components/EmployeeList';
import FloorPlan from './components/FloorPlan';
import { generateSmartSeating } from './services/geminiService';
import { Save, RefreshCcw, Layout, Maximize2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  // State
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Derived state
  const unassignedEmployees = employees.filter(e => !assignments.find(a => a.employeeId === e.id));
  const assignedEmployees = employees.filter(e => assignments.find(a => a.employeeId === e.id));

  // Handlers
  const handleSelectEmployee = (id: string) => {
    if (selectedEmployeeId === id) {
      setSelectedEmployeeId(null);
    } else {
      setSelectedEmployeeId(id);
    }
  };

  const handleSeatClick = (seatId: string) => {
    // 1. If an employee is selected, try to assign
    if (selectedEmployeeId) {
      // Check if seat is already occupied
      const existingAssignmentIndex = assignments.findIndex(a => a.seatId === seatId);

      let newAssignments = [...assignments];

      // If occupied, remove old occupant
      if (existingAssignmentIndex !== -1) {
        newAssignments.splice(existingAssignmentIndex, 1);
      }

      // Check if this employee is already assigned elsewhere, if so, move them
      const employeeCurrentSeatIndex = newAssignments.findIndex(a => a.employeeId === selectedEmployeeId);
      if (employeeCurrentSeatIndex !== -1) {
        newAssignments.splice(employeeCurrentSeatIndex, 1);
      }

      // Add new assignment
      newAssignments.push({ seatId, employeeId: selectedEmployeeId });

      setAssignments(newAssignments);
      setSelectedEmployeeId(null); // Deselect after placement
      showNotification('Đã xếp chỗ thành công!', 'success');
      return;
    }

    // 2. If no employee selected, but seat clicked
    const assignment = assignments.find(a => a.seatId === seatId);
    if (assignment) {
      // Unassign (click to remove)
      if (window.confirm('Bạn có muốn hủy chỗ ngồi của nhân viên này?')) {
        setAssignments(assignments.filter(a => a.seatId !== seatId));
        showNotification('Đã hủy chỗ ngồi.', 'success');
      }
    }
  };

  const handleDrop = (seatId: string, employeeId: string) => {
    let newAssignments = [...assignments];

    // 1. Remove employee from old seat if any (moving from another seat)
    const oldSeatIndex = newAssignments.findIndex(a => a.employeeId === employeeId);
    if (oldSeatIndex !== -1) {
      newAssignments.splice(oldSeatIndex, 1);
    }

    // 2. Remove any occupant currently in target seat (replace/evict)
    const targetSeatIndex = newAssignments.findIndex(a => a.seatId === seatId);
    if (targetSeatIndex !== -1) {
      newAssignments.splice(targetSeatIndex, 1);
    }

    // 3. Add new assignment
    newAssignments.push({ seatId, employeeId });
    setAssignments(newAssignments);
    showNotification('Đã xếp chỗ thành công!', 'success');
  };

  const handleAutoAssign = async () => {
    if (!process.env.API_KEY) {
      showNotification('Lỗi: Chưa cấu hình API KEY cho Gemini.', 'error');
      // Mocking for demo if no key
      mockAutoAssign();
      return;
    }

    setIsGenerating(true);
    try {
      const newAssignments = await generateSmartSeating(employees, ALL_SEATS, assignments);
      if (newAssignments.length > 0) {
        // Merge with existing
        setAssignments(prev => [...prev, ...newAssignments]);
        showNotification(`AI đã tự động xếp ${newAssignments.length} nhân viên.`, 'success');
      } else {
        showNotification('AI không tìm thấy phương án tối ưu hoặc hết chỗ.', 'error');
      }
    } catch (e) {
      showNotification('Có lỗi xảy ra khi gọi AI.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fallback simple auto assign if no API key
  const mockAutoAssign = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const availableSeats = ALL_SEATS.filter(s => !assignments.find(a => a.seatId === s.id));
      const needed = unassignedEmployees.length;
      const toAssignCount = Math.min(availableSeats.length, needed);

      const newAssigns: Assignment[] = [];
      for (let i = 0; i < toAssignCount; i++) {
        newAssigns.push({
          seatId: availableSeats[i].id,
          employeeId: unassignedEmployees[i].id
        });
      }
      setAssignments(prev => [...prev, ...newAssigns]);
      setIsGenerating(false);
      showNotification('Đã tự động xếp (Chế độ giả lập)', 'success');
    }, 1500);
  }

  const handleReset = () => {
    if (window.confirm('Xóa toàn bộ sơ đồ hiện tại?')) {
      setAssignments([]);
    }
  };

  const handleExportPDF = async () => {
    const input = document.getElementById('floor-plan-container');
    if (!input) {
      showNotification('Không tìm thấy sơ đồ để xuất PDF', 'error');
      return;
    }

    try {
      showNotification('Đang tạo PDF...', 'success');
      // Use higher scale for better quality
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: input.scrollWidth + 50, // Ensure full width is captured
        windowHeight: input.scrollHeight + 50,
        onclone: (document) => {
          // Optional: Fix styles specifically for PDF export
          const element = document.getElementById('floor-plan-container');
          if (element) {
            element.style.padding = '20px'; // Ensure padding in snapshot
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a2'
      });

      // A2 Landscape size is 594mm x 420mm
      const pageWidth = 594;
      const pageHeight = 420;

      const canvasRatio = canvas.width / canvas.height;
      const pageRatio = pageWidth / pageHeight;

      let renderWidth = pageWidth;
      let renderHeight = pageHeight;

      if (canvasRatio > pageRatio) {
        // Canvas is wider than page -> fit to width
        renderHeight = pageWidth / canvasRatio;
      } else {
        // Canvas is taller than page -> fit to height
        renderWidth = pageHeight * canvasRatio;
      }

      // Center the image
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
      pdf.save(`so-do-cho-ngoi-${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification('Đã xuất PDF thành công (Khổ A2)!', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Lỗi khi xuất PDF', 'error');
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-30">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Layout size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Office Seat Planner</h1>
            <p className="text-xs text-gray-500">Mặt bằng tầng 06</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div> Đã xếp ({assignedEmployees.length})
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div> Trống ({ALL_SEATS.length - assignedEmployees.length})
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors text-sm font-semibold"
          >
            <RefreshCcw size={16} /> Reset
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors text-sm font-semibold"
          >
            <Download size={16} /> Xuất PDF
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow transition-colors text-sm font-semibold"
            onClick={() => alert("Chức năng lưu chưa được tích hợp backend")}
          >
            <Save size={16} /> Lưu sơ đồ
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <EmployeeList
          employees={employees} // Pass all, list handles filtering for unassigned visually or logic inside
          selectedEmployeeId={selectedEmployeeId}
          onSelectEmployee={handleSelectEmployee}
          onAutoAssign={handleAutoAssign}
          isGenerating={isGenerating}
        />

        {/* Map Area */}
        <div className="flex-1 bg-gray-200 p-8 overflow-auto flex justify-center relative">
          <div id="floor-plan-container" className="w-full max-w-5xl h-[800px] bg-white shadow-xl">
            <FloorPlan
              assignments={assignments}
              employees={employees}
              selectedEmployeeId={selectedEmployeeId}
              onSeatClick={handleSeatClick}
              onDrop={handleDrop}
            />
          </div>
        </div>
      </main>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-md shadow-lg text-white font-medium animate-bounce z-50
          ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}
        `}>
          {notification.msg}
        </div>
      )}
    </div>
  );
};

export default App;