import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, doitRenouveler, sessionCookie, signSession, verifySession } from "@/lib/session";

// Garde d'entrée : tout passe par un cookie de session valide, sauf l'écran du
// code foyer et la sonde de version. Renouvelle le jeton s'il a plus de 30 jours.

const PUBLIQUES = new Set(["/foyer", "/api/version"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  // Même hôte que la requête : Next réécrit la Location en chemin relatif, donc
  // l'origine vue derrière Traefik (adresse d'écoute du conteneur) n'a pas d'effet.
  const rediriger = (chemin: string) => NextResponse.redirect(new URL(chemin, request.url));

  if (pathname === "/") return rediriger(session ? "/semaines" : "/foyer");
  if (PUBLIQUES.has(pathname)) return NextResponse.next();
  if (!session) {
    const res = rediriger("/foyer");
    if (token) res.cookies.set(sessionCookie(""));
    return res;
  }

  const res = NextResponse.next();
  if (doitRenouveler(session)) res.cookies.set(sessionCookie(await signSession(session.fid)));
  return res;
}

export const config = {
  // Tout sauf les internes de Next et les fichiers (un point dans le chemin).
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
