import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { siwe } from "better-auth/plugins/siwe"
import { generateRandomString } from "better-auth/crypto"
import { verifyMessage } from "viem"
import { db } from "./db"
import * as schema from "./db/schema"

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "tourist",
        fieldName: "role",
      },
    },
  },
  plugins: [
    siwe({
      domain: process.env.NEXT_PUBLIC_DOMAIN || "localhost:3000",
      getNonce: async () => {
        return generateRandomString(32, "a-z", "A-Z", "0-9")
      },
      verifyMessage: async ({ message, signature, address }) => {
        try {
          return await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
          })
        } catch {
          return false
        }
      },
    }),
    nextCookies(),
  ],
})
