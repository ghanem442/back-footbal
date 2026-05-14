-- CreateEnum for PlatformTransactionType if not exists
DO $$ BEGIN
  CREATE TYPE "PlatformTransactionType" AS ENUM ('BOOKING_DEPOSIT', 'BOOKING_REFUND', 'ADMIN_WITHDRAWAL', 'MANUAL_ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for WithdrawalStatus if not exists
DO $$ BEGIN
  CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing BookingStatus enum values if not exists
DO $$ BEGIN
  ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_REFUNDED';
  ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_NO_REFUND';
  ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PLAYED';
  ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EXPIRED_NO_SHOW';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing PaymentGateway enum value if not exists
DO $$ BEGIN
  ALTER TYPE "PaymentGateway" ADD VALUE IF NOT EXISTS 'PAYMOB';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing FieldStatus enum if not exists
DO $$ BEGIN
  CREATE TYPE "FieldStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'HIDDEN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable PlatformWallet
CREATE TABLE IF NOT EXISTS "PlatformWallet" (
    "id" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable PlatformWalletTransaction
CREATE TABLE IF NOT EXISTS "PlatformWalletTransaction" (
    "id" TEXT NOT NULL,
    "platformWalletId" TEXT NOT NULL,
    "type" "PlatformTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balanceBefore" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "bookingId" TEXT,
    "reference" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable WithdrawalRequest
CREATE TABLE IF NOT EXISTS "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "accountDetails" TEXT NOT NULL,
    "adminNote" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "transactionRef" TEXT,
    "walletTxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmailVerificationToken if not exists
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- Add missing columns to existing tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='name') THEN
    ALTER TABLE "User" ADD COLUMN "name" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='emailVerifiedAt') THEN
    ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Field' AND column_name='basePrice') THEN
    ALTER TABLE "Field" ADD COLUMN "basePrice" DECIMAL(10,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Field' AND column_name='status') THEN
    ALTER TABLE "Field" ADD COLUMN "status" "FieldStatus" DEFAULT 'ACTIVE';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Booking' AND column_name='bookingNumber') THEN
    ALTER TABLE "Booking" ADD COLUMN "bookingNumber" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WalletTransaction' AND column_name='metadata') THEN
    ALTER TABLE "WalletTransaction" ADD COLUMN "metadata" JSONB;
  END IF;
END $$;

-- CreateIndex if not exists
CREATE INDEX IF NOT EXISTS "PlatformWalletTransaction_platformWalletId_idx" ON "PlatformWalletTransaction"("platformWalletId");
CREATE INDEX IF NOT EXISTS "PlatformWalletTransaction_bookingId_idx" ON "PlatformWalletTransaction"("bookingId");
CREATE INDEX IF NOT EXISTS "PlatformWalletTransaction_createdAt_idx" ON "PlatformWalletTransaction"("createdAt");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_ownerId_idx" ON "WithdrawalRequest"("ownerId");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_createdAt_idx" ON "WithdrawalRequest"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_bookingNumber_key" ON "Booking"("bookingNumber");

-- AddForeignKey if not exists
DO $$ BEGIN
  ALTER TABLE "PlatformWalletTransaction" ADD CONSTRAINT "PlatformWalletTransaction_platformWalletId_fkey" 
    FOREIGN KEY ("platformWalletId") REFERENCES "PlatformWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_ownerId_fkey" 
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: add payoutMethod and payoutDetails to PlatformWalletTransaction
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformWalletTransaction' AND column_name='payoutMethod') THEN
    ALTER TABLE "PlatformWalletTransaction" ADD COLUMN "payoutMethod" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PlatformWalletTransaction' AND column_name='payoutDetails') THEN
    ALTER TABLE "PlatformWalletTransaction" ADD COLUMN "payoutDetails" JSONB;
  END IF;
END $$;
