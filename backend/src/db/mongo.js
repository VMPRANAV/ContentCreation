import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

let client;
let db;

export const connectToMongo = async () => {
  if (db) return db;

  client = new MongoClient(env.mongoUri);
  await client.connect();
  db = client.db(env.dbName);

  console.log(`[db] Connected to MongoDB database: ${env.dbName}`);
  return db;
};

export const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectToMongo() first.");
  }
  return db;
};

export const closeMongoConnection = async () => {
  if (client) {
    await client.close();
    db = undefined;
    client = undefined;
  }
};
