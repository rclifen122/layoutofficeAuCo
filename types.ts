export type Role = string;

export interface Employee {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
}

export interface Seat {
  id: string;
  roomId: 'room-12' | 'room-35';
  label: string; // e.g., A1, B2
  x?: number; // Optional grid coordinates if needed
  y?: number;
}

export interface Assignment {
  seatId: string;
  employeeId: string;
}

export interface RoomConfig {
  id: string;
  name: string;
  capacity: number;
}