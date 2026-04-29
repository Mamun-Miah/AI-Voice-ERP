/*
  Warnings:

  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "lowStockAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "stockWarningNotifications" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "saleId" TEXT,
    "purchaseId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionReminder" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "partyId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'overdue',
    "channel" TEXT NOT NULL DEFAULT 'manual',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CollectionReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromiseToPay" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "partyId" TEXT NOT NULL,
    "saleId" TEXT,
    "promisedDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PromiseToPay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpNote" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "partyId" TEXT NOT NULL,
    "saleId" TEXT,
    "note" TEXT NOT NULL,
    "outcome" TEXT,
    "nextFollowUp" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FollowUpNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentAllocation_businessId_idx" ON "PaymentAllocation"("businessId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_saleId_idx" ON "PaymentAllocation"("saleId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_purchaseId_idx" ON "PaymentAllocation"("purchaseId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_deletedAt_idx" ON "PaymentAllocation"("deletedAt");

-- CreateIndex
CREATE INDEX "CollectionReminder_businessId_idx" ON "CollectionReminder"("businessId");

-- CreateIndex
CREATE INDEX "CollectionReminder_partyId_idx" ON "CollectionReminder"("partyId");

-- CreateIndex
CREATE INDEX "CollectionReminder_scheduledAt_idx" ON "CollectionReminder"("scheduledAt");

-- CreateIndex
CREATE INDEX "CollectionReminder_status_idx" ON "CollectionReminder"("status");

-- CreateIndex
CREATE INDEX "CollectionReminder_deletedAt_idx" ON "CollectionReminder"("deletedAt");

-- CreateIndex
CREATE INDEX "PromiseToPay_businessId_idx" ON "PromiseToPay"("businessId");

-- CreateIndex
CREATE INDEX "PromiseToPay_partyId_idx" ON "PromiseToPay"("partyId");

-- CreateIndex
CREATE INDEX "PromiseToPay_promisedDate_idx" ON "PromiseToPay"("promisedDate");

-- CreateIndex
CREATE INDEX "PromiseToPay_status_idx" ON "PromiseToPay"("status");

-- CreateIndex
CREATE INDEX "PromiseToPay_deletedAt_idx" ON "PromiseToPay"("deletedAt");

-- CreateIndex
CREATE INDEX "FollowUpNote_businessId_idx" ON "FollowUpNote"("businessId");

-- CreateIndex
CREATE INDEX "FollowUpNote_partyId_idx" ON "FollowUpNote"("partyId");

-- CreateIndex
CREATE INDEX "FollowUpNote_createdAt_idx" ON "FollowUpNote"("createdAt");

-- CreateIndex
CREATE INDEX "FollowUpNote_deletedAt_idx" ON "FollowUpNote"("deletedAt");

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionReminder" ADD CONSTRAINT "CollectionReminder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionReminder" ADD CONSTRAINT "CollectionReminder_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromiseToPay" ADD CONSTRAINT "PromiseToPay_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromiseToPay" ADD CONSTRAINT "PromiseToPay_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpNote" ADD CONSTRAINT "FollowUpNote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpNote" ADD CONSTRAINT "FollowUpNote_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
