import { atom } from 'nanostores';
import type { UserModel } from '../persistence/userModel';

export const userStore = atom<UserModel | null>(null);
