import { supabaseAdmin, supabaseClient } from "../config/supabaseConfig.js";
import { db } from "../db/client.js";
import { userProfiles } from "../db/schema/auth.js";
import { eq } from "drizzle-orm";
import { initializeWallet } from "./wallet-service.js";

export interface SignUpRequest {
  email: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user?: any;
    session?: any;
    accessToken?: string;
    refreshToken?: string;
  };
  error?: string;
  statusCode?: number;
}

/**
 * Sign up a new user with Supabase Auth
 * Creates auth user and profile record
 */
export const signUp = async (payload: SignUpRequest): Promise<AuthResponse> => {
  try {
    const { email, password, fullName, phoneNumber } = payload;

    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: "Email and password are required",
        statusCode: 400,
      };
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "",
          phone_number: phoneNumber || "",
        },
      },
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || "Failed to create user",
        statusCode: 400,
      };
    }

    // Auto-confirm email using admin API (bypasses email confirmation requirement)
    // This allows users to login immediately after signup
    if (!authData.user.email_confirmed_at) {
      try {
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          authData.user.id,
          {
            email_confirm: true,
          }
        );

        if (updateError) {
          console.warn("Failed to auto-confirm email:", updateError);
          // Continue anyway - user can verify email later
        } else if (updatedUser?.user) {
          // Update authData with confirmed user
          authData.user = updatedUser.user;
        }
      } catch (confirmError: any) {
        console.warn("Error auto-confirming email:", confirmError);
        // Continue anyway - user can verify email later
      }
    }

    // Create user profile in our auth schema (optional - only if table exists)
    // Using Supabase's built-in auth, so profile creation is optional
    try {
      await db.insert(userProfiles).values({
        userId: authData.user.id,
        email: authData.user.email || email,
        fullName: fullName || null,
        phoneNumber: phoneNumber || null,
        emailVerified: authData.user.email_confirmed_at ? true : false,
      });
    } catch (profileError: any) {
      // Profile table doesn't exist or other error - that's okay
      // We're using Supabase's built-in auth, so profiles are optional
      console.warn("Profile creation skipped (using Supabase built-in auth):", profileError.message);
    }

    // Initialize wallet with 60 welcome tokens
    try {
      await initializeWallet(authData.user.id);
    } catch (walletError: any) {
      // Wallet creation failed - log but don't fail signup
      console.error("Failed to initialize wallet during signup:", walletError);
      // Continue - wallet will be created lazily when needed
    }

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        accessToken: authData.session?.access_token || "",
        refreshToken: authData.session?.refresh_token || "",
      },
      statusCode: 201,
    };
  } catch (err: any) {
    console.error("Sign up error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

/**
 * Sign in an existing user
 */
export const signIn = async (payload: SignInRequest): Promise<AuthResponse> => {
  try {
    const { email, password } = payload;

    if (!email || !password) {
      return {
        success: false,
        error: "Email and password are required",
        statusCode: 400,
      };
    }

    // Sign in with Supabase Auth
    let authData: any = null;
    let authError: any = null;

    const signInResult = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    authData = signInResult.data;
    authError = signInResult.error;

    // If error is "email not confirmed", auto-confirm the email and retry
    if (authError && (authError.message?.toLowerCase().includes("email not confirmed") || authError.message?.toLowerCase().includes("email_not_confirmed"))) {
      try {
        // Get user by email using Supabase Admin API
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (!listError && users) {
          const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
          
          if (user && !user.email_confirmed_at) {
            // Auto-confirm the email using Supabase Admin API
            const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              user.id,
              {
                email_confirm: true,
              }
            );

            if (!updateError && updatedUser?.user) {
              // Retry sign in after confirmation
              const retryResult = await supabaseAdmin.auth.signInWithPassword({
                email,
                password,
              });

              authData = retryResult.data;
              authError = retryResult.error;
            }
          }
        }
      } catch (confirmError: any) {
        console.warn("Error auto-confirming email during login:", confirmError);
        // Continue with original error
      }
    }

    if (authError || !authData?.user || !authData?.session) {
      return {
        success: false,
        error: authError?.message || "Invalid credentials",
        statusCode: 401,
      };
    }

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      },
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Sign in error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

/**
 * Sign out the current user
 * Note: With Supabase, sign out is typically handled client-side
 * This endpoint acknowledges the sign out request
 * The client should discard tokens after calling this
 */
export const signOut = async (refreshToken: string): Promise<AuthResponse> => {
  try {
    if (!refreshToken) {
      return {
        success: false,
        error: "Refresh token is required",
        statusCode: 400,
      };
    }

    // Note: Supabase Admin API doesn't have a direct server-side signOut method
    // The client should handle token removal
    // We can optionally revoke the refresh token using admin API if needed
    // For now, we just acknowledge the request
    // Tokens will expire naturally, and the client should discard them

    return {
      success: true,
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Sign out error:", err);
    // Even if there's an error, we return success as tokens will expire
    return {
      success: true,
      statusCode: 200,
    };
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  try {
    if (!refreshToken) {
      return {
        success: false,
        error: "Refresh token is required",
        statusCode: 400,
      };
    }

    // Refresh session with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (authError || !authData.session) {
      return {
        success: false,
        error: authError?.message || "Failed to refresh token",
        statusCode: 401,
      };
    }

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      },
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Refresh token error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (userId: string) => {
  try {
    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !user) {
      return {
        success: false,
        error: "User not found",
        statusCode: 404,
      };
    }

    // Get user profile from our schema
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    return {
      success: true,
      data: {
        user,
        profile: profile || null,
      },
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Get current user error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: {
    fullName?: string;
    phoneNumber?: string;
    bio?: string;
    avatarUrl?: string;
  }
) => {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.fullName !== undefined) updateData.fullName = updates.fullName;
    if (updates.phoneNumber !== undefined) updateData.phoneNumber = updates.phoneNumber;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;

    const [updatedProfile] = await db
      .update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.userId, userId))
      .returning();

    return {
      success: true,
      data: updatedProfile,
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Update profile error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

/**
 * Verify email token
 * Note: Supabase typically handles email verification via magic links
 * This endpoint can be used for OTP-based verification if configured
 */
export const verifyEmail = async (token: string, type: "email" | "signup" | "invite" = "email"): Promise<AuthResponse> => {
  try {
    if (!token) {
      return {
        success: false,
        error: "Verification token is required",
        statusCode: 400,
      };
    }

    // Verify email with Supabase using OTP
    const { data: authData, error: authError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: type,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || "Invalid verification token",
        statusCode: 400,
      };
    }

    // Update email verified status
    await db
      .update(userProfiles)
      .set({ emailVerified: true })
      .where(eq(userProfiles.userId, authData.user.id));

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        accessToken: authData.session?.access_token || "",
        refreshToken: authData.session?.refresh_token || "",
      },
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Verify email error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string) => {
  try {
    if (!email) {
      return {
        success: false,
        error: "Email is required",
        statusCode: 400,
      };
    }

    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to send password reset email",
        statusCode: 400,
      };
    }

    return {
      success: true,
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Request password reset error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

/**
 * Manually confirm a user's email (admin function)
 * Useful for confirming users who signed up before auto-confirmation was enabled
 */
export const confirmUserEmail = async (userId: string): Promise<AuthResponse> => {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
        statusCode: 400,
      };
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true,
      }
    );

    if (updateError || !updatedUser?.user) {
      return {
        success: false,
        error: updateError?.message || "Failed to confirm email",
        statusCode: 400,
      };
    }

    // Update email verified status in profile
    await db
      .update(userProfiles)
      .set({ emailVerified: true })
      .where(eq(userProfiles.userId, userId));

    return {
      success: true,
      data: {
        user: updatedUser.user,
      },
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Confirm email error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

/**
 * Get Google OAuth URL for sign in/sign up
 * @param redirectTo - URL to redirect to after OAuth (should be your callback URL)
 */
export const getGoogleOAuthUrl = async (redirectTo: string): Promise<{
  success: boolean;
  data?: { url: string };
  error?: string;
  statusCode?: number;
}> => {
  try {
    if (!redirectTo) {
      return {
        success: false,
        error: "redirectTo parameter is required",
        statusCode: 400,
      };
    }

    // Generate OAuth URL using Supabase client
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error || !data?.url) {
      return {
        success: false,
        error: error?.message || "Failed to generate OAuth URL",
        statusCode: 400,
      };
    }

    return {
      success: true,
      data: {
        url: data.url,
      },
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Get Google OAuth URL error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

/**
 * Verify OAuth session and create/update user profile
 * Called after frontend exchanges code for session
 * This ensures user profile and wallet are set up
 * @param accessToken - Access token from OAuth session
 */
export const verifyOAuthSession = async (accessToken: string): Promise<AuthResponse> => {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: "Access token is required",
        statusCode: 400,
      };
    }

    // Verify token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return {
        success: false,
        error: userError?.message || "Invalid access token",
        statusCode: 401,
      };
    }

    // Check if user profile exists
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    // Extract user info from OAuth metadata
    const fullName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.user_metadata?.display_name ||
                     `${user.user_metadata?.given_name || ""} ${user.user_metadata?.family_name || ""}`.trim() ||
                     null;
    
    const avatarUrl = user.user_metadata?.avatar_url || 
                      user.user_metadata?.picture || 
                      null;

    if (!existingProfile) {
      // Create new profile for OAuth user
      try {
        await db.insert(userProfiles).values({
          userId: user.id,
          email: user.email || "",
          fullName: fullName || null,
          avatarUrl: avatarUrl || null,
          emailVerified: user.email_confirmed_at ? true : false,
        });
      } catch (profileError: any) {
        console.warn("Profile creation skipped:", profileError.message);
      }

      // Initialize wallet with welcome bonus
      try {
        await initializeWallet(user.id);
      } catch (walletError: any) {
        console.error("Failed to initialize wallet for OAuth user:", walletError);
      }
    } else {
      // Update existing profile with OAuth data if needed
      try {
        const updateData: any = {
          updatedAt: new Date(),
        };
        
        if (fullName && !existingProfile.fullName) {
          updateData.fullName = fullName;
        }
        
        if (avatarUrl && !existingProfile.avatarUrl) {
          updateData.avatarUrl = avatarUrl;
        }
        
        if (user.email_confirmed_at && !existingProfile.emailVerified) {
          updateData.emailVerified = true;
        }

        if (Object.keys(updateData).length > 1) { // More than just updatedAt
          await db
            .update(userProfiles)
            .set(updateData)
            .where(eq(userProfiles.userId, user.id));
        }
      } catch (updateError: any) {
        console.warn("Profile update skipped:", updateError.message);
      }
    }

    return {
      success: true,
      data: {
        user,
        accessToken: accessToken,
      },
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Verify OAuth session error:", err);
    return {
      success: false,
      error: err.message || "Internal server error",
      statusCode: 500,
    };
  }
};

