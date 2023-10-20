-- CreateTable
CREATE TABLE "raw_pgcr" (
    "id" TEXT NOT NULL,
    "raw_json" JSONB NOT NULL,

    CONSTRAINT "raw_pgcr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity" (
    "activity_id" TEXT NOT NULL,
    "raid_hash" TEXT NOT NULL,
    "flawless" BOOLEAN,
    "completed" BOOLEAN NOT NULL,
    "fresh" BOOLEAN,
    "player_count" INTEGER NOT NULL,
    "date_started" TIMESTAMP(3) NOT NULL,
    "date_completed" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "player" (
    "membership_id" TEXT NOT NULL,
    "membership_type" INTEGER,
    "icon_path" TEXT,
    "display_name" TEXT,
    "bungie_global_display_name" TEXT,
    "bungie_global_display_name_code" TEXT,
    "last_seen" TIMESTAMP(3) NOT NULL,
    "sherpas" INTEGER NOT NULL DEFAULT 0,
    "lowman_sherpas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_pkey" PRIMARY KEY ("membership_id")
);

-- CreateTable
CREATE TABLE "leaderboard" (
    "id" TEXT NOT NULL,

    CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entry" (
    "id" SERIAL NOT NULL,
    "rank" INTEGER NOT NULL,
    "leaderboard_id" TEXT NOT NULL,

    CONSTRAINT "leaderboard_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_complete" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_all" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_LeaderboardEntryToPlayer" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "raw_pgcr_id_idx" ON "raw_pgcr"("id");

-- CreateIndex
CREATE INDEX "activity_activity_id_idx" ON "activity"("activity_id");

-- CreateIndex
CREATE INDEX "player_membership_id_idx" ON "player"("membership_id");

-- CreateIndex
CREATE INDEX "player_display_name_idx" ON "player"("display_name");

-- CreateIndex
CREATE INDEX "player_bungie_global_display_name_bungie_global_display_nam_idx" ON "player"("bungie_global_display_name", "bungie_global_display_name_code");

-- CreateIndex
CREATE INDEX "leaderboard_id_idx" ON "leaderboard"("id");

-- CreateIndex
CREATE INDEX "leaderboard_entry_id_idx" ON "leaderboard_entry"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_complete_AB_unique" ON "_complete"("A", "B");

-- CreateIndex
CREATE INDEX "_complete_B_index" ON "_complete"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_all_AB_unique" ON "_all"("A", "B");

-- CreateIndex
CREATE INDEX "_all_B_index" ON "_all"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LeaderboardEntryToPlayer_AB_unique" ON "_LeaderboardEntryToPlayer"("A", "B");

-- CreateIndex
CREATE INDEX "_LeaderboardEntryToPlayer_B_index" ON "_LeaderboardEntryToPlayer"("B");

-- AddForeignKey
ALTER TABLE "leaderboard_entry" ADD CONSTRAINT "leaderboard_entry_leaderboard_id_fkey" FOREIGN KEY ("leaderboard_id") REFERENCES "leaderboard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_complete" ADD CONSTRAINT "_complete_A_fkey" FOREIGN KEY ("A") REFERENCES "activity"("activity_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_complete" ADD CONSTRAINT "_complete_B_fkey" FOREIGN KEY ("B") REFERENCES "player"("membership_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_all" ADD CONSTRAINT "_all_A_fkey" FOREIGN KEY ("A") REFERENCES "activity"("activity_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_all" ADD CONSTRAINT "_all_B_fkey" FOREIGN KEY ("B") REFERENCES "player"("membership_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeaderboardEntryToPlayer" ADD CONSTRAINT "_LeaderboardEntryToPlayer_A_fkey" FOREIGN KEY ("A") REFERENCES "leaderboard_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeaderboardEntryToPlayer" ADD CONSTRAINT "_LeaderboardEntryToPlayer_B_fkey" FOREIGN KEY ("B") REFERENCES "player"("membership_id") ON DELETE CASCADE ON UPDATE CASCADE;
