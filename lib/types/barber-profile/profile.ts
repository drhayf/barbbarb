export interface BarberProfileFormData {
  bio: string;
  specialties: string[];
  instagramHandle: string;
}

// ============================================
// SPECIALTIES OPTIONS
// ============================================

export const SPECIALTIES_OPTIONS = [
  'Fade',
  'Beard Trim',
  'Scissor Cut',
  'Shave',
  'Hair Coloring',
  'Styling',
  'Keratin Treatment',
  'Hair Spa',
  'Kids Haircut',
  'Senior Haircut',
  'Buzz Cut',
  'Pompadour',
  'Undercut',
  'Texturizing',
  'Hair Treatment',
] as const;

export type Specialty = typeof SPECIALTIES_OPTIONS[number];
