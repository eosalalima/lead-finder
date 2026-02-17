import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: 'ADMIN' | 'RM';
    };
  }

  interface User {
    role: 'ADMIN' | 'RM';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ADMIN' | 'RM';
  }
}
