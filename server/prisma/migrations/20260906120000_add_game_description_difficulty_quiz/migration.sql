-- AlterEnum
ALTER TYPE "GameType" ADD VALUE 'QUIZ_CHOICE';

-- CreateEnum
CREATE TYPE "GameDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "description" TEXT,
ADD COLUMN     "difficulty" "GameDifficulty" NOT NULL DEFAULT 'EASY';