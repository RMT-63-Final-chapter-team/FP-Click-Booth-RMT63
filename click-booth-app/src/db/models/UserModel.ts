import { database } from "../config/mongodb";
import * as z from "zod";
import { hashPassword } from "@/helpers/bcrypt";
import { UserType } from "@/type";
import { ObjectId } from "mongodb";

const UserSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username minimum length is 3 characters" }),
  fullName: z
    .string()
    .min(3, { message: "Full name minimum length is 3 characters" }),
  email: z.string().email("Invalid email format"),
  phoneNumber: z
    .string()
    .min(7, { message: "Phone number must be at least 7 characters long" }),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export class UserModel {
  static collection() {
    return database.collection<UserType>("Users");
  }

  static async createUser(userData: UserType) {
    UserSchema.parse(userData);

    const { email, username, phoneNumber, password, fullName } = userData;

    const existingUserByEmail = await this.findUserByEmail(email);
    if (existingUserByEmail) {
      throw {
        message: "Email already exists",
        status: 400,
      };
    }

    const existingUserByUsername = await this.findUserByUsername(username);
    if (existingUserByUsername) {
      throw {
        message: "Username already exists",
        status: 400,
      };
    }

    const existingUserByPhoneNumber = await this.findUserByPhoneNumber(
      phoneNumber
    );
    if (existingUserByPhoneNumber) {
      throw {
        message: "Phone number already exists",
        status: 400,
      };
    }

    const hashedPassword = hashPassword(userData.password);
    userData.password = hashedPassword;

    const result = await this.collection().insertOne({
      ...userData,
      tokens: 1,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (!result.acknowledged) {
      throw {
        message: "Failed to create user",
        status: 500,
      };
    }

    return {
      username: userData.username,
    };
  }

  static async findUserByEmail(email: string) {
    const user = await this.collection().findOne({ email });
    return user;
  }

  static async findUserByUsername(username: string) {
    const user = await this.collection().findOne({ username });
    return user;
  }

  static async findUserByPhoneNumber(phoneNumber: string) {
    const user = await this.collection().findOne({ phoneNumber });
    return user;
  }

  static async incrementToken(userId: string, amount: number) {
    return (await this.collection()).updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { tokens: amount } }
    );
  }

  static async decrementToken(userId: string) {
    const user = await this.collection().findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw { message: "User not found", status: 404 };
    }

    if (user.tokens <= 0) {
      throw { message: "Insufficient tokens", status: 400 };
    }

    return (await this.collection()).updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { tokens: -1 } }
    );
  }
}
