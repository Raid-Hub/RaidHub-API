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
    "clears" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_pkey" PRIMARY KEY ("membership_id")
);

-- CreateTable
CREATE TABLE "player_activity" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "finished_raid" BOOLEAN NOT NULL,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "time_played_seconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard" (
    "id" TEXT NOT NULL,

    CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_leaderboard_entry" (
    "id" TEXT NOT NULL,
    "rank" SERIAL NOT NULL,
    "leaderboard_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,

    CONSTRAINT "activity_leaderboard_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_pgcr_id_key" ON "raw_pgcr"("id" DESC);

-- CreateIndex
CREATE INDEX "activity_activity_id_idx" ON "activity" USING HASH ("activity_id");

-- CreateIndex
CREATE INDEX "date_index" ON "activity"("date_completed" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "player_membership_id_key" ON "player"("membership_id");

-- CreateIndex
CREATE INDEX "player_membership_id_idx" ON "player" USING HASH ("membership_id");

-- CreateIndex
CREATE INDEX "dispay_name_index" ON "player" (lower("display_name"));

-- CreateIndex
CREATE INDEX bungie_global_name_index ON "player" (lower("bungie_global_display_name"));

-- CreateIndex
CREATE INDEX bungie_global_code_index ON "player" (lower("bungie_global_display_name"));

-- CreateIndex
CREATE INDEX "bungie_name_index" ON "player"("bungie_global_display_name", "bungie_global_display_name_code");

-- CreateIndex
CREATE INDEX "activity_id_index" ON "player_activity" USING HASH ("activity_id");

-- CreateIndex
CREATE INDEX "membership_id_index" ON "player_activity" USING HASH ("membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_activity_activity_id_membership_id_key" ON "player_activity"("activity_id", "membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_id_key" ON "leaderboard"("id");

-- CreateIndex
CREATE INDEX "activity_leaderboard_entry_leaderboard_id_index" ON "activity_leaderboard_entry"("leaderboard_id");

-- CreateIndex
CREATE INDEX "activity_leaderboard_entry_activity_id_index" ON "activity_leaderboard_entry" USING HASH ("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_leaderboard_entry_id_rank_key" ON "activity_leaderboard_entry"("id", "rank");

-- AddForeignKey
ALTER TABLE "player_activity" ADD CONSTRAINT "player_activity_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_activity" ADD CONSTRAINT "player_activity_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "player"("membership_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_leaderboard_entry" ADD CONSTRAINT "activity_leaderboard_entry_leaderboard_id_fkey" FOREIGN KEY ("leaderboard_id") REFERENCES "leaderboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_leaderboard_entry" ADD CONSTRAINT "activity_leaderboard_entry_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;
