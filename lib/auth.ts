import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { demoTradingData } from './demo-data';
import { prisma } from './prisma';
import { loginSchema } from './validation';

const demoAuthSecret = !process.env.DATABASE_URL
  ? 'tradeharbor-local-demo-secret-do-not-use-in-production'
  : undefined;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? demoAuthSecret,
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email }
          });

          if (!user?.passwordHash) return null;

          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? user.email
          };
        } catch {
          if (
            parsed.data.email === demoTradingData.user.email &&
            parsed.data.password === 'demo1234'
          ) {
            return {
              id: 'demo-user',
              email: demoTradingData.user.email,
              name: demoTradingData.user.name
            };
          }
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
      }
      return session;
    }
  }
};
