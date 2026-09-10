import { beforeEach, describe, expect, it } from "vitest";
import {
  COOKIE_NAME,
  SESSION_MAX_AGE_S,
  SESSION_RENEW_AFTER_S,
  doitRenouveler,
  sessionCookie,
  signSession,
  verifySession,
} from "./session";

beforeEach(() => {
  process.env.SESSION_SIGNING_SECRET = "secret-de-test-d-au-moins-trente-deux-caracteres";
});

describe("signSession / verifySession", () => {
  it("fait l'aller-retour d'un id de foyer", async () => {
    const avant = Math.floor(Date.now() / 1000);
    const session = await verifySession(await signSession("foyer-1"));
    expect(session?.fid).toBe("foyer-1");
    expect(session?.iat).toBeGreaterThanOrEqual(avant);
  });

  it("refuse un jeton altéré, vide ou quelconque", async () => {
    const token = await signSession("foyer-1");
    expect(await verifySession(token.slice(0, -4) + "XXXX")).toBeNull();
    expect(await verifySession("")).toBeNull();
    expect(await verifySession("pas.un.jwt")).toBeNull();
  });

  it("refuse un jeton signé avec un autre secret", async () => {
    const token = await signSession("foyer-1");
    process.env.SESSION_SIGNING_SECRET = "un-autre-secret-d-au-moins-trente-deux-caracteres";
    expect(await verifySession(token)).toBeNull();
  });

  it("exige un secret d'au moins 32 caractères", async () => {
    process.env.SESSION_SIGNING_SECRET = "court";
    await expect(signSession("foyer-1")).rejects.toThrow();
  });
});

describe("sessionCookie", () => {
  it("pose un cookie httpOnly de 180 jours", () => {
    const c = sessionCookie("jeton");
    expect(c.name).toBe(COOKIE_NAME);
    expect(c.httpOnly).toBe(true);
    expect(c.sameSite).toBe("lax");
    expect(c.maxAge).toBe(SESSION_MAX_AGE_S);
  });

  it("efface le cookie quand la valeur est vide", () => {
    expect(sessionCookie("").maxAge).toBe(0);
  });
});

describe("doitRenouveler", () => {
  it("renouvelle après 30 jours seulement", () => {
    const iat = 1_000_000;
    expect(doitRenouveler({ fid: "f", iat }, iat + SESSION_RENEW_AFTER_S - 1)).toBe(false);
    expect(doitRenouveler({ fid: "f", iat }, iat + SESSION_RENEW_AFTER_S + 1)).toBe(true);
  });
});
