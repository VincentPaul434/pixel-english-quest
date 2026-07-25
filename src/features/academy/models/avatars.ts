import studentBurgundy from '../../../assets/avatar-customization/students/student-burgundy.png';
import studentCream from '../../../assets/avatar-customization/students/student-cream.png';
import studentNavy from '../../../assets/avatar-customization/students/student-navy.png';
import studentRoyalPurple from '../../../assets/avatar-customization/students/student-royal-purple.png';
import studentTeal from '../../../assets/avatar-customization/students/student-teal.png';
import studentViolet from '../../../assets/avatar-customization/students/student-violet.png';
import teacherCream from '../../../assets/avatar-customization/teachers/teacher-cream.png';
import teacherRegalPurple from '../../../assets/avatar-customization/teachers/teacher-regal-purple.png';
import teacherScholarNavy from '../../../assets/avatar-customization/teachers/teacher-scholar-navy.png';
import teacherSeniorCream from '../../../assets/avatar-customization/teachers/teacher-senior-cream.png';
import teacherSeniorNavy from '../../../assets/avatar-customization/teachers/teacher-senior-navy.png';
import teacherViolet from '../../../assets/avatar-customization/teachers/teacher-violet.png';
import type { Role } from './types';

export type AvatarOption = {
  id: string;
  label: string;
  role: Role;
  src: string;
};

const studentAvatarOptions: readonly AvatarOption[] = [
  { id: 'student-navy', label: 'Navy Scholar', role: 'student', src: studentNavy },
  { id: 'student-violet', label: 'Violet Sage', role: 'student', src: studentViolet },
  { id: 'student-burgundy', label: 'Crimson Scribe', role: 'student', src: studentBurgundy },
  { id: 'student-teal', label: 'Teal Seeker', role: 'student', src: studentTeal },
  { id: 'student-cream', label: 'Ivory Guide', role: 'student', src: studentCream },
  { id: 'student-royal-purple', label: 'Royal Mage', role: 'student', src: studentRoyalPurple }
];

const teacherAvatarOptions: readonly AvatarOption[] = [
  { id: 'teacher-senior-navy', label: 'Senior Scholar', role: 'teacher', src: teacherSeniorNavy },
  { id: 'teacher-violet', label: 'Violet Mentor', role: 'teacher', src: teacherViolet },
  { id: 'teacher-regal-purple', label: 'Regal Professor', role: 'teacher', src: teacherRegalPurple },
  { id: 'teacher-cream', label: 'Ivory Lecturer', role: 'teacher', src: teacherCream },
  { id: 'teacher-scholar-navy', label: 'Academy Master', role: 'teacher', src: teacherScholarNavy },
  { id: 'teacher-senior-cream', label: 'Silver Sage', role: 'teacher', src: teacherSeniorCream }
];

export const avatarOptionsByRole: Record<Role, readonly AvatarOption[]> = {
  student: studentAvatarOptions,
  teacher: teacherAvatarOptions
};

export const defaultAvatarIdByRole: Record<Role, string> = {
  student: studentAvatarOptions[0].id,
  teacher: teacherAvatarOptions[0].id
};

export function avatarOptionFor(avatarId: string | undefined, role: Role) {
  return avatarOptionsByRole[role].find((option) => option.id === avatarId) || avatarOptionsByRole[role][0];
}
