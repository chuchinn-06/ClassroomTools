export interface Student {
  id: string;
  name: string;
  seatNumber?: string;
}

export interface DrawHistoryItem {
  id: string;
  student: Student;
  timestamp: number;
}

export interface GroupResult {
  id: string;
  groupNumber: number;
  groupName: string;
  members: Student[];
}

export type ActiveTab = 'picker' | 'groups' | 'roster';
