import { AdminModel } from "@/db/models/AdminModel";
import { ObjectId } from "mongodb";

export async function GET() {
  const data = await AdminModel.getAll();
  return Response.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, prompt, icon } = body;

    const newAi = await AdminModel.create({ name, prompt, icon });
    return Response.json(
      { message: "AI created successfully", data: newAi },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating AI:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json({ message: "ID is required" }, { status: 400 });
    }
    const result = await AdminModel.delete(new ObjectId(id));
    return Response.json(
      { message: "AI deleted successfully", data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting AI:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, prompt, icon } = body;
    if (!id) {
      return Response.json({ message: "ID is required" }, { status: 400 });
    }

    // Validasi input
    if (!name) {
      return Response.json({ message: "Name is required" }, { status: 400 });
    }
    if (!prompt) {
      return Response.json({ message: "Prompt is required" }, { status: 400 });
    }
    if (!icon) {
      return Response.json({ message: "Icon is required" }, { status: 400 });
    }

    const result = await AdminModel.update({
      id: new ObjectId(id),
      name,
      prompt,
      icon,
    });

    return Response.json(
      { message: "AI updated successfully", data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating AI:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
