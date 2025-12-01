import { db } from "../db/client.js";
import {
  wallets,
  walletTransactions,
  subscriptionPlans,
  purchases,
  servicesTokenCosts,
} from "../db/schema/wallet.js";
import { eq, desc } from "drizzle-orm";

/**
 * Wallet service interfaces
 */
export interface WalletBalance {
  balance: number;
  recentTransactions: Transaction[];
}

export interface Transaction {
  transactionId: string;
  changeAmount: number;
  type: "credit" | "debit";
  reason: string;
  metadata?: any;
  createdAt: Date;
}

export interface Plan {
  planId: string;
  name: string;
  tokens: number;
  price: string;
  durationDays: number;
  isRecurring: boolean;
}

export interface PurchaseRequest {
  planId: string;
  paymentId: string;
}

/**
 * Initialize wallet for new user (called during signup)
 * Creates wallet with 60 welcome tokens
 */
export async function initializeWallet(userId: string): Promise<void> {
  // Check if wallet already exists
  const existing = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    // Wallet already exists, don't create again
    return;
  }

  // Create new wallet with 60 welcome tokens
  const DEFAULT_WELCOME_TOKENS = 60;
  
  await db.transaction(async (tx) => {
    // Create new wallet
    const [newWallet] = await tx
      .insert(wallets)
      .values({
        userId,
        balanceTokens: DEFAULT_WELCOME_TOKENS,
      })
      .returning();

    if (!newWallet) {
      throw new Error("Failed to create wallet");
    }

    // Create transaction record for welcome bonus
    await tx.insert(walletTransactions).values({
      walletId: newWallet.walletId,
      changeAmount: DEFAULT_WELCOME_TOKENS,
      type: "credit",
      reason: "Welcome Bonus",
      metadata: {
        description: "Welcome bonus tokens for new account",
        isWelcomeBonus: true,
      },
    });
  });
}

/**
 * Get or create wallet for user
 * New wallets automatically receive 60 welcome tokens
 */
async function getOrCreateWallet(userId: string) {
  const existing = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    return existing[0];
  }

  // Create new wallet with 60 welcome tokens
  const DEFAULT_WELCOME_TOKENS = 60;
  
  return await db.transaction(async (tx) => {
    // Create new wallet
    const [newWallet] = await tx
      .insert(wallets)
      .values({
        userId,
        balanceTokens: DEFAULT_WELCOME_TOKENS,
      })
      .returning();

    if (!newWallet) {
      throw new Error("Failed to create wallet");
    }

    // Create transaction record for welcome bonus
    await tx.insert(walletTransactions).values({
      walletId: newWallet.walletId,
      changeAmount: DEFAULT_WELCOME_TOKENS,
      type: "credit",
      reason: "Welcome Bonus",
      metadata: {
        description: "Welcome bonus tokens for new account",
        isWelcomeBonus: true,
      },
    });

    return newWallet;
  });
}

/**
 * Get wallet balance and recent transactions
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  const wallet = await getOrCreateWallet(userId);

  // Get recent 20 transactions
  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.walletId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(20);

  return {
    balance: wallet.balanceTokens,
    recentTransactions: transactions.map((t) => ({
      transactionId: t.transactionId,
      changeAmount: t.changeAmount,
      type: t.type as "credit" | "debit",
      reason: t.reason,
      metadata: t.metadata,
      createdAt: t.createdAt || new Date(),
    })),
  };
}

/**
 * Get token cost for a service
 */
async function getServiceCost(serviceName: string): Promise<number> {
  const service = await db
    .select()
    .from(servicesTokenCosts)
    .where(eq(servicesTokenCosts.serviceName, serviceName))
    .limit(1);

  if (service.length === 0 || !service[0]) {
    throw new Error(`Service "${serviceName}" not found in token costs`);
  }

  return service[0].cost;
}

/**
 * Deduct tokens from wallet (atomic operation)
 * Returns updated balance or throws error if insufficient tokens
 */
