/**
 * NextAuth Configuration
 * Handles authentication for the Class Memory Rooms application
 * Integrates with Foru.ms API for user authentication and session management
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { ForumClient } from './forum/client';

// Create a forum client instance for authentication (lazy initialization)
let forumClientInstance: ForumClient | null = null;
const getForumClient = () => {
  if (!forumClientInstance) {
    forumClientInstance = new ForumClient();
  }
  return forumClientInstance;
};

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider for email/password login with Foru.ms integration
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
        },
        action: {
          label: 'Action',
          type: 'text'
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          let authResult;
          const forumClient = getForumClient();
          
          // Handle registration vs login based on action
          if (credentials.action === 'register') {
            // Extract name from email for registration (can be improved with separate name field)
            const name = credentials.email.split('@')[0];
            authResult = await forumClient.register({
              name,
              email: credentials.email,
              password: credentials.password,
            });
            
            // For registration, we need to login to get the token
            const loginResult = await forumClient.login({
              email: credentials.email,
              password: credentials.password,
            });
            
            return {
              id: authResult.id,
              name: authResult.name,
              email: authResult.email,
              image: authResult.avatarUrl || null,
              forumUserId: authResult.id,
              forumToken: loginResult.token,
            };
          } else {
            // Standard login
            authResult = await forumClient.login({
              email: credentials.email,
              password: credentials.password,
            });
            
            return {
              id: authResult.user.id,
              name: authResult.user.name,
              email: authResult.user.email,
              image: authResult.user.avatarUrl || null,
              forumUserId: authResult.user.id,
              forumToken: authResult.token,
            };
          }
        } catch (error) {
          console.error('Foru.ms authentication failed:', error);
          return null;
        }
      }
    }),

    // Google OAuth provider (optional) - would need additional integration with Foru.ms
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Persist Foru.ms user data in the token
      if (user) {
        token.id = user.id;
        token.forumUserId = user.forumUserId;
        token.forumToken = user.forumToken;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      
      // Handle OAuth account linking (would need additional Foru.ms integration)
      if (account) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },

    async session({ session, token }) {
      // Send user data and Foru.ms token to the client
      if (token.id) {
        session.user.id = token.id as string;
        session.user.forumUserId = token.forumUserId as string;
        session.user.forumToken = token.forumToken as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      
      return session;
    },

    async signIn({ user, account, profile }) {
      // Allow sign in if we have valid Foru.ms data
      return !!(user?.forumUserId && user?.forumToken);
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

// Helper function to get Foru.ms token from session
export async function getForumToken(): Promise<string | null> {
  const { getServerSession } = await import('next-auth');
  const session = await getServerSession(authOptions);
  return session?.user?.forumToken || null;
}

// Helper function to get Foru.ms user ID from session
export async function getForumUserId(): Promise<string | null> {
  const { getServerSession } = await import('next-auth');
  const session = await getServerSession(authOptions);
  return session?.user?.forumUserId || null;
}

// Helper function to configure forum client with session token
export async function getAuthenticatedForumClient(): Promise<ForumClient> {
  const token = await getForumToken();
  const client = getForumClient();
  if (token) {
    client.setAuthToken(token);
  }
  return client;
}

// Helper function to refresh Foru.ms token (for future token refresh implementation)
export async function refreshForumToken(refreshToken: string): Promise<string | null> {
  try {
    // This would be implemented when Foru.ms supports token refresh
    // For now, return null to indicate refresh is not available
    return null;
  } catch (error) {
    console.error('Failed to refresh Foru.ms token:', error);
    return null;
  }
}

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      forumUserId: string;
      forumToken: string;
    };
  }

  interface User {
    id: string;
    forumUserId?: string;
    forumToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    forumUserId: string;
    forumToken: string;
  }
}