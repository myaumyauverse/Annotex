import { UserRole } from './index.js';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  walletAddress: string | null;
  isActive: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userId?: string;
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}
