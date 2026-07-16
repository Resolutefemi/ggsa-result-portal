/**
 * Default subject list for God Generals Standard Academy
 * Based on the original paper report card template.
 */

export interface DefaultSubject {
  name: string;
  code: string;
  order: number;
  category: 'JUNIOR' | 'SENIOR' | 'BOTH';
}

export const DEFAULT_SUBJECTS: DefaultSubject[] = [
  { name: 'English Studies', code: 'ENG', order: 1, category: 'BOTH' },
  { name: 'Mathematics', code: 'MATH', order: 2, category: 'BOTH' },
  { name: 'Yoruba Studies', code: 'YOR', order: 3, category: 'BOTH' },
  { name: 'Business Studies', code: 'BUS', order: 4, category: 'JUNIOR' },
  { name: 'Physical & Health Edu.', code: 'PHE', order: 5, category: 'BOTH' },
  { name: 'Basic Science', code: 'BSC', order: 6, category: 'JUNIOR' },
  { name: 'Information Tech.', code: 'IT', order: 7, category: 'BOTH' },
  { name: 'Basic Technology', code: 'BTECH', order: 8, category: 'JUNIOR' },
  { name: 'CRS / IRS', code: 'CRS', order: 9, category: 'BOTH' },
  { name: 'Social Studies', code: 'SOC', order: 10, category: 'JUNIOR' },
  { name: 'Civic Education', code: 'CIV', order: 11, category: 'BOTH' },
  { name: 'Security Education', code: 'SEC', order: 12, category: 'JUNIOR' },
  { name: 'Igbo / Music', code: 'IGB', order: 13, category: 'BOTH' },
  { name: 'Cultural & Creative Arts', code: 'CCA', order: 14, category: 'BOTH' },
  { name: 'Agric Science', code: 'AGR', order: 15, category: 'BOTH' },
  { name: 'Home Economics', code: 'HEC', order: 16, category: 'JUNIOR' },
];

export const DEFAULT_CLASSES = [
  { name: 'JSS 1', category: 'JUNIOR' },
  { name: 'JSS 2', category: 'JUNIOR' },
  { name: 'JSS 3', category: 'JUNIOR' },
];

// Character / behaviour traits
export const SKILL_TRAITS = [
  'Handwriting',
  'Fluency',
  'Spelling',
  'Drawing',
  'Painting & Craft',
  'Music',
  'Drama',
];

export const BEHAVIOUR_TRAITS = [
  'Attentiveness',
  'Punctuality',
  'Neatness',
  'Politeness',
  'Honesty',
  'Reliability',
  'Obedience',
];

// Grading scale
export const GRADE_SCALE = [
  { grade: 'A', min: 70, max: 100, remark: 'Excellent', rating: 'Excellent' },
  { grade: 'B', min: 60, max: 69, remark: 'Very Good', rating: 'Good' },
  { grade: 'C', min: 50, max: 59, remark: 'Good', rating: 'Average' },
  { grade: 'D', min: 45, max: 49, remark: 'Pass', rating: 'Pass' },
  { grade: 'E', min: 40, max: 44, remark: 'Fair', rating: 'Fair' },
  { grade: 'F', min: 0, max: 39, remark: 'Fail', rating: 'Fail' },
];

export function calculateGrade(score: number | null | undefined): string | null {
  if (score == null || isNaN(score)) return null;
  for (const g of GRADE_SCALE) {
    if (score >= g.min && score <= g.max) return g.grade;
  }
  return null;
}

export function gradeRemark(grade: string | null): string {
  if (!grade) return '';
  const g = GRADE_SCALE.find((s) => s.grade === grade);
  return g?.remark ?? '';
}

export function gradeRating(grade: string | null): string {
  if (!grade) return '';
  const g = GRADE_SCALE.find((s) => s.grade === grade);
  return g?.rating ?? '';
}

// School information (constant)
export const SCHOOL_INFO = {
  name: 'GOD GENERALS STANDARD ACADEMY',
  address: '6, Victory Avenue, Off Ikare/Akungba Road, Adjacent New Garage, Oke-Igbede, Ikare Akoko, Ondo State',
  phones: '08134033219, 08063681454',
  email: 'godgenerals1@gmail.com',
  motto: 'For Development & Academic Excellence',
};
