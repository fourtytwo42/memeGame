-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "username" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "FounderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "reputation" INTEGER NOT NULL DEFAULT 50,
    "clout" INTEGER NOT NULL DEFAULT 0,
    "totalGameProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketingSkill" INTEGER NOT NULL DEFAULT 10,
    "memeSkill" INTEGER NOT NULL DEFAULT 10,
    "communitySkill" INTEGER NOT NULL DEFAULT 10,
    "narrativeSkill" INTEGER NOT NULL DEFAULT 10,
    "riskTolerance" INTEGER NOT NULL DEFAULT 10,
    "launchesCreated" INTEGER NOT NULL DEFAULT 0,
    "graduatedLaunches" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "rulesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NarrativeMeta" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "heat" INTEGER NOT NULL DEFAULT 50,
    "saturation" INTEGER NOT NULL DEFAULT 0,
    "fatigue" INTEGER NOT NULL DEFAULT 0,
    "whaleInterestModifier" INTEGER NOT NULL DEFAULT 0,
    "trustModifier" INTEGER NOT NULL DEFAULT 0,
    "memePotential" INTEGER NOT NULL DEFAULT 50,
    "activeLaunches" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NarrativeMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT,
    "crewId" TEXT,
    "name" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "description" TEXT,
    "narrative" TEXT NOT NULL,
    "narrativeSlug" TEXT,
    "mascotPrompt" TEXT,
    "mascotUrl" TEXT,
    "cardImageUrl" TEXT,
    "placeholderImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "simulatedPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.000001,
    "simulatedMarketCap" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "simulatedLiquidity" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "simulatedHolders" INTEGER NOT NULL DEFAULT 0,
    "simulatedVolume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hype" INTEGER NOT NULL DEFAULT 10,
    "trust" INTEGER NOT NULL DEFAULT 50,
    "memeQuality" INTEGER NOT NULL DEFAULT 25,
    "narrativeStrength" INTEGER NOT NULL DEFAULT 25,
    "communityStrength" INTEGER NOT NULL DEFAULT 10,
    "whaleInterest" INTEGER NOT NULL DEFAULT 5,
    "botRisk" INTEGER NOT NULL DEFAULT 0,
    "fudPressure" INTEGER NOT NULL DEFAULT 5,
    "fatigue" INTEGER NOT NULL DEFAULT 0,
    "treasury" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "gameProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "launchedAt" TIMESTAMP(3),
    "graduatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaunchToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenTick" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "marketCap" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "holders" INTEGER NOT NULL,
    "hype" INTEGER NOT NULL,
    "trust" INTEGER NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "energyCost" INTEGER NOT NULL,
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT,
    "seasonId" TEXT,
    "crewId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'system',
    "impactJson" JSONB,
    "choicesJson" JSONB,
    "severity" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crew" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "seasonId" TEXT,
    "reputation" INTEGER NOT NULL DEFAULT 50,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewMember" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrewMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewAction" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "tokenId" TEXT,
    "actionType" TEXT NOT NULL,
    "energyCost" INTEGER NOT NULL,
    "impactJson" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrewAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "crewId" TEXT,
    "actionType" TEXT NOT NULL,
    "energyCost" INTEGER NOT NULL,
    "impactJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rivalry" (
    "id" TEXT NOT NULL,
    "tokenAId" TEXT NOT NULL,
    "tokenBId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "intensity" INTEGER NOT NULL DEFAULT 10,
    "startedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rivalry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGeneratedContent" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "model" TEXT,
    "promptHash" TEXT,
    "inputJson" JSONB,
    "outputJson" JSONB,
    "rawOutput" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageJob" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "model" TEXT,
    "seed" INTEGER,
    "outputUrl" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreSnapshot" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "detailJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "FounderProfile_userId_key" ON "FounderProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_slug_key" ON "Season"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NarrativeMeta_seasonId_slug_key" ON "NarrativeMeta"("seasonId", "slug");

-- CreateIndex
CREATE INDEX "LaunchToken_seasonId_status_score_idx" ON "LaunchToken"("seasonId", "status", "score");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchToken_userId_ticker_key" ON "LaunchToken"("userId", "ticker");

-- CreateIndex
CREATE INDEX "TokenTick_tokenId_createdAt_idx" ON "TokenTick"("tokenId", "createdAt");

-- CreateIndex
CREATE INDEX "PlayerAction_tokenId_createdAt_idx" ON "PlayerAction"("tokenId", "createdAt");

-- CreateIndex
CREATE INDEX "PlayerAction_userId_createdAt_idx" ON "PlayerAction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GameEvent_tokenId_createdAt_idx" ON "GameEvent"("tokenId", "createdAt");

-- CreateIndex
CREATE INDEX "GameEvent_seasonId_createdAt_idx" ON "GameEvent"("seasonId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Crew_name_key" ON "Crew"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Crew_slug_key" ON "Crew"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CrewMember_crewId_userId_key" ON "CrewMember"("crewId", "userId");

-- CreateIndex
CREATE INDEX "CrewAction_crewId_createdAt_idx" ON "CrewAction"("crewId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportAction_tokenId_createdAt_idx" ON "SupportAction"("tokenId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportAction_userId_createdAt_idx" ON "SupportAction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_seasonId_category_rank_idx" ON "ScoreSnapshot"("seasonId", "category", "rank");

-- CreateIndex
CREATE INDEX "AdminAction_actorId_createdAt_idx" ON "AdminAction"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FounderProfile" ADD CONSTRAINT "FounderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NarrativeMeta" ADD CONSTRAINT "NarrativeMeta_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaunchToken" ADD CONSTRAINT "LaunchToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaunchToken" ADD CONSTRAINT "LaunchToken_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaunchToken" ADD CONSTRAINT "LaunchToken_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTick" ADD CONSTRAINT "TokenTick_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "LaunchToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAction" ADD CONSTRAINT "PlayerAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAction" ADD CONSTRAINT "PlayerAction_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "LaunchToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "LaunchToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewAction" ADD CONSTRAINT "CrewAction_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewAction" ADD CONSTRAINT "CrewAction_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "LaunchToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewAction" ADD CONSTRAINT "CrewAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAction" ADD CONSTRAINT "SupportAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAction" ADD CONSTRAINT "SupportAction_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "LaunchToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAction" ADD CONSTRAINT "SupportAction_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rivalry" ADD CONSTRAINT "Rivalry_tokenAId_fkey" FOREIGN KEY ("tokenAId") REFERENCES "LaunchToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rivalry" ADD CONSTRAINT "Rivalry_tokenBId_fkey" FOREIGN KEY ("tokenBId") REFERENCES "LaunchToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rivalry" ADD CONSTRAINT "Rivalry_startedByUserId_fkey" FOREIGN KEY ("startedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageJob" ADD CONSTRAINT "ImageJob_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "LaunchToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreSnapshot" ADD CONSTRAINT "ScoreSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
