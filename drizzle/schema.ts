import { boolean, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: varchar("google_id", { length: 255 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  url: varchar("url", { length: 2048 }).notNull(),
  score: integer("score").notNull(),

  hasJsonApi: boolean("has_json_api").default(false).notNull(),
  hasTextApi: boolean("has_text_api").default(false).notNull(),
  hasMarkdownApi: boolean("has_markdown_api").default(false).notNull(),
  hasRssFeed: boolean("has_rss_feed").default(false).notNull(),
  hasAtomFeed: boolean("has_atom_feed").default(false).notNull(),
  hasJsonFeed: boolean("has_json_feed").default(false).notNull(),
  hasLlmsTxt: boolean("has_llms_txt").default(false).notNull(),
  hasJsonLd: boolean("has_json_ld").default(false).notNull(),
  hasSemanticHtml: boolean("has_semantic_html").default(false).notNull(),
  hasServerSideRendering: boolean("has_server_side_rendering").default(false).notNull(),
  hasMetaTags: boolean("has_meta_tags").default(false).notNull(),
  hasSitemap: boolean("has_sitemap").default(false).notNull(),
  hasMcpServer: boolean("has_mcp_server").default(false).notNull(),

  details: jsonb("details"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  analysisId: integer("analysis_id").notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
