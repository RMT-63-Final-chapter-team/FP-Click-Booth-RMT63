export type AuthUser = { id: string; email: string; role: string } | null;

function decodeJwtPayload(
  token: string
): { id?: string; email?: string; role?: string; exp?: number } | null {
  try {
    // Split the token into parts
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed for base64 decoding
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);

    // Decode base64url to string
    const decodedPayload = atob(
      paddedPayload.replace(/-/g, "+").replace(/_/g, "/")
    );

    return JSON.parse(decodedPayload);
  } catch (err) {
    console.warn("Failed to decode JWT payload:", err);
    return null;
  }
}

export function getUserFromCookiesClient(): AuthUser {
  if (typeof window === "undefined") {
    console.log("getUserFromCookiesClient: Not in browser environment");
    return null; // Not in browser environment
  }

  // Get all cookies from browser
  const allCookies = document.cookie;
  console.log("getUserFromCookiesClient: All cookies string:", allCookies);

  if (!allCookies || allCookies.trim() === "") {
    console.log(
      "getUserFromCookiesClient: No cookies found in document.cookie"
    );
    return null;
  }

  const cookies = allCookies.split(";");
  console.log("getUserFromCookiesClient: Parsed cookies:", cookies);

  let token = null;

  // Find authorization cookie
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    console.log(
      `getUserFromCookiesClient: Checking cookie - "${name}": "${value}"`
    );

    if (name === "authorization" || name === "Authorization") {
      token = value.startsWith("Bearer%20")
        ? decodeURIComponent(value).slice(7)
        : value.startsWith("Bearer ")
        ? value.slice(7)
        : value;
      console.log(
        "getUserFromCookiesClient: Found auth token:",
        token ? "EXISTS" : "NULL"
      );
      break;
    }
  }

  if (!token) {
    console.log(
      "getUserFromCookiesClient: No authorization token found in cookies"
    );
    console.log(
      "getUserFromCookiesClient: This might be because the cookie is httpOnly"
    );
    console.log(
      "getUserFromCookiesClient: Please login again to set a new accessible cookie"
    );
    return null;
  }

  try {
    console.log("getUserFromCookiesClient: Attempting to decode token...");
    const payload = decodeJwtPayload(token);
    console.log("getUserFromCookiesClient: Decoded payload:", payload);

    if (!payload || !payload.id || !payload.email) {
      console.log("getUserFromCookiesClient: Invalid payload structure");
      return null;
    }

    const user = {
      id: payload.id,
      email: payload.email,
      role: payload.role || "user",
    };
    console.log("getUserFromCookiesClient: Returning user:", user);
    return user;
  } catch (err) {
    console.warn("getUserFromCookiesClient: invalid token", err);
    return null;
  }
}

export function getAuthTokenFromCookies(): string | null {
  if (typeof window === "undefined") {
    console.log("getAuthTokenFromCookies: Not in browser environment");
    return null; // Not in browser environment
  }

  const cookies = document.cookie.split(";");
  console.log("getAuthTokenFromCookies: All cookies:", document.cookie);

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    console.log(`getAuthTokenFromCookies: Checking cookie - ${name}: ${value}`);

    if (name === "authorization" || name === "Authorization") {
      const token = value.startsWith("Bearer%20")
        ? decodeURIComponent(value).slice(7)
        : value.startsWith("Bearer ")
        ? value.slice(7)
        : value;
      console.log(
        "getAuthTokenFromCookies: Found token:",
        token ? "EXISTS" : "NULL"
      );
      return token;
    }
  }

  console.log("getAuthTokenFromCookies: No token found");
  return null;
}
