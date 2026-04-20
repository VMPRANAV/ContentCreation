import { getDb } from "../db/mongo.js";

class Chunk {
  static collection() {
    return getDb().collection("chunks");
  }

  static async insertMany(docs) {
    if (!Array.isArray(docs) || docs.length === 0) {
      return { insertedCount: 0 };
    }

    return this.collection().insertMany(docs);
  }

  static async vectorSearchByFile({
    fileId,
    queryVector,
    index = "vector_index",
    limit = 5,
    numCandidates = 100
  }) {
    return this.collection()
      .aggregate([
        {
          $vectorSearch: {
            index,
            path: "embedding",
            queryVector,
            numCandidates,
            limit,
            filter: {
              fileId: String(fileId)
            }
          }
        },
        {
          $project: {
            _id: 1,
            fileId: 1,
            userId: 1,
            text: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ])
      .toArray();
  }
}

export default Chunk;
