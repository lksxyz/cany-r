import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  role: text("role").notNull().default("tourist"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
})

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: text("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: text("accessTokenExpiresAt"),
  refreshTokenExpiresAt: text("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
})

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: text("expiresAt").notNull(),
  createdAt: text("createdAt"),
  updatedAt: text("updatedAt"),
})

export const walletAddress = sqliteTable("walletAddress", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  chainId: integer("chainId").notNull(),
  isPrimary: integer("isPrimary", { mode: "boolean" }).notNull().default(false),
  createdAt: text("createdAt").notNull(),
})

export const agent = sqliteTable("agent", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  fullName: text("fullName").notNull(),
  address: text("address").notNull(),
  currency: text("currency").notNull(),
  country: text("country").notNull().default("Indonesia"),
  escrowBalance: integer("escrowBalance").notNull().default(0),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
})

export const exchange = sqliteTable("exchange", {
  id: text("id").primaryKey(),
  touristId: text("touristId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  agentId: text("agentId")
    .notNull()
    .references(() => agent.id),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("requested"),
  qrNonce: text("qrNonce"),
  qrExpiresAt: text("qrExpiresAt"),
  qrSignature: text("qrSignature"),
  txHash: text("txHash"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
})
