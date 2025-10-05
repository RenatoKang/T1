import { SkillLevel } from './types';

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: SkillLevel.MA, label: 'Masculino Nível A' },
  { value: SkillLevel.MB, label: 'Masculino Nível B' },
  { value: SkillLevel.MC, label: 'Masculino Nível C' },
  { value: SkillLevel.MD, label: 'Masculino Nível D' },
  { value: SkillLevel.WA, label: 'Feminino Nível A' },
  { value: SkillLevel.WB, label: 'Feminino Nível B' },
  { value: SkillLevel.WC, label: 'Feminino Nível C' },
  { value: SkillLevel.WD, label: 'Feminino Nível D' },
];

export const ADMIN_NAMES: string[] = ['박종태', '헤나또', '김성호', '박성실', '정문숙', 'admin1', 'admin2'];