import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Required by the Phase 3 Docker image. */
  output: process.env.VERCEL ? undefined : (process.env.NODE_ENV === "production" ? "standalone" : undefined),

  async rewrites() {
    const patientUrl = process.env.PATIENT_INTERNAL_URL;
    const doctorUrl = process.env.DOCTOR_INTERNAL_URL;
    const workerUrl = process.env.WORKER_INTERNAL_URL;
    const hospitalUrl = process.env.HOSPITAL_INTERNAL_URL;
    const apiUrl = process.env.API_INTERNAL_URL;

    return [
      // Patient app
      ...(patientUrl ? [
        { source: "/patient", destination: `${patientUrl}/patient` },
        { source: "/patient/:path*", destination: `${patientUrl}/patient/:path*` },
      ] : []),

      // Doctor app
      ...(doctorUrl ? [
        { source: "/doctor", destination: `${doctorUrl}/doctor` },
        { source: "/doctor/:path*", destination: `${doctorUrl}/doctor/:path*` },
      ] : []),

      // Health Worker app
      ...(workerUrl ? [
        { source: "/health-worker", destination: `${workerUrl}/health-worker` },
        { source: "/health-worker/:path*", destination: `${workerUrl}/health-worker/:path*` },
      ] : []),

      // Hospital Admin app
      ...(hospitalUrl ? [
        { source: "/hospital-admin", destination: `${hospitalUrl}/hospital-admin` },
        { source: "/hospital-admin/:path*", destination: `${hospitalUrl}/hospital-admin/:path*` },
      ] : []),

      // API
      ...(apiUrl ? [
        { source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` },
        { source: "/health", destination: `${apiUrl}/health` },
      ] : []),
    ];
  },
};


export default nextConfig;
