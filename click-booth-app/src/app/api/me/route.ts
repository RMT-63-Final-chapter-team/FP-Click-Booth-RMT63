import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { UserModel } from "@/db/models/UserModel";
import { ObjectId, WithId } from "mongodb";
import jwt, { JwtPayload } from "jsonwebtoken";
import type { UserType } from "@/type";

export async function GET() {
  try {
    const cookieStore = cookies();
    const auth = (await cookieStore).get("authorization")?.value;
    if (!auth)
      return NextResponse.json({ authenticated: false }, { status: 200 });

    const secret = process.env.JWT_SECRET;
    if (!secret)
      return NextResponse.json({ authenticated: false }, { status: 200 });

    const token = auth.replace(/^Bearer\s+/i, "");
    type TokenPayload = JwtPayload & {
      id?: string;
      email?: string;
      role?: string;
    };
    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, secret) as TokenPayload;
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const userIdFromToken = payload?.id;
    if (!userIdFromToken)
      return NextResponse.json({ authenticated: false }, { status: 200 });

    const col = UserModel.collection();
    let user: WithId<UserType> | null = null;

    try {
      user = (await col.findOne({
        _id: new ObjectId(String(userIdFromToken)),
      })) as WithId<UserType> | null;
    } catch {
      // fallback: try matching raw id value if ObjectId conversion fails
      user = (await col.findOne({
        _id: new ObjectId(String(userIdFromToken)),
      })) as WithId<UserType> | null;
    }

    if (!user)
      return NextResponse.json({ authenticated: false }, { status: 200 });

    return NextResponse.json(
      {
        authenticated: true,
        userId: String(user._id),
        phoneNumber: user.phoneNumber ?? null,
        tokens: user.tokens,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