export async function deductTokens(
  userId: string,
  serviceName: string,
  metadata?: any
): Promise<{ success: true; newBalance: number }> {
  // Get service cost
  const cost = await getServiceCost(serviceName);

  // Use database transaction for atomicity
  // PostgreSQL transactions provide serializable isolation to prevent race conditions
  return await db.transaction(async (tx) => {
    // Get wallet - transaction isolation prevents race conditions
    const wallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    let currentWallet;
    if (wallet.length === 0 || !wallet[0]) {
      // Create wallet if it doesn't exist with welcome bonus
      const DEFAULT_WELCOME_TOKENS = 60;
      const [newWallet] = await tx
        .insert(wallets)
        .values({
          userId,
          balanceTokens: DEFAULT_WELCOME_TOKENS,
        })
        .returning();
      if (!newWallet) {
        throw new Error("Failed to create wallet");
      }
      
      // Create transaction record for welcome bonus
      await tx.insert(walletTransactions).values({
        walletId: newWallet.walletId,
        changeAmount: DEFAULT_WELCOME_TOKENS,
        type: "credit",
        reason: "Welcome Bonus",
        metadata: {
          description: "Welcome bonus tokens for new account",
          isWelcomeBonus: true,
        },
      });
      
      currentWallet = newWallet;
    } else {
      currentWallet = wallet[0];
    }

    // Check if user has enough tokens
    if (currentWallet.balanceTokens < cost) {
      throw new Error("INSUFFICIENT_TOKENS");
    }

    // Deduct tokens
    const newBalance = currentWallet.balanceTokens - cost;

    // Update wallet balance
    await tx
      .update(wallets)
      .set({
        balanceTokens: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(wallets.walletId, currentWallet.walletId));

    // Create transaction record
    await tx.insert(walletTransactions).values({
      walletId: currentWallet.walletId,
      changeAmount: -cost,
      type: "debit",
      reason: serviceName,
      metadata: metadata || null,
    });

    return { success: true, newBalance };
  });
}

/**
 * Credit tokens to wallet (atomic operation)
 */
export async function creditTokens(
  userId: string,
  amount: number,
  reason: string,
  metadata?: any
): Promise<{ success: true; newBalance: number }> {
  return await db.transaction(async (tx) => {
    // Get or create wallet - transaction isolation prevents race conditions
    const wallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    let currentWallet;
    let finalBalance: number;
    
    if (wallet.length === 0 || !wallet[0]) {
      // Create wallet with welcome bonus + the credit amount
      const DEFAULT_WELCOME_TOKENS = 60;
      const [newWallet] = await tx
        .insert(wallets)
        .values({
          userId,
          balanceTokens: DEFAULT_WELCOME_TOKENS + amount,
        })
        .returning();
      if (!newWallet) {
        throw new Error("Failed to create wallet");
      }
      
      // Create transaction record for welcome bonus
      await tx.insert(walletTransactions).values({
        walletId: newWallet.walletId,
        changeAmount: DEFAULT_WELCOME_TOKENS,
        type: "credit",
        reason: "Welcome Bonus",
        metadata: {
          description: "Welcome bonus tokens for new account",
          isWelcomeBonus: true,
        },
      });
      
      currentWallet = newWallet;
      finalBalance = DEFAULT_WELCOME_TOKENS + amount;
    } else {
      currentWallet = wallet[0];
      finalBalance = currentWallet.balanceTokens + amount;

      await tx
        .update(wallets)
        .set({
          balanceTokens: finalBalance,
          updatedAt: new Date(),
        })
        .where(eq(wallets.walletId, currentWallet.walletId));
    }

    // Create transaction record
    await tx.insert(walletTransactions).values({
      walletId: currentWallet.walletId,
      changeAmount: amount,
      type: "credit",
      reason,
      metadata: metadata || null,
    });

    return { success: true, newBalance: finalBalance };
  });
}

/**
 * Get all subscription plans
 */
export async function getAllPlans(): Promise<Plan[]> {
  const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);

  return plans.map((plan) => ({
    planId: plan.planId,
    name: plan.name,
    tokens: plan.tokens,
    price: plan.price,
    durationDays: plan.durationDays,
    isRecurring: plan.isRecurring,
  }));
}

/**
 * Get plan by ID
 */
