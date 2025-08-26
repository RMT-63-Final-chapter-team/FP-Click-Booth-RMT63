// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { verifyWithJose } from "./helpers/jwt";
import errorHandler from "./helpers/errHandler";

export const config = {
  // Lindungi API dan semua halaman admin
  matcher: [
    "/api/photos/:path*",
    "/api/admin/:path*",
    "/api/photos",
    "/admin/:path*",
    "/admin",
  ],
};

export default async function middleware(req: NextRequest) {
  try {
    if (req.method === "OPTIONS") return NextResponse.next();

    const { pathname, searchParams } = req.nextUrl;
    const method = req.method;
    const isApi = pathname.startsWith("/api/");
    const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
    const isAdminApi =
      pathname === "/api/admin" || pathname.startsWith("/api/admin/");

    // ==== PUBLIC API (tetap seperti punyamu) ====
    const publicPaths = ["/api/register", "/api/login"];
    const mineParam = searchParams.get("mine");
    const isPhotosListPublic =
      pathname === "/api/photos" && method === "GET" && mineParam !== "true";
    const isPhotoItem = pathname.startsWith("/api/photos/") && method === "GET";

    const isPublicApi =
      publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
      isPhotosListPublic ||
      isPhotoItem;

    // Jika ini API publik → lanjut
    if (isApi && isPublicApi) return NextResponse.next();

    // ==== Ambil token dari Cookie atau Header ====
    const cookieAuth =
      req.cookies.get("authorization") ?? req.cookies.get("Authorization");
    const headerAuth =
      req.headers.get("authorization") ?? req.headers.get("Authorization");
    const raw = cookieAuth?.value ?? headerAuth ?? "";

    if (!raw) return onUnauthorized(isApi, req);

    // Support "Bearer <token>" ATAU langsung "<token>"
    const decoded = decodeURIComponent(raw);
    const parts = decoded.split(" ").filter(Boolean);
    const type = parts.length > 1 ? parts[0] : "";
    const token = parts.length > 1 ? parts.slice(1).join(" ") : parts[0] ?? "";

    if (!token) return onUnauthorized(isApi, req);
    if (type && type.toLowerCase() !== "bearer") {
      return isApi
        ? NextResponse.json(
            { message: "Invalid authorization format" },
            { status: 400 }
          )
        : NextResponse.redirect(new URL("/login", req.url));
    }

    // ==== Verifikasi token (harus compatible Edge) ====
    let payload: any;
    try {
      payload = await verifyWithJose(token);
    } catch (e) {
      if (process.env.NODE_ENV === "development")
        console.log("[middleware] token verify failed", e);
      return onUnauthorized(isApi, req);
    }

    const userId = payload?.id ? String(payload.id) : "";
    console.log("[middleware] userId:", userId);

    const roles: string = payload?.role;
    const isAdmin = roles === "admin";

    // ==== Guard khusus admin ====
    if ((isAdminPage || isAdminApi) && !isAdmin) {
      return onForbidden(isApi, req); // 403 JSON utk API, redirect /403 utk page
    }

    // Teruskan header identitas ke downstream
    const requestHeaders = new Headers(req.headers);
    if (userId) requestHeaders.set("x-user-id", userId);
    if (roles?.length) requestHeaders.set("x-user-roles", roles);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (error) {
    return errorHandler(error);
  }
}

function onUnauthorized(isApi: boolean, req: NextRequest) {
  if (isApi)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const url = new URL("/login", req.url);
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

function onForbidden(isApi: boolean, req: NextRequest) {
  if (isApi)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  return NextResponse.redirect(new URL("/403", req.url));
}
