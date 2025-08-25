import "server-only";
import { cookies } from "next/headers";
import { verifyToken } from "@/helpers/jwt";

export type AuthUser = { id: string; email: string; role: string } | null;

export async function getUserFromCookies(): Promise<AuthUser> {
  const cookieStore = await cookies(); // ✅ Next.js 15 requires await
  const raw =
    cookieStore.get("authorization")?.value ||
    cookieStore.get("Authorization")?.value;

  if (!raw) return null;

  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : raw.trim();
  if (!token) return null;

  try {
    return verifyToken(token) as { id: string; email: string; role: string };
  } catch (err) {
    console.warn("getUserFromCookies: invalid token", err);
    return null;
  }
}
