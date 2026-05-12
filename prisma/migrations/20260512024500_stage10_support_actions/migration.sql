ALTER TABLE "User" ADD COLUMN "supportEnergy" INTEGER NOT NULL DEFAULT 100;

ALTER TABLE "SupportAction" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "SupportAction_idempotencyKey_key" ON "SupportAction"("idempotencyKey");
CREATE INDEX "SupportAction_userId_tokenId_actionType_createdAt_idx" ON "SupportAction"("userId", "tokenId", "actionType", "createdAt");
