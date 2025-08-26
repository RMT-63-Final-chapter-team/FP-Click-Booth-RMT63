import { UserModel } from "@/db/models/UserModel";
import { comparePassword } from "@/helpers/bcrypt";
import errorHandler from "@/helpers/errHandler";

import { signToken } from "@/helpers/jwt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email) {
      throw { message: "Email is required", status: 400 };
    }

    if (!password) {
      throw { message: "Password is required", status: 400 };
    }

    const user = await UserModel.findUserByEmail(email);
    if (!user) {
      throw { message: "User not found", status: 404 };
    }

    const isPasswordValid = comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw { message: "Invalid password", status: 401 };
    }

    // generate token

    const token = signToken({
      id: (user as any)._id?.toString() ?? (user as any).id ?? "",
      email: user.email,
      role: user.role,
    });

    // set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "authorization",
      value: `Bearer ${token}`,
      httpOnly: false, // Allow JavaScript access for client-side authentication
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // balikin user info langsung
    return NextResponse.json(
      {
        message: "Login successful",
        access_token: token,
        user: {
          id: (user as any)._id?.toString() ?? (user as any).id ?? "",
          email: user.email,
          phoneNumber: (user as any).phoneNumber ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return errorHandler(error);
  }
}
