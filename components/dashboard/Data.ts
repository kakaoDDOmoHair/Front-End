export type Worker = {
  id: string;
  name: string;
  time: string;
  status: 'working' | 'late';
};

export type ScheduleItem = {
  time: string;
  staff: string[];
};

export type ScheduleDay = {
  day: string;
  schedules: ScheduleItem[];
};

export const WORKERS: Worker[] = [
  { id: '1', name: '김도홍', time: '09:00 ~ 현재', status: 'working' },
  { id: '2', name: '김도홍', time: '09:30 ~ 현재', status: 'late' },
  { id: '3', name: '김도홍', time: '09:00 ~ 현재', status: 'working' },
];
export const SCHEDULES: ScheduleDay[] = [
  {
    day: '일요일',
    schedules: [
      { time: '09:00 - 13:00', staff: ['도홍', '현아'] },
      { time: '13:00 - 15:00', staff: ['도홍', '현아', '사장'] },
      { time: '15:00 - 18:00', staff: ['지운', '준영', '현아'] },
      { time: '18:00 - 23:00', staff: ['지운', '준영', '사장'] },
    ]
  },
  {
    day: '월요일',
    schedules: [
      { time: '09:00 - 13:00', staff: ['도홍', '현아'] },
      { time: '13:00 - 15:00', staff: ['도홍', '현아', '사장'] },
      { time: '15:00 - 18:00', staff: ['지운', '준영', '현아'] },
      { time: '18:00 - 23:00', staff: ['지운', '준영', '사장'] },
    ]
  },
    {
    day: '화요일',
    schedules: [
      { time: '09:00 - 13:00', staff: ['도홍', '현아'] },
      { time: '13:00 - 15:00', staff: ['도홍', '현아', '사장'] },
      { time: '15:00 - 18:00', staff: ['지운', '준영', '현아'] },
      { time: '18:00 - 23:00', staff: ['지운', '준영', '사장'] },
    ]
  },
  {
    day: '수요일',
    schedules: [
      { time: '09:00 - 13:00', staff: ['도홍', '현아'] },
      { time: '13:00 - 15:00', staff: ['도홍', '현아', '사장'] },
      { time: '15:00 - 18:00', staff: ['지운', '준영', '현아'] },
      { time: '18:00 - 23:00', staff: ['지운', '준영', '사장'] },
    ]
  },
  {
    day: '목요일',
    schedules: [
      { time: '09:00 - 13:00', staff: ['도홍', '현아'] },
      { time: '13:00 - 15:00', staff: ['도홍', '현아', '사장'] },
      { time: '15:00 - 18:00', staff: ['지운', '준영', '현아'] },
      { time: '18:00 - 23:00', staff: ['지운', '준영', '사장'] },
    ]
  },
  {
    day: '금요일',
    schedules: [
      { time: '09:00 - 13:00', staff: ['도홍', '현아'] },
      { time: '13:00 - 15:00', staff: ['도홍', '현아', '사장'] },
      { time: '15:00 - 18:00', staff: ['지운', '준영', '현아'] },
      { time: '18:00 - 23:00', staff: ['지운', '준영', '사장'] },
    ]
  },
    {
    day: '토요일',
    schedules: [
      { time: '09:00 - 13:00', staff: ['도홍', '현아'] },
      { time: '13:00 - 15:00', staff: ['도홍', '현아', '사장'] },
      { time: '15:00 - 18:00', staff: ['지운', '준영', '현아'] },
      { time: '18:00 - 23:00', staff: ['지운', '준영', '사장'] },
    ]
  }
];
