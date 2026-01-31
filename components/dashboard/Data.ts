export type Worker = {
  id: string;
  name: string;
  time: string;
  status: 'working' | 'late' | 'absent';
};

export type ScheduleItem = {
  time: string;
  staff: string[];
};

export type ScheduleDay = {
  day: string;
  schedules: ScheduleItem[];
};
