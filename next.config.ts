import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Serwist injeta um `webpack` para o build de produção (§21 — PWA); em dev
  // isso fica desligado (`disable` abaixo), mas o Next 16 detecta a chave
  // `webpack` presente e recusa rodar sob Turbopack por segurança. Um
  // `turbopack: {}` vazio confirma "sim, sei o que estou fazendo".
  turbopack: {},
  // pdfkit lê as fontes padrão (Helvetica etc.) do disco via `__dirname` em
  // tempo de execução — empacotado pelo bundler, `__dirname` vira um caminho
  // virtual que não existe. Mantendo fora do bundle, roda como módulo Node
  // normal e acha os arquivos de verdade.
  serverExternalPackages: ["pdfkit"],
  images: {
    // Imagens de cartão de crédito (Cartões de Crédito) ficam no bucket
    // público `credit-card-images` do Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "zfugldawxhvzclooisqj.supabase.co", pathname: "/storage/v1/**" }],
  },
};

// Serwist ainda não suporta Turbopack nativamente (o default do Next 16).
// `disable` em dev, mais `npm run build --webpack` na produção, é a
// combinação que o próprio pacote recomenda para esse caso.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

export default withSerwist(nextConfig);
