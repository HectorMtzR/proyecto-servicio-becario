import path from "node:path";
import { fileURLToPath } from "node:url";

// Raíz explícita del proyecto: evita que Next.js tome como raíz una carpeta
// superior si encuentra otro package-lock.json fuera del repositorio.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
