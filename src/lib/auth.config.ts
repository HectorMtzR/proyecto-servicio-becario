import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Rutas públicas
      if (pathname === "/login") {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // Todo lo demás requiere autenticación
      if (!isLoggedIn) return false;

      // Ruta de cambio de contraseña — siempre permitida si está autenticado
      if (pathname === "/cambiar-password") {
        return true;
      }

      // Forzar cambio de contraseña antes de acceder a cualquier otra ruta
      if (auth?.user?.mustChangePassword) {
        return Response.redirect(new URL("/cambiar-password", nextUrl));
      }

      // Protección por rol
      const role = auth?.user?.role;

      if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (pathname.startsWith("/jefe") && role !== "JEFE_SERVICIO") {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (pathname.startsWith("/alumno") && role !== "ALUMNO") {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id                 = token.id as string;
        session.user.role               = token.role as import("@prisma/client").Role;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as import("next-auth").User & {
          role: import("@prisma/client").Role;
          mustChangePassword: boolean;
        };
        token.id                 = u.id ?? "";
        token.role               = u.role;
        token.mustChangePassword = u.mustChangePassword;
      }
      return token;
    },
  },
  providers: [], // defined in auth.ts
};
