import { AdminModel } from "@/db/models/AdminModel";
import errorHandler from "@/helpers/errHandler";

export async function GET(request: Request) {
  try {
    const data = await AdminModel.getAll();
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    return errorHandler(error);
  }
}
