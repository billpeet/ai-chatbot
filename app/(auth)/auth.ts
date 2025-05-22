import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import EntraIdProvider from "next-auth/providers/microsoft-entra-id";
import { createGuestUser, getUser, createUser } from "@/lib/db/queries";
import { authConfig } from "./auth.config";
import { DUMMY_PASSWORD } from "@/lib/constants";
import type { DefaultJWT } from "next-auth/jwt";

export type UserType = "guest" | "regular";

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

        // If user doesn't exist, create one
        if (users.length === 0) {
          // Create user without password since they're using Entra ID
          await createUser(profile.email, "");
          // Get the newly created user to get their ID
          const [newUser] = await getUser(profile.email);
          userId = newUser.id;
        } else {
          userId = users[0].id;
        }

        console.log(`profile has id ${userId}`);

        return {
          id: userId,
          email: profile.email,
          name: profile.name,
          type: "regular",
          sub: profile.sub, // Store the original sub
          dbId: userId, // Store the database ID in a custom field
        };
      },
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: "regular" };
      },
    }),
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: "guest" };
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
