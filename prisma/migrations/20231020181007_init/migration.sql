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
    "sherpas" INTEGER NOT NULL DEFAULT 0,
    "lowman_sherpas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_pkey" PRIMARY KEY ("membership_id")
);

-- CreateTable
CREATE TABLE "player_activity" (
    "id" SERIAL NOT NULL,
    "finished_raid" BOOLEAN NOT NULL,
    "activity_id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,

    CONSTRAINT "player_activity_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "_leaderboard_entry_player" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_pgcr_id_key" ON "raw_pgcr"("id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "activity_activity_id_key" ON "activity"("activity_id" DESC);

-- CreateIndex
CREATE INDEX "date_index" ON "activity"("date_completed" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "player_membership_id_key" ON "player"("membership_id");

-- CreateIndex
CREATE INDEX "dispay_name_index" ON "player"("display_name");

-- CreateIndex
CREATE INDEX "bungie_name_index" ON "player"("bungie_global_display_name", "bungie_global_display_name_code");

-- CreateIndex
CREATE INDEX "activity_id_index" ON "player_activity"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_activity_activity_id_membership_id_key" ON "player_activity"("activity_id", "membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_id_key" ON "leaderboard"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_leaderboard_entry_player_AB_unique" ON "_leaderboard_entry_player"("A", "B");

-- CreateIndex
CREATE INDEX "_leaderboard_entry_player_B_index" ON "_leaderboard_entry_player"("B");

-- AddForeignKey
ALTER TABLE "player_activity" ADD CONSTRAINT "player_activity_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity"("activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_activity" ADD CONSTRAINT "player_activity_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "player"("membership_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_entry" ADD CONSTRAINT "leaderboard_entry_leaderboard_id_fkey" FOREIGN KEY ("leaderboard_id") REFERENCES "leaderboard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_leaderboard_entry_player" ADD CONSTRAINT "_leaderboard_entry_player_A_fkey" FOREIGN KEY ("A") REFERENCES "leaderboard_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_leaderboard_entry_player" ADD CONSTRAINT "_leaderboard_entry_player_B_fkey" FOREIGN KEY ("B") REFERENCES "player"("membership_id") ON DELETE CASCADE ON UPDATE CASCADE;
