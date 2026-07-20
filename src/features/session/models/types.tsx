import type { Dispatch, SetStateAction } from 'react';
import type { User } from '../../academy/models/types';

export type AcademySessionViewModel = {
  user: User | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  logout: () => Promise<void>;
};
