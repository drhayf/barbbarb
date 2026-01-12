export type DayOfWeek = 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday' 
  | 'sunday';

export interface DayAvailability {
  isOpen: boolean;
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export type WeeklyAvailability = Record<DayOfWeek, DayAvailability>;

// Default availability when creating a new profile
export const defaultWeeklyAvailability: WeeklyAvailability = {
  monday: { isOpen: true, start: '09:00', end: '17:00' },
  tuesday: { isOpen: true, start: '09:00', end: '17:00' },
  wednesday: { isOpen: true, start: '09:00', end: '17:00' },
  thursday: { isOpen: true, start: '09:00', end: '17:00' },
  friday: { isOpen: true, start: '09:00', end: '17:00' },
  saturday: { isOpen: false, start: '10:00', end: '14:00' },
  sunday: { isOpen: false, start: '10:00', end: '14:00' },
};
