import NextAuth, { type DefaultSession } from "next-auth";
import EntraIdProvider from "next-auth/providers/microsoft-entra-id";
import { getUser, createUser } from "@/lib/db/queries";
import { authConfig } from "./auth.config";
import type { DefaultJWT } from "next-auth/jwt";

export type UserType = "user" | "admin";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    dbId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    EntraIdProvider({
      clientId: process.env.AUTH_ENTRA_ID_CLIENT_ID,
      clientSecret: process.env.AUTH_ENTRA_ID_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_ENTRA_ID_TENANT_ID}/v2.0`,
      authorization: { params: { scope: "openid profile email" } },
      async profile(profile) {
        console.log(`profile started with sub ${profile.sub}`);

        // Check if user exists
        const users = await getUser(profile.email);
        let userId;
        let userType: UserType;

        // If user doesn't exist, create one
        if (users.length === 0) {
          // Create user without password since they're using Entra ID
          await createUser(profile.email, "");
          // Get the newly created user to get their ID
          const [newUser] = await getUser(profile.email);
          userId = newUser.id;
          userType = "user";
        } else {
          userId = users[0].id;
          userType = users[0].type;
        }

        console.log(`profile has id ${userId}`);

        return {
          id: userId,
          email: profile.email,
          name: profile.name,
          type: userType,
          sub: profile.sub, // Store the original sub
          dbId: userId, // Store the database ID in a custom field
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Use the database ID from the custom field
        token.id = user.dbId as string;
        token.type = user.type;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
      }
      return session;
    },
  },
});
