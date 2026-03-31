-- AlterTable: add payoutMethod and payoutDetails to PlatformWalletTransaction
ALTER TABLE "PlatformWalletTransaction"
  ADD COLUMN "payoutMethod" TEXT,
  ADD COLUMN "payoutDetails" JSONB;
