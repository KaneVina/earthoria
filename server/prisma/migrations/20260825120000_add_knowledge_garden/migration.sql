-- CreateEnum
CREATE TYPE "TreeStatus" AS ENUM ('ALIVE', 'MATURE', 'DEAD');

-- CreateTable
CREATE TABLE "ChildGarden" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "forestLevel" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "missedStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TEXT,
    "lastTickDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildGarden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildTree" (
    "id" TEXT NOT NULL,
    "gardenId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "readingXp" INTEGER NOT NULL DEFAULT 0,
    "gameXp" INTEGER NOT NULL DEFAULT 0,
    "readingMinutes" INTEGER NOT NULL DEFAULT 0,
    "health" INTEGER NOT NULL DEFAULT 100,
    "status" "TreeStatus" NOT NULL DEFAULT 'ALIVE',
    "plantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maturedAt" TIMESTAMP(3),
    "diedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildTree_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChildGarden_childId_key" ON "ChildGarden"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildTree_gardenId_slot_key" ON "ChildTree"("gardenId", "slot");

-- CreateIndex
CREATE INDEX "ChildTree_gardenId_idx" ON "ChildTree"("gardenId");

-- AddForeignKey
ALTER TABLE "ChildGarden" ADD CONSTRAINT "ChildGarden_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildTree" ADD CONSTRAINT "ChildTree_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "ChildGarden"("id") ON DELETE CASCADE ON UPDATE CASCADE;