-- AlterTable
ALTER TABLE "Shot" ADD COLUMN     "actionVerb" TEXT,
ADD COLUMN     "beatId" TEXT;

-- CreateTable
CREATE TABLE "Beat" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "beatIndex" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "narration" TEXT NOT NULL,
    "shotCount" INTEGER NOT NULL,

    CONSTRAINT "Beat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_beatId_fkey" FOREIGN KEY ("beatId") REFERENCES "Beat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
