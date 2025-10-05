import { SkillLevel } from './types';

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: SkillLevel.MA, label: '남자 A 급' },
  { value: SkillLevel.MB, label: '남자 B 급' },
  { value: SkillLevel.MC, label: '남자 C 급' },
  { value: SkillLevel.MD, label: '남자 D 급' },
  { value: SkillLevel.WA, label: '여자 A 급' },
  { value: SkillLevel.WB, label: '여자 B 급' },
  { value: SkillLevel.WC, label: '여자 C 급' },
  { value: SkillLevel.WD, label: '여자 D 급' },
];

export const ADMIN_NAMES: string[] = ['박종태', '헤나또', '김성호', '박성실', '정문숙'];