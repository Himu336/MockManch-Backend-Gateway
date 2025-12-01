import { pgSchema, uuid, varchar, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Wallet schema - stores user token wallets, transactions, plans, and purchases
 */
export const walletSchema = pgSchema("wallet");

/**
 * Wallets table - one per user
 */
export const wallets = walletSchema.table("wallets", {
  walletId: uuid("wallet_id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull().unique(), // References auth.users.id (UUID as string)
  balanceTokens: integer("balance_tokens").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Wallet transactions - audit log of all token changes
 */
export const walletTransactions = walletSchema.table("wallet_transactions", {
  transactionId: uuid("transaction_id").defaultRandom().primaryKey(),
  walletId: uuid("wallet_id").notNull().references(() => wallets.walletId, { onDelete: "cascade" }),
  changeAmount: integer("change_amount").notNull(), // +50 or -3
  type: varchar("type").notNull(), // "credit" | "debit"
  reason: varchar("reason").notNull(), // "AI Chat", "Video Interview", "Subscription Purchase", etc.
  metadata: jsonb("metadata"), // Additional context (service details, payment info, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Subscription plans - token packs and subscription plans
 */
export const subscriptionPlans = walletSchema.table("subscription_plans", {
  planId: uuid("plan_id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  tokens: integer("tokens").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(), // 0 for one-time purchases
  isRecurring: boolean("is_recurring").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Purchases - records of all purchases made by users
 */
export const purchases = walletSchema.table("purchases", {
  purchaseId: uuid("purchase_id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(), // References auth.users.id
  planId: uuid("plan_id").notNull().references(() => subscriptionPlans.planId),
  tokensAdded: integer("tokens_added").notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status").notNull(), // "pending" | "completed" | "failed" | "refunded"
  paymentId: varchar("payment_id"), // Razorpay/Stripe payment ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Services token costs - defines token cost for each service
 */
export const servicesTokenCosts = walletSchema.table("services_token_costs", {
  serviceName: varchar("service_name").primaryKey(),
  cost: integer("cost").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Drizzle relations for type safety
 */
export const walletsRelations = relations(wallets, ({ many }) => ({
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.walletId],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [purchases.planId],
    references: [subscriptionPlans.planId],
  }),
}));

