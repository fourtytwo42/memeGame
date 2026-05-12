import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, findUserByIdentifier, roleForEmail } from "@meme-foundry/db";
import { compare } from "bcryptjs";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1)
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    role: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Username or email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await findUserByIdentifier(parsed.data.identifier);
        if (!user?.passwordHash) return null;

        const validPassword = await compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!validPassword) return null;

        const role = roleForEmail(user.email) === "admin" ? "admin" : user.role;
        if (role !== user.role) {
          await prisma.user.update({ where: { id: user.id }, data: { role } });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.username,
          image: user.image,
          username: user.username,
          role
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id ?? "");
      session.user.username = String(token.username ?? "");
      session.user.role = String(token.role ?? "user");
      return session;
    }
  }
});
