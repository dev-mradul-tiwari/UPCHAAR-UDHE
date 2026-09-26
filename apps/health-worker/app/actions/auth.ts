"use server";

import { cookies } from "next/headers";
import { prisma } from "@upchaar/db";
import { redirect } from "next/navigation";

import bcrypt from "bcryptjs";



export async function login(formData: FormData) {
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  if (!phone || !password) {
    redirect("/login?error=Missing+fields");
  }

  // Find the worker
  const worker = await prisma.healthWorker.findUnique({
    where: { phone },
  });

  if (!worker || !bcrypt.compareSync(password, worker.passwordHash)) {
    redirect("/login?error=Invalid+credentials");
  }

  // Set a secure HTTP-only cookie with the worker ID
  const cookieStore = await cookies();
  cookieStore.set("worker_session", worker.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("worker_session");
  redirect("/login");
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("worker_session")?.value;
  
  if (!sessionId) return null;

  const worker = await prisma.healthWorker.findUnique({
    where: { id: sessionId },
    select: { id: true, name: true, role: true, region: true },
  });

  return worker;
}