async function getPlanById(planId: string) {
  const plan = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.planId, planId))
    .limit(1);

  if (plan.length === 0 || !plan[0]) {
    throw new Error("Plan not found");
  }

  return plan[0];
}

/**
 * Process purchase - validate payment and credit tokens
 * Note: In production, you should verify payment with Razorpay/Stripe webhook
 */
export async function processPurchase(
  userId: string,
  purchaseRequest: PurchaseRequest
): Promise<{ success: true; newBalance: number; purchaseId: string }> {
  // Get plan details
  const plan = await getPlanById(purchaseRequest.planId);

  // TODO: In production, verify payment with payment gateway
  // For now, we'll assume payment is valid if paymentId is provided
  if (!purchaseRequest.paymentId) {
    throw new Error("Payment ID is required");
  }

  // Check if purchase with this payment ID already exists (prevent replay attacks)
  const existingPurchase = await db
    .select()
    .from(purchases)
    .where(eq(purchases.paymentId, purchaseRequest.paymentId))
    .limit(1);

  if (existingPurchase.length > 0 && existingPurchase[0]) {
    throw new Error("Payment already processed");
  }

  // Credit tokens to wallet
  const creditResult = await creditTokens(
    userId,
    plan.tokens,
    `Subscription Purchase: ${plan.name}`,
    {
      planId: plan.planId,
      planName: plan.name,
      paymentId: purchaseRequest.paymentId,
    }
  );

  // Create purchase record
  const [purchase] = await db
    .insert(purchases)
    .values({
      userId,
      planId: plan.planId,
      tokensAdded: plan.tokens,
      amountPaid: plan.price,
      paymentStatus: "completed",
      paymentId: purchaseRequest.paymentId,
    })
    .returning();

  if (!purchase) {
    throw new Error("Failed to create purchase record");
  }

  return {
    success: true,
    newBalance: creditResult.newBalance,
    purchaseId: purchase.purchaseId,
  };
}

/**
 * Get full transaction history for user
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 100
): Promise<Transaction[]> {
  const wallet = await getOrCreateWallet(userId);

  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.walletId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);

  return transactions.map((t) => ({
    transactionId: t.transactionId,
    changeAmount: t.changeAmount,
    type: t.type as "credit" | "debit",
    reason: t.reason,
    metadata: t.metadata,
    createdAt: t.createdAt || new Date(),
  }));
}

/**
 * Initialize default service costs (call this on startup or via migration)
 */
export async function initializeServiceCosts() {
  const defaultServices = [
    { serviceName: "ai_chat", cost: 1 },
    { serviceName: "text_interview", cost: 5 },
    { serviceName: "voice_interview", cost: 10 },
    { serviceName: "video_interview", cost: 15 },
    { serviceName: "group_practice", cost: 3 },
  ];

  for (const service of defaultServices) {
    await db
      .insert(servicesTokenCosts)
      .values(service)
      .onConflictDoUpdate({
        target: servicesTokenCosts.serviceName,
        set: {
          cost: service.cost,
          updatedAt: new Date(),
        },
      });
  }
}

/**
 * Initialize default subscription plans (call this on startup or via migration)
 * Note: Plans are initialized via SQL migration (supabase_wallet_schema.sql)
 * This function is kept for potential programmatic initialization if needed
 */
export async function initializeSubscriptionPlans() {
  // Plans are initialized via SQL migration
  // If you need programmatic initialization, uncomment the code below:
  /*
  const defaultPlans = [
    {
      name: "Free Plan",
      tokens: 20,
      price: "0.00",
      durationDays: 0,
      isRecurring: false,
    },
    {
      name: "Starter",
      tokens: 200,
      price: "9.99",
      durationDays: 0,
      isRecurring: false,
    },
    {
      name: "Pro Monthly",
      tokens: 500,
      price: "19.99",
      durationDays: 30,
      isRecurring: true,
    },
    {
      name: "Ultra",
      tokens: 2000,
      price: "49.99",
      durationDays: 0,
      isRecurring: false,
    },
  ];

  for (const plan of defaultPlans) {
    await db
      .insert(subscriptionPlans)
      .values(plan)
      .onConflictDoNothing();
  }
  */
}

