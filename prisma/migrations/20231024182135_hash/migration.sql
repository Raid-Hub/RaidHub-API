-- DropIndex
DROP INDEX "activity_activity_id_key";

-- DropIndex
DROP INDEX "activity_leaderboard_entry_activity_id_index";

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
CREATE INDEX "player_membership_id_idx" ON "player" USING HASH ("membership_id");

-- CreateIndex
CREATE INDEX "dispay_name_index" ON "player" USING HASH ("display_name");

-- CreateIndex
CREATE INDEX "activity_id_index" ON "player_activity" USING HASH ("activity_id");

-- CreateIndex
CREATE INDEX "membership_id_index" ON "player_activity" USING HASH ("membership_id");
