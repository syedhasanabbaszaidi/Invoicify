import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authConfig } from "./auth.config";
export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(raw) {
                const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(raw);
                if (!parsed.success)
                    return null;
                const [u] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase()));
                if (!u || !u.isActive)
                    return null;
                if (!(await bcrypt.compare(parsed.data.password, u.passwordHash)))
                    return null;
                return { id: String(u.id), name: u.name, email: u.email, role: u.role, freelancerId: u.freelancerId };
            },
        }),
    ],
});
