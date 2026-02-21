import { eq, desc } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, analyses, type InsertUser, type InsertAnalysis, type Analysis, type User } from "../drizzle/schema";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const sql = neon(url);
  return drizzle({ client: sql });
}

export async function upsertUser(user: {
  googleId: string;
  name?: string | null;
  email?: string | null;
}): Promise<User> {
  const db = getDb();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.googleId, user.googleId))
    .limit(1);

  if (existing.length > 0) {
    const updateSet: Record<string, unknown> = {
      lastSignedIn: new Date(),
      updatedAt: new Date(),
    };
    if (user.name !== undefined) updateSet.name = user.name;
    if (user.email !== undefined) updateSet.email = user.email;

    const [updated] = await db
      .update(users)
      .set(updateSet)
      .where(eq(users.googleId, user.googleId))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(users)
    .values({
      googleId: user.googleId,
      name: user.name ?? null,
      email: user.email ?? null,
    })
    .returning();
  return inserted;
}

export async function getUserByGoogleId(googleId: string): Promise<User | undefined> {
  const db = getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);
  return result[0];
}

export async function createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
  const db = getDb();
  const [inserted] = await db.insert(analyses).values(analysis).returning();
  return inserted;
}

export async function getUserAnalyses(userId: number): Promise<Analysis[]> {
  const db = getDb();
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt));
}

export async function getAnalysisById(id: number): Promise<Analysis | undefined> {
  const db = getDb();
  const result = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  return result[0];
}

export async function linkAnalysisToUser(analysisId: number, userId: number): Promise<Analysis | undefined> {
  const db = getDb();
  const [updated] = await db
    .update(analyses)
    .set({ userId })
    .where(eq(analyses.id, analysisId))
    .returning();
  return updated;
}
