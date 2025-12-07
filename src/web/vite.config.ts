import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

/**
 * Build Modes:
 *
 * - Default (cloud): npm run build
 *   Sets __CLOUD__=true, __ESP32__=false
 *   For cloud.brewos.io deployment
 *   Demo mode enabled for website visitors
 *
 * - ESP32: npm run build:esp32 (or --mode esp32)
 *   Sets __ESP32__=true, __CLOUD__=false
 *   For ESP32 local deployment
 *   Demo mode disabled (real hardware)
 *   Outputs to ../esp32/data with aggressive minification
 *
 * Environment Variables:
 * - RELEASE_VERSION: Set by CI during release builds (e.g., "0.2.0")
 * - VITE_ENVIRONMENT: "staging" or "production"
 */

/**
 * Plugin to inject build version into service worker
 * This ensures the service worker cache is invalidated on every new build,
 * preventing stale JavaScript from being served.
 * 
 * For builds: Injects version at closeBundle
 * For dev: Injects version on server start and updates public/sw.js directly
 */
function serviceWorkerVersionPlugin(version: string, isDev: boolean): Plugin {
  const generateCacheVersion = () => {
    const buildTime = new Date().toISOString().replace(/[:.]/g, "-");
    return `${version}-${buildTime}`;
  };

  const injectVersion = (swPath: string) => {
    if (!fs.existsSync(swPath)) {
      console.warn("[SW Plugin] sw.js not found, skipping version injection");
      return;
    }

    const cacheVersion = generateCacheVersion();
    let content = fs.readFileSync(swPath, "utf-8");
    
    // Replace the placeholder with actual version
    content = content.replace(
      /const CACHE_VERSION = "[^"]+";/,
      `const CACHE_VERSION = "${cacheVersion}";`
    );
    
    // Mark dev mode in the SW
    if (isDev) {
      content = content.replace(
        /const IS_DEV_MODE = [^;]+;/,
        `const IS_DEV_MODE = true;`
      );
    }

    fs.writeFileSync(swPath, content);
    console.log(`[SW Plugin] Injected cache version: ${cacheVersion} (dev: ${isDev})`);
  };

  return {
    name: "sw-version-inject",
    apply: isDev ? undefined : "build", // Run in both dev and build
    
    // For dev server: update on start
    configureServer(server) {
      if (isDev) {
        const swPath = path.resolve(__dirname, "public", "sw.js");
        injectVersion(swPath);
        
        // Watch for changes to sw.js and re-inject (useful during SW development)
        server.watcher.on('change', (file) => {
          if (file.endsWith('sw.js')) {
            setTimeout(() => injectVersion(swPath), 100);
          }
        });
      }
    },
    
    // For builds: inject at closeBundle
    closeBundle() {
      if (!isDev) {
        const swPath = path.resolve(__dirname, "dist", "sw.js");
        injectVersion(swPath);
      }
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const isEsp32 = mode === "esp32";
  const isDev = command === "serve";
  const env = loadEnv(mode, process.cwd(), "");

  // Version from RELEASE_VERSION env var (set by CI) or 'dev' for local builds
  const version = process.env.RELEASE_VERSION || "dev";
  const environment = env.VITE_ENVIRONMENT || "development";

  return {
    plugins: [
      react(),
      // Inject version into service worker (all modes except ESP32)
      !isEsp32 && serviceWorkerVersionPlugin(version, isDev),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Compile-time constants
    define: {
      __ESP32__: isEsp32,
      __CLOUD__: !isEsp32,
      __VERSION__: JSON.stringify(version),
      __ENVIRONMENT__: JSON.stringify(environment),
    },
    build: {
      outDir: isEsp32 ? "../esp32/data" : "dist",
      emptyOutDir: true,
      minify: isEsp32 ? "terser" : "esbuild",
      terserOptions: isEsp32
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
      rollupOptions: {
        output: {
          manualChunks: isEsp32
            ? undefined
            : {
                vendor: ["react", "react-dom", "react-router-dom"],
              },
        },
      },
    },
    publicDir: "public",
    server: {
      port: 3000,
      headers: {
        // Allow Google Sign-In popup to communicate back
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      },
      proxy: {
        "/ws": {
          // Use localhost:3001 for local cloud dev, brewos.local for ESP32 dev
          target: isEsp32 ? "ws://brewos.local" : "ws://localhost:3001",
          ws: true,
        },
        "/api": {
          target: isEsp32 ? "http://brewos.local" : "http://localhost:3001",
        },
      },
    },
  };
});
