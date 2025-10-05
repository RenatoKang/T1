export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum Role {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum SkillLevel {
  MA = 'MA',
  MB = 'MB',
  MC = 'MC',
  MD = 'MD',
  WA = 'WA',
  WB = 'WB',
  WC = 'WC',
  WD = 'WD',
}

export interface Member {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  gender: Gender;
  age: number;
  profilePicUrl: string | null;
  skillLevel: SkillLevel;
  dues: Record<string, boolean>;
}

export interface CurrentUser extends Member {
  role: Role;
}

export enum View {
  MEMBERS = 'MEMBERS',
  ADD_MEMBER = 'ADD_MEMBER',
  DUES = 'DUES',
  TOURNAMENT = 'TOURNAMENT'
}

export enum GameType {
  SINGLES = 'Singles',
  DOUBLES = 'Doubles',
}

export interface Match {
  id: string;
  player1: string | string[] | { bye: true } | null;
  player2: string | string[] | null;
  winner: string | string[] | null;
  round: number;
}

export interface Tournament {
  id: string;
  name: string;
  type: GameType;
  matches: Match[];
}
