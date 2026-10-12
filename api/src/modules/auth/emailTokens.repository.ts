import { sql, type Kysely } from "kysely";
import type { Database } from "../../db/types";
import { hashToken, newSessionToken } from "./tokens";

export type EmailTokenPurpose = "verify" | "reset";

/** How long each kind of link stays valid. */
export const EMAIL_TOKEN_TTL_MS: Record<EmailTokenPurpose, number> = {
  verify: 24 * 60 * 60 * 1000, // 24 hours
  reset: 60 * 60 * 1000, // 1 hour: a reset link is a key to the account, so keep it short
};

export interface EmailTokensRepository {
  /**
   * Creates a new one-time token and returns it (the raw value goes into the email link;
   * only its hash is stored). Older unused tokens of the same purpose stop working.
   */
  issue(userId: string, purpose: EmailTokenPurpose): Promise<string>;
  /** Uses up a token. Returns its user id, or undefined if unknown, expired or already used. */
  consume(token: string, purpose: EmailTokenPurpose): Promise<string | undefined>;
}

export function createEmailTokensRepository(db: Kysely<Database>): EmailTokensRepository {
  return {
    async issue(userId, purpose) {
      const token = newSessionToken(); // the same 32 random bytes as session tokens
      await db.transaction().execute(async (trx) => {
        // Only the newest link works: requesting a new one cancels the earlier ones.
        await trx.deleteFrom("email_tokens").where("user_id", "=", userId).where("purpose", "=", purpose).execute();
        await trx
          .insertInto("email_tokens")
          .values({
            token_hash: hashToken(token), // SECURITY: never store the raw token
            user_id: userId,
            purpose,
            expires_at: new Date(Date.now() + EMAIL_TOKEN_TTL_MS[purpose]),
          })
          .execute();
      });
      return token;
    },

    async consume(token, purpose) {
      // SECURITY: one atomic UPDATE checks everything and marks the token used at once.
      // If two requests race with the same link, only one UPDATE can match the row
      // (the other sees used_at already set), so a link can never work twice.
      const row = await db
        .updateTable("email_tokens")
        .set({ used_at: sql`now()` })
        .where("token_hash", "=", hashToken(token))
        .where("purpose", "=", purpose)
        .where("used_at", "is", null)
        .where("expires_at", ">", sql<Date>`now()`)
        .returning("user_id")
        .executeTakeFirst();
      return row?.user_id;
    },
  };
}
