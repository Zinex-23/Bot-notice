import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "../prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default_fallback_super_secret_auth_key_minimum_32_characters"
);

const SESSION_COOKIE_NAME = "dailyflow_session";

export interface SessionPayload {
  userId: string;
  role: string;
}

/**
 * Creates and signs a secure JWT session token
 */
export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

/**
 * Verifies a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      role: (payload.role as string) || "admin",
    };
  } catch {
    return null;
  }
}

/**
 * Ensures the primary personal user exists in the database
 */
export async function getOrCreatePrimaryUser() {
  let user = await prisma.user.findFirst({
    include: {
      settings: true,
      telegramConnection: true,
      reportConfiguration: true,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Chủ nhân DailyFlow",
        email: "admin@dailyflow.local",
        timezone: "Asia/Ho_Chi_Minh",
        settings: {
          create: {
            waterTargetMl: 1500,
            timezone: "Asia/Ho_Chi_Minh",
            theme: "system",
            isInitialized: false,
          },
        },
        telegramConnection: {
          create: {
            isActive: true,
            isPaused: false,
          },
        },
        reportConfiguration: {
          create: {
            dailyEnabled: true,
            dailyTime: "22:00",
            dailyWithImage: true,
            dailyUnfinished: true,
            weeklyEnabled: true,
            weeklyDay: 0,
            weeklyTime: "21:45",
            monthlyEnabled: true,
            monthlyTime: "22:15",
          },
        },
      },
      include: {
        settings: true,
        telegramConnection: true,
        reportConfiguration: true,
      },
    });
  }

  return user;
}

/**
 * Retrieves the currently authenticated user from session cookies
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      settings: true,
      telegramConnection: true,
      reportConfiguration: true,
    },
  });

  return user;
}
