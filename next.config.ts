import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Serwist injeta um `webpack` pro build de produção (§21 — PWA); em dev
  // isso fica desligado (`disable` abaixo), mas o Next 16 detecta a chave
  // `webpack` presente e recusa rodar sob Turbopack por segurança. Um
  // `turbopack: {}` vazio confirma "sim, sei o que estou fazendo".
  turbopack: {},
};

// Serwist ainda não suporta Turbopack nativamente (o default do Next 16).
// `disable` em dev, mais `npm run build --webpack` na produção, é a
// combinação que o próprio pacote recomenda pra esse caso.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

export default withSerwist(nextConfig);
