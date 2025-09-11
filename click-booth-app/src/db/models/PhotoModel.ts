import { database } from "@/db/config/mongodb";
import { NewPhotoInput, Photo, PhotoDoc } from "@/type";
import { ObjectId as MongoObjectId } from "mongodb";

function mapDocToPhoto(doc: PhotoDoc): Photo {
  return {
    _id: doc._id,
    userId: doc.userId || null,
    url: doc.url,
    publicId: doc.publicId ?? undefined,
    imageUrl: doc.imageUrl ?? doc.url,
    frame: doc.frame,
    stickers: doc.stickers ?? [],
    watermark: doc.watermark,
    filter: doc.filter ?? null,
    shots: doc.shots ?? null,
    layout: doc.layout ?? null,
    images: doc.images ?? [],
    enhancedUrl: doc.enhancedUrl,
    aiEnhanced: doc.aiEnhanced ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class PhotoModel {
  static collection() {
    return database.collection<PhotoDoc>("Photos");
  }

  // ensure indexes for performance (call once at app startup)
  static async initIndexes() {
    try {
      await this.collection().createIndex({ userId: 1 });
      await this.collection().createIndex({ createdAt: -1 });
      // unique index on publicId (only for documents that have publicId)
      await this.collection().createIndex(
        { publicId: 1 },
        {
          unique: true,
          partialFilterExpression: { publicId: { $exists: true } },
        }
      );
    } catch (e) {
      // non-fatal; log for debug
      console.error(
        "PhotoModel.initIndexes error:",
        (e as Error)?.message ?? e
      );
    }
  }
  static async createPhoto(input: NewPhotoInput): Promise<Photo> {
    // If upload provided a publicId, return existing doc first to avoid duplicates
    if (input.publicId) {
      const existing = await this.collection().findOne({
        publicId: input.publicId,
      });
      if (existing) return mapDocToPhoto(existing);
    }

    const now = new Date();
    const doc: PhotoDoc = {
      userId: input.userId ? new MongoObjectId(input.userId) : null,
      url: input.url,
      publicId: input.publicId ?? undefined,
      imageUrl: input.url,
      frame: input.frame ?? "",
      stickers: input.stickers ?? [],
      watermark: input.watermark ?? "",
      filter: input.filter ?? null,
      shots: typeof input.shots === "number" ? input.shots : null,
      layout: input.layout ?? null,
      images: input.images ?? [],
      enhancedUrl: input.enhancedUrl ?? input.url,
      aiEnhanced: input.aiEnhanced ?? false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await this.collection().insertOne(doc);
      if (!result.acknowledged)
        throw { message: "Failed to save photo", status: 500 };
      const savedDoc: PhotoDoc = { ...doc, _id: result.insertedId };
      return mapDocToPhoto(savedDoc);
    } catch (err) {
      // handle duplicate key race (publicId unique index)
      if ((err as { code?: number })?.code === 11000 && input.publicId) {
        const existing = await this.collection().findOne({
          publicId: input.publicId,
        });
        if (existing) return mapDocToPhoto(existing);
      }
      throw err;
    }
  }
  static async findById(id: string): Promise<Photo | null> {
    try {
      const _id = new MongoObjectId(id);
      const doc = await this.collection().findOne({ _id });
      if (!doc) return null;
      return mapDocToPhoto(doc);
    } catch {
      return null;
    }
  }

  static async findByUserId(userId: string): Promise<Photo[]> {
    try {
      const _u = new MongoObjectId(userId);
      const docs = await this.collection()
        .find({ userId: _u })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map(mapDocToPhoto);
    } catch {
      return [];
    }
  }

  static async list(options?: {
    userId?: string;
    mine?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<Photo[]> {
    const filter: Partial<PhotoDoc> = {};
    if (options?.mine && options.userId) {
      try {
        filter.userId = new MongoObjectId(options.userId);
      } catch {
        return [];
      }
    }

    const cursor = this.collection().find(filter).sort({ createdAt: -1 });
    if (options?.skip) cursor.skip(options.skip);
    if (options?.limit) cursor.limit(options.limit);
    const docs = await cursor.toArray();
    return docs.map(mapDocToPhoto);
  }

  static async setEnhanced(id: string, enhancedUrl: string): Promise<boolean> {
    try {
      const _id = new MongoObjectId(id);
      const result = await this.collection().updateOne(
        { _id },
        { $set: { enhancedUrl, aiEnhanced: true, updatedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch {
      return false;
    }
  }

  // update photo metadata (frame/stickers/watermark/enhancedUrl/aiEnhanced)
  static async updatePhoto(
    id: string,
    payload: Partial<{
      frame: string;
      stickers: string[];
      watermark: string;
      enhancedUrl: string;
      aiEnhanced: boolean;
      filter: string | null;
      shots: number | null;
      layout: string | null;
    }>
  ): Promise<Photo | null> {
    try {
      const _id = new MongoObjectId(id);

      // build typed update object
      const updateFields: Partial<PhotoDoc> = { updatedAt: new Date() };
      if (payload.frame !== undefined) updateFields.frame = payload.frame;
      if (payload.stickers !== undefined)
        updateFields.stickers = payload.stickers;
      if (payload.watermark !== undefined)
        updateFields.watermark = payload.watermark;
      if (payload.enhancedUrl !== undefined)
        updateFields.enhancedUrl = payload.enhancedUrl;
      if (payload.aiEnhanced !== undefined)
        updateFields.aiEnhanced = payload.aiEnhanced;
      if (payload.filter !== undefined) updateFields.filter = payload.filter;
      if (payload.shots !== undefined) updateFields.shots = payload.shots;
      if (payload.layout !== undefined) updateFields.layout = payload.layout;
      // perform update then fetch the updated document to avoid ambiguous driver return types
      const res = await this.collection().updateOne(
        { _id },
        { $set: updateFields }
      );
      if (res.matchedCount === 0) return null;

      const doc = await this.collection().findOne({ _id });
      if (!doc) return null;

      return mapDocToPhoto(doc);
    } catch {
      return null;
    }
  }

  static async deleteById(id: string): Promise<boolean> {
    try {
      const _id = new MongoObjectId(id);
      const result = await this.collection().deleteOne({ _id });
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }
}
