import { MongoClient } from "mongodb";
const uri = process.env.DATABASE_URI as string;

const client = new MongoClient(uri);

export const database = client.db("click-booth");
