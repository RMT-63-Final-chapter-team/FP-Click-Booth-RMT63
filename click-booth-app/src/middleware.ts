import { NextResponse, type NextRequest } from "next/server";
import errorHandler from "./helpers/errHandler";
import { cookies } from "next/headers";
import { verifyWithJose } from "./helpers/jwt";

export default async function middleware(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;

    const publicPaths = ["/api/register", "/api/login", "/api/photos"];
    const isPublic = publicPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isPublic) {
      return NextResponse.next();
    }

    const cookieStore = await cookies();
    const authorization = cookieStore.get("authorization");
    if (!authorization) {
      throw { message: "Unauthorized", status: 401 };
    }

    const [type, token] = authorization.value.split(" ");
    if (type !== "Bearer" || !token) {
      throw { message: "Invalid authorization format", status: 400 };
    }

    const payload = await verifyWithJose(token);
    if (!payload || !payload.id) {
      throw { message: "Invalid token payload", status: 401 };
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.id);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  } catch (error) {
    return errorHandler(error);
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
