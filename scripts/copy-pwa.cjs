const fs = require("fs");
const path = require("path");
const { generateSW } = require("workbox-build");

const root = path.resolve(__dirname, "..");
const outputPublic = path.join(root, ".output", "public");

async function main() {
  if (!fs.existsSync(outputPublic)) {
    throw new Error(`Diretório não encontrado: ${outputPublic}`);
  }

  console.log("🔎 Gerando Service Worker a partir de .output/public...");

  const result = await generateSW({
    swDest: path.join(outputPublic, "sw.js"),

    globDirectory: outputPublic,

    globPatterns: [
      "**/*.{js,css,html,wasm,png,svg,ico,webmanifest,jpg,jpeg}"
    ],

    // Importante:
    // Este projeto usa TanStack + Nitro SSR.
    // Não existe /index.html estático para NavigationRoute.
    navigateFallback: undefined,

    skipWaiting: true,
    clientsClaim: true,

    cleanupOutdatedCaches: true,

    sourcemap: true,

    runtimeCaching: [
      {
        urlPattern: ({ request }) =>
          request.destination === "style" ||
          request.destination === "script" ||
          request.destination === "worker",

        handler: "StaleWhileRevalidate",

        options: {
          cacheName: "static-resources",
        },
      },

      {
        urlPattern: ({ request }) =>
          request.destination === "image",

        handler: "CacheFirst",

        options: {
          cacheName: "images",

          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  });

  console.log("✅ Service Worker gerado.");
  console.log(`📦 Arquivos precacheados: ${result.count}`);
  console.log(`💾 Tamanho do precache: ${result.size} bytes`);

  const swPath = path.join(outputPublic, "sw.js");

  const sw = fs.readFileSync(swPath, "utf8");

  const match = sw.match(/workbox-[A-Za-z0-9_-]+\.js/);

  if (match) {
    const workboxFile = match[0];
    const workboxPath = path.join(outputPublic, workboxFile);

    if (fs.existsSync(workboxPath)) {
      console.log(`✅ Workbox encontrado: ${workboxFile}`);
    } else {
      throw new Error(
        `Workbox referenciado pelo SW não existe: ${workboxFile}`
      );
    }
  } else {
    console.log("ℹ️ Workbox não foi referenciado diretamente pelo SW.");
  }

  console.log("🚀 PWA finalizado em .output/public");
}

main().catch((error) => {
  console.error("❌ Erro ao gerar PWA:");
  console.error(error);
  process.exit(1);
});