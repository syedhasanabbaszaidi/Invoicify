// Edge-safe config (no DB / bcrypt) used by middleware.
export const authConfig = {
    pages: { signIn: "/login" },
    session: { strategy: "jwt" },
    providers: [],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const user = auth?.user;
            const path = nextUrl.pathname;
            if (path === "/login")
                return user ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
            if (!user)
                return false;
            const adminOnly = ["/invoices/generate", "/customers", "/services", "/users"];
            if (user.role !== "ADMIN" && adminOnly.some((p) => path.startsWith(p))) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }
            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.freelancerId = user.freelancerId ?? null;
                token.uid = Number(user.id);
            }
            return token;
        },
        session({ session, token }) {
            session.user.role = token.role;
            session.user.freelancerId = token.freelancerId ?? null;
            session.user.uid = token.uid;
            return session;
        },
    },
};
