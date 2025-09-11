import { UserModel } from "@/db/models/UserModel";
import errorHandler from "@/helpers/errHandler";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await UserModel.createAdmin(body);
    return Response.json({
      message: "Admin added successfully",
      status: 201,
    });
  } catch (error) {
    return errorHandler(error);
  }
}
