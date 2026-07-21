import type { User } from '../../academy/models/types';

export type AcademySessionViewModel = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};
