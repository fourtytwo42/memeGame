ALTER TABLE "LaunchToken" ADD COLUMN "energy" INTEGER NOT NULL DEFAULT 100;

ALTER TABLE "PlayerAction" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "PlayerAction_idempotencyKey_key" ON "PlayerAction"("idempotencyKey");
