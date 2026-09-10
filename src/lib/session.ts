import { SignJWT, jwtVerify } from "jose";

// Session par cookie signé, reprise de Mijote : un JWT HS256 qui porte l'id du
// foyer. Seul ce fichier importe jose.
//
// Session glissante : le jeton expire après 180 jours, mais le proxy le
// re-signe à chaque requête dès qu'il a plus de 30 jours. Avec un usage
// hebdomadaire, un téléphone ne ressaisit jamais son code.

export const COOKIE_NAME = "bien_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 180;
export const SESSION_RENEW_AFTER_S = 60 * 60 * 24 * 30;

export type Session = { fid: string; iat: number };

export type CookieOptions = {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
  path: string;
};

function secret(): Uint8Array {
  const s = process.env.SESSION_SIGNING_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SIGNING_SECRET doit faire au moins 32 caractères");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(fid: string): Promise<string> {
  return new SignJWT({ fid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_S}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const fid = payload["fid"];
    const iat = payload["iat"];
    if (typeof fid !== "string" || typeof iat !== "number") return null;
    return { fid, iat };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string): CookieOptions {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: token ? SESSION_MAX_AGE_S : 0,
    path: "/",
  };
}

export function doitRenouveler(session: Session, maintenantS = Date.now() / 1000): boolean {
  return maintenantS - session.iat > SESSION_RENEW_AFTER_S;
}
