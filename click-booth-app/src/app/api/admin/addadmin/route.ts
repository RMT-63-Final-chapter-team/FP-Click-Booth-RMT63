import { UserModel } from "@/db/models/UserModel";
import errorHandler from "@/helpers/errHandler";

export async function POST(req: Request) {
  try {
    console.log("hallo");

    const body = await req.json();
    console.log(body);

    const result = await UserModel.createAdmin(body);
    return Response.json({
      message: "Admin added successfully",
      status: 201,
    });
  } catch (error) {
    errorHandler(error);
  }
}
