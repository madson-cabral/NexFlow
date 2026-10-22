import {sqliteTable,text} from "drizzle-orm/sqlite-core";
export const enquiries=sqliteTable("enquiries",{id:text("id").primaryKey(),name:text("name").notNull(),contact:text("contact").notNull(),kind:text("kind").notNull(),message:text("message").notNull(),consentVersion:text("consent_version").notNull(),createdAt:text("created_at").notNull()});
