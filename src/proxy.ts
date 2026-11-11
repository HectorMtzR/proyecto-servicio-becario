import NextAuth from "next-auth";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Next.js 16: "proxy" reemplaza a "middleware" (mismo comportamiento).
// La autorización por rol y el cambio de contraseña obligatorio viven en
// el callback `authorized` de auth.config.ts.
const { auth } = NextAuth(authConfig);

const authHandler = auth as unknown as (
  req: NextRequest,
  event: NextFetchEvent,
) => Promise<Response | undefined>;

export function proxy(req: NextRequest, event: NextFetchEvent) {
  return authHandler(req, event);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
