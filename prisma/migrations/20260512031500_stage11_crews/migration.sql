ALTER TABLE "Crew" ADD COLUMN "energy" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Crew" ADD COLUMN "resources" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Crew" ADD COLUMN "featuredTokenId" TEXT;
ALTER TABLE "Crew" ADD COLUMN "moderationStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Crew" ADD COLUMN "tagline" TEXT;

ALTER TABLE "CrewAction" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "CrewAction_idempotencyKey_key" ON "CrewAction"("idempotencyKey");
CREATE INDEX "CrewAction_crewId_tokenId_actionType_createdAt_idx" ON "CrewAction"("crewId", "tokenId", "actionType", "createdAt");
CREATE INDEX "Crew_featuredTokenId_idx" ON "Crew"("featuredTokenId");

ALTER TABLE "Crew" ADD CONSTRAINT "Crew_featuredTokenId_fkey" FOREIGN KEY ("featuredTokenId") REFERENCES "LaunchToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;