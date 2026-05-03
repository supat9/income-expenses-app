import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { upsertUser } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account && user?.email) {
        try {
          const userId = await upsertUser({
            email: user.email,
            name: user.name ?? (profile as any)?.name ?? null,
            image: user.image ?? null,
          });
          token.userId = userId;
          token.email = user.email;
        } catch (e) {
          console.error("upsertUser failed:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? "";
      }
      return session;
    },
  },
};
