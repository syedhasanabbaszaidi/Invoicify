/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep react-pdf and pdf-lib as native Node requires on Vercel serverless functions
  serverExternalPackages: ["@react-pdf/renderer", "pdf-lib", "bcryptjs"],
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
