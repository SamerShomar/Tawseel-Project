-- Email verification for new accounts.
ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3),
ADD COLUMN "verify_token_hash" TEXT,
ADD COLUMN "verify_token_expires" TIMESTAMP(3);

-- Accounts that existed before this feature are treated as verified.
UPDATE "users" SET "email_verified_at" = "created_at";
