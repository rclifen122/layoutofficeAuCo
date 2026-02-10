import React, { useState, useEffect } from 'react';
import { Employee, Assignment, Seat } from './types';
import { MOCK_EMPLOYEES, ALL_SEATS } from './constants';
import EmployeeList from './components/EmployeeList';
import FloorPlan from './components/FloorPlan';
import { generateSmartSeating } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Save, RefreshCcw, Layout, Maximize2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  // State
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Load assignments from Supabase on mount
  useEffect(() => {
    const loadAssignments = async () => {
      const { data, error } = await supabase
        .from('seat_assignments')
        .select('seat_id, employee_id');

      if (error) {
        console.error('Error loading assignments:', error);
        return;
      }

      if (data) {
        const loadedAssignments: Assignment[] = data.map((item: any) => ({
          seatId: item.seat_id,
          employeeId: item.employee_id
        }));
        setAssignments(loadedAssignments);
      }
    };

    loadAssignments();
  }, []);

  const handleSaveSeats = async () => {
    setIsSaving(true);
    try {
      // 1. Clear existing assignments (simple approach for single layout)
      const { error: deleteError } = await supabase
        .from('seat_assignments')
        .delete()
        .neq('id', 0); // Delete all rows where id is not 0 (effectively all)

      if (deleteError) throw deleteError;

      // 2. Insert new assignments
      if (assignments.length > 0) {
        const { error: insertError } = await supabase
          .from('seat_assignments')
          .insert(assignments.map(a => ({
            seat_id: a.seatId,
            employee_id: a.employeeId
          })));

        if (insertError) throw insertError;
      }

      showNotification('Đã lưu sơ đồ thành công!', 'success');
    } catch (error) {
      console.error('Error saving:', error);
      showNotification('Lỗi khi lưu sơ đồ.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

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

  // Common capture function to ensure consistent high-quality export
  const handleCapture = async (): Promise<string | null> => {
    const input = document.getElementById('floor-plan-container');
    if (!input) {
      showNotification('Không tìm thấy sơ đồ để xuất', 'error');
      return null;
    }

    let cloneContainer: HTMLDivElement | null = null;
    const EXPORT_WIDTH = 2500; // Force a very large width to ensure "desktop" layout with no wrapping

    try {
      showNotification('Đang xử lý hình ảnh...', 'success');

      // 1. Clone the DOM
      const clone = input.cloneNode(true) as HTMLElement;

      // 2. Setup a hidden container - allow it to be huge
      cloneContainer = document.createElement('div');
      cloneContainer.style.position = 'fixed';
      cloneContainer.style.top = '0';
      cloneContainer.style.left = '0';
      cloneContainer.style.opacity = '0';
      cloneContainer.style.pointerEvents = 'none';
      cloneContainer.style.zIndex = '-9999';
      document.body.appendChild(cloneContainer);
      cloneContainer.appendChild(clone);

      // 3. Configure the CLONE to be FULL SIZE
      clone.style.width = `${EXPORT_WIDTH}px`;
      clone.style.maxWidth = 'none';
      clone.style.height = 'auto';
      clone.style.minHeight = '1500px';
      clone.classList.remove('max-w-5xl');

      // 4. FIX Room 35 Scaling
      const room35Content = clone.querySelector('#room-35-content') as HTMLElement;
      const room35Container = clone.querySelector('#room-35-container') as HTMLElement;

      if (room35Content) {
        room35Content.style.transform = 'none';
        room35Content.style.width = '100%';
      }
      if (room35Container) {
        room35Container.style.flex = 'none';
        room35Container.style.height = 'auto';
        room35Container.style.minHeight = 'auto';
      }

      // 5. Capture with html2canvas using the forced dimensions
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: EXPORT_WIDTH,
        windowWidth: EXPORT_WIDTH,
        backgroundColor: '#ffffff'
      });

      return canvas.toDataURL('image/png');

    } catch (err) {
      console.error('Capture error:', err);
      showNotification('Lỗi khi xử lý hình ảnh', 'error');
      return null;
    } finally {
      if (cloneContainer && document.body.contains(cloneContainer)) {
        document.body.removeChild(cloneContainer);
      }
    }
  };



  const handleExportImage = async () => {
    const imgData = await handleCapture();
    if (!imgData) return;

    try {
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `so-do-cho-ngoi-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Đã lưu ảnh thành công!', 'success');
    } catch (e) {
      showNotification('Lỗi khi tải ảnh', 'error');
    }
  };

  const handleCopyToClipboard = async () => {
    const imgData = await handleCapture();
    if (!imgData) return;

    try {
      // Convert DataURL to Blob
      const res = await fetch(imgData);
      const blob = await res.blob();

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      showNotification('Đã copy ảnh vào clipboard!', 'success');
    } catch (err) {
      console.error('Clipboard write failed:', err);
      showNotification('Lỗi khi copy vào clipboard', 'error');
    }
  };

  const handleExportPDF = async () => {
    const imgData = await handleCapture();
    if (!imgData) return;

    try {
      showNotification('Đang tạo PDF...', 'success');

      // Load image to get dimensions
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, img.width, img.height);
      pdf.save(`so-do-cho-ngoi-${new Date().toISOString().split('T')[0]}.pdf`);

      showNotification('Đã xuất PDF thành công!', 'success');
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
            className="flex items-center gap-2 px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors text-sm font-semibold"
          >
            <Download size={16} /> Xuất PDF
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors text-sm font-semibold"
            title="Copy ảnh vào clipboard để dán (Ctrl+V)"
          >
            <Download size={16} /> Copy Ảnh
          </button>
          <button
            onClick={handleExportImage}
            className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors text-sm font-semibold"
          >
            <Download size={16} /> Xuất Ảnh (PNG)
          </button>
          <button
            onClick={() => {
              const elem = document.getElementById('floor-plan-container');
              if (elem) {
                if (!document.fullscreenElement) {
                  elem.requestFullscreen().catch(err => {
                    showNotification(`Lỗi full screen: ${err.message}`, 'error');
                  });
                } else {
                  document.exitFullscreen();
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors text-sm font-semibold"
            title="Toàn màn hình"
          >
            <Maximize2 size={16} />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow transition-colors text-sm font-semibold"
            onClick={handleSaveSeats}
            disabled={isSaving}
          >
            <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu sơ đồ'}
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
          <div id="floor-plan-container" className="w-full max-w-5xl min-h-[1500px] h-auto bg-white shadow-xl">
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