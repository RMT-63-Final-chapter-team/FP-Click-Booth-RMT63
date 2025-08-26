import { ObjectId } from "mongodb";
import { database } from "../config/mongodb";

export class AdminModel {
  static collection() {
    return database.collection("ai");
  }

  static async getAll() {
    return this.collection().find().toArray();
  }

  static async create(aiData: { name: string; prompt: string; icon: string }) {
    if (!aiData.name) {
      throw { message: "Name is required", status: 400 };
    }

    if (!aiData.prompt) {
      throw { message: "Prompt is required", status: 400 };
    }

    if (!aiData.icon) {
      throw { message: "Icon is required", status: 400 };
    }

    const result = await this.collection().insertOne({
      ...aiData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  }

  static async delete(id: ObjectId) {
    const result = await this.collection().deleteOne({ _id: id });
    return result;
  }

  static async update(data: {
    id: ObjectId;
    name?: string;
    prompt?: string;
    icon?: string;
  }) {
    const result = await this.collection().updateOne(
      { _id: data.id },
      {
        $set: {
          name: data.name,
          prompt: data.prompt,
          icon: data.icon,
          updatedAt: new Date(),
        },
      }
    );
    return result;
  }
}
