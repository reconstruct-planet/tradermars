import 'next-auth';
import 'next-auth/jwt';
import type { UserRole, UserStatus } from '@/lib/admin-permissions';

declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      status?: UserStatus;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    status?: UserStatus;
  }
}
