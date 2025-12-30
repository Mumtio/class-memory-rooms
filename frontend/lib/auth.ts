/**
 * NextAuth Configuration
 * Handles authentication for the Class Memory Rooms application
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider for email/password login
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your@email.com'
        },
        password: { 
          label: 'Password', 
          type: 'password' 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // TODO: Implement your authentication logic here
        // This could be:
        // 1. Check against your database
        // 2. Validate with external auth service
        // 3. Check against Foru.ms user system
        
        // For now, return a mock user for development
        // REMOVE THIS IN PRODUCTION
        if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
          return {
            id: 'demo-user-1',
            name: 'Demo User',
            email: 'demo@example.com',
            image: null,
          };
        }

        // Return null if authentication fails
        return null;
      }
    }),

    // Google OAuth provider (optional)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Persist user ID in the token
      if (user) {
        token.id = user.id;
      }
      
      // Handle OAuth account linking
      if (account) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },

    async session({ session, token }) {
      // Send user ID to the client
      if (token.id) {
        session.user.id = token.id as string;
      }
      
      return session;
    },

    async signIn({ user, account, profile }) {
      // Allow sign in
      return true;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to gateway after sign in
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return `${baseUrl}/gateway`;
    },
  },

  pages: {
    signIn: '/login',
    signUp: '/signup',
    error: '/login', // Redirect to login on error
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to get server session
export { getServerSession } from 'next-auth';

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}