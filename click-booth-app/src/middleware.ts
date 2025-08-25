import { NextResponse, type NextRequest } from "next/server";

import { cookies } from "next/headers";
import { verifyWithJose } from "./helpers/jwt";
import errorHandler from "./helpers/errHandler";

export default async function middleware(req: NextRequest) {
  try {
    // allow CORS preflight
    if (req.method === "OPTIONS") return NextResponse.next();

    const pathname = req.nextUrl.pathname;
    const method = req.method;

    // public routes: adjust as needed
    const publicPaths = ["/api/register", "/api/login"];

    // allow GET /api/photos as public only when mine !== "true"
    const mineParam = req.nextUrl.searchParams.get("mine");
    const isPhotosListPublic =
      pathname === "/api/photos" && method === "GET" && mineParam !== "true";

    // allow public GET for single photo item: /api/photos/:id
    const isPhotoItem = pathname.startsWith("/api/photos/") && method === "GET";

    const isPublic =
      publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
      isPhotosListPublic ||
      isPhotoItem;

    if (isPublic) {
      if (process.env.NODE_ENV === "development")
        console.log(
          `[middleware] allowing public route: ${method} ${pathname}`
        );
      return NextResponse.next();
    }

    // read cookie store (supports server runtime)
    const cookieStore = await cookies();
    const rawCookie =
      cookieStore.get("authorization") ??
      cookieStore.get("Authorization") ??
      null;
    if (!rawCookie) {
      if (process.env.NODE_ENV === "development")
        console.log("[middleware] auth cookie missing");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // cookie may be URL-encoded (e.g. "Bearer%20<token>") — decode first
    const decoded = decodeURIComponent(rawCookie.value ?? "");
    const parts = decoded.split(" ").filter(Boolean);
    let token = "";
    let type = "";

    if (parts.length === 1) {
      token = parts[0];
    } else {
      type = parts[0];
      token = parts.slice(1).join(" ");
    }

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // if type present, enforce Bearer (case-insensitive)
    if (type && type.toLowerCase() !== "bearer") {
      if (process.env.NODE_ENV === "development")
        console.log("[middleware] invalid token type:", type);
      return NextResponse.json(
        { message: "Invalid authorization format" },
        { status: 400 }
      );
    }

    // verify token (ensure verifyWithJose works in this runtime)
    let payload: any = null;
    try {
      payload = await verifyWithJose(token);
    } catch (e) {
      if (process.env.NODE_ENV === "development")
        console.log("[middleware] token verify failed", e);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = payload?.id ? String(payload.id) : "";
    const requestHeaders = new Headers(req.headers);
    if (userId) requestHeaders.set("x-user-id", userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return errorHandler(error);
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
