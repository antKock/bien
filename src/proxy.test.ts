import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { proxy } from "./proxy";
import { COOKIE_NAME, SESSION_RENEW_AFTER_S, signSession } from "./lib/session";

beforeEach(() => {
  process.env.SESSION_SIGNING_SECRET = "secret-de-test-d-au-moins-trente-deux-caracteres";
});

const requete = (chemin: string, cookie?: string) =>
  new NextRequest(`http://bien.test${chemin}`, { headers: cookie ? { cookie: `${COOKIE_NAME}=${cookie}` } : {} });

describe("proxy", () => {
  it("envoie la racine vers l'écran du code sans session, vers Semaines avec", async () => {
    expect((await proxy(requete("/"))).headers.get("location")).toBe("http://bien.test/foyer");
    const jeton = await signSession("foyer-1");
    expect((await proxy(requete("/", jeton))).headers.get("location")).toBe("http://bien.test/semaines");
  });

  it("laisse passer l'écran du code et la sonde de version sans session", async () => {
    expect((await proxy(requete("/foyer"))).status).toBe(200);
    expect((await proxy(requete("/api/version"))).status).toBe(200);
  });

  it("renvoie un onglet vers l'écran du code sans session, et efface un cookie invalide", async () => {
    const res = await proxy(requete("/semaines", "jeton-falsifie"));
    expect(res.headers.get("location")).toBe("http://bien.test/foyer");
    expect(res.cookies.get(COOKIE_NAME)?.value).toBe("");
  });

  it("laisse passer un onglet avec une session valide, sans la re-signer si elle est récente", async () => {
    const res = await proxy(requete("/semaines", await signSession("foyer-1")));
    expect(res.status).toBe(200);
    expect(res.cookies.get(COOKIE_NAME)).toBeUndefined();
  });

  it("re-signe une session de plus de 30 jours", async () => {
    const { SignJWT } = await import("jose");
    const ancien = await new SignJWT({ fid: "foyer-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - SESSION_RENEW_AFTER_S - 60)
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode(process.env.SESSION_SIGNING_SECRET));
    const res = await proxy(requete("/semaines", ancien));
    expect(res.status).toBe(200);
    expect(res.cookies.get(COOKIE_NAME)?.value).toBeTruthy();
  });
});
