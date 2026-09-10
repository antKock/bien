import type { NextConfig } from "next";

// Identifiant de build exposé par /api/version : le SHA git passé par le build
// Docker (GIT_COMMIT_SHA), sinon un horodatage pour les builds locaux.
const BUILD_ID = process.env.GIT_COMMIT_SHA || `t${Date.now()}`;

const nextConfig: NextConfig = {
  // Serveur autonome dans .next/standalone, copié tel quel dans l'image Docker.
  output: "standalone",
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  // Derrière Traefik, HSTS est à poser nous-mêmes. Ignoré en HTTP local.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }],
      },
    ];
  },
};

export default nextConfig;
