import { sql, type Kysely } from "kysely";
import type { Database } from "../../db/types";
import type { GoogleProfile } from "./google";

/** How a Google sign-in was matched to a user (logged, and checked by the tests). */
export type GoogleSignInOutcome =
  | "signed_in" // this Google account was already linked
  | "linked" // linked to an existing account with the same verified email
  | "linked_unverified" // same email but never verified: Google's proof wins, see below
  | "created"; // a brand-new account

export interface OAuthAccountsRepository {
  /**
   * Finds or creates the user for a Google profile whose email Google has verified,
   * and links them. Everything happens in one transaction: no half-linked accounts.
   */
  signInWithGoogle(profile: GoogleProfile): Promise<{ userId: string; outcome: GoogleSignInOutcome }>;
}

export function createOAuthAccountsRepository(db: Kysely<Database>): OAuthAccountsRepository {
  return {
    async signInWithGoogle(profile) {
      return db.transaction().execute(async (trx) => {
        // 1. Seen this Google account before? Look it up by `sub`, never by email:
        //    the email of a Google account can change, its `sub` can't.
        const linked = await trx
          .selectFrom("oauth_accounts")
          .select("user_id")
          .where("provider", "=", "google")
          .where("provider_user_id", "=", profile.sub)
          .executeTakeFirst();
        if (linked) return { userId: linked.user_id, outcome: "signed_in" as const };

        // 2. An account with the same email? (citext: case doesn't matter.)
        //    FOR UPDATE locks the row until the transaction ends, so two sign-ins at the
        //    same moment can't both decide what to do with it.
        const existing = await trx
          .selectFrom("users")
          .select(["id", "email_verified_at"])
          .where("email", "=", profile.email)
          .forUpdate()
          .executeTakeFirst();

        let userId: string;
        let outcome: GoogleSignInOutcome;
        if (existing && existing.email_verified_at !== null) {
          // Both sides proved they own this address: it's the same person. Link.
          userId = existing.id;
          outcome = "linked";
        } else if (existing) {
          // SECURITY: "account pre-hijacking". Someone may have registered this address
          // with a password *before* its real owner showed up, hoping the owner would
          // later sign in with Google and start using an account the attacker can also
          // open. Google has just proved who owns the address, so the owner wins: the
          // unproven password is removed and every existing session is ended.
          // (A real owner who forgot to verify can set a password again with "Forgot password".)
          userId = existing.id;
          outcome = "linked_unverified";
          await trx
            .updateTable("users")
            .set({ password_hash: null, email_verified_at: sql<Date>`now()` })
            .where("id", "=", userId)
            .execute();
          await trx.deleteFrom("sessions").where("user_id", "=", userId).execute();
        } else {
          // 3. New here: create the account. No password (password_hash stays null),
          //    and the email is already verified, because Google said so.
          const created = await trx
            .insertInto("users")
            .values({
              email: profile.email,
              password_hash: null,
              display_name: profile.name,
              email_verified_at: sql<Date>`now()`,
            })
            .returning("id")
            .executeTakeFirstOrThrow();
          userId = created.id;
          outcome = "created";
        }

        await trx
          .insertInto("oauth_accounts")
          .values({ provider: "google", provider_user_id: profile.sub, user_id: userId })
          .execute();
        return { userId, outcome };
      });
    },
  };
}
