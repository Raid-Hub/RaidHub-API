/*
  Warnings:

  - A unique constraint covering the columns `[id,rank]` on the table `activity_leaderboard_entry` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "activity_leaderboard_entry" DROP CONSTRAINT "activity_leaderboard_entry_leaderboard_id_fkey";

-- DropIndex
DROP INDEX "activity_activity_id_key";

-- DropIndex
DROP INDEX "activity_leaderboard_entry_activity_id_index";

-- DropIndex
DROP INDEX "activity_leaderboard_entry_rank_key";

-- DropIndex
DROP INDEX "dispay_name_index";

-- DropIndex
DROP INDEX "activity_id_index";

-- DropIndex
DROP INDEX "membership_id_index";

-- CreateIndex
CREATE INDEX "activity_activity_id_idx" ON "activity" USING HASH ("activity_id");

-- CreateIndex
CREATE INDEX "activity_leaderboard_entry_activity_id_index" ON "activity_leaderboard_entry" USING HASH ("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_leaderboard_entry_id_rank_key" ON "activity_leaderboard_entry"("id", "rank");

-- CreateIndex
CREATE INDEX "player_membership_id_idx" ON "player" USING HASH ("membership_id");

-- CreateIndex
CREATE INDEX "dispay_name_index" ON "player" USING HASH ("display_name");

-- CreateIndex
CREATE INDEX "activity_id_index" ON "player_activity" USING HASH ("activity_id");

-- CreateIndex
CREATE INDEX "membership_id_index" ON "player_activity" USING HASH ("membership_id");

-- AddForeignKey
ALTER TABLE "activity_leaderboard_entry" ADD CONSTRAINT "activity_leaderboard_entry_leaderboard_id_fkey" FOREIGN KEY ("leaderboard_id") REFERENCES "leaderboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
