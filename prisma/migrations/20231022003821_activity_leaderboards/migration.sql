/*
  Warnings:

  - You are about to drop the `_leaderboard_entry_player` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leaderboard_entry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_leaderboard_entry_player" DROP CONSTRAINT "_leaderboard_entry_player_A_fkey";

-- DropForeignKey
ALTER TABLE "_leaderboard_entry_player" DROP CONSTRAINT "_leaderboard_entry_player_B_fkey";

-- DropForeignKey
ALTER TABLE "leaderboard_entry" DROP CONSTRAINT "leaderboard_entry_leaderboard_id_fkey";

-- DropTable
DROP TABLE "_leaderboard_entry_player";

-- DropTable
DROP TABLE "leaderboard_entry";

-- CreateTable
CREATE TABLE "activity_leaderboard_entry" (
    "id" SERIAL NOT NULL,
    "rank" INTEGER NOT NULL,
    "leaderboard_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,

    CONSTRAINT "activity_leaderboard_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_leaderboard_entry_rank_key" ON "activity_leaderboard_entry"("rank" ASC);

-- CreateIndex
CREATE INDEX "activity_leaderboard_entry_leaderboard_id_index" ON "activity_leaderboard_entry"("leaderboard_id");

-- CreateIndex
CREATE INDEX "activity_leaderboard_entry_activity_id_index" ON "activity_leaderboard_entry"("activity_id");

-- CreateIndex
CREATE INDEX "membership_id_index" ON "player_activity"("membership_id");

-- AddForeignKey
ALTER TABLE "activity_leaderboard_entry" ADD CONSTRAINT "activity_leaderboard_entry_leaderboard_id_fkey" FOREIGN KEY ("leaderboard_id") REFERENCES "leaderboard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_leaderboard_entry" ADD CONSTRAINT "activity_leaderboard_entry_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;
