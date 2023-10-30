-- DropTable
DROP TABLE "raw_pgcr";

-- DropForeignKey
ALTER TABLE "activity_leaderboard_entry" DROP CONSTRAINT "activity_leaderboard_entry_activity_id_fkey";

-- DropIndex
DROP INDEX "activity_leaderboard_entry_activity_id_index";

-- DropIndex
DROP INDEX "activity_leaderboard_entry_leaderboard_id_index";

-- DropIndex
DROP INDEX "player_membership_id_key";

-- AlterTable
ALTER TABLE "activity" ADD COLUMN     "instance_id" BIGINT DEFAULT 0,
ADD COLUMN     "raid_hash_new" BIGINT DEFAULT 0;

UPDATE "activity" SET "instance_id" = ("activity_id"::BIGINT);
UPDATE "activity" SET "raid_hash_new" = ("raid_hash"::BIGINT);

ALTER TABLE "activity"
ALTER COLUMN "instance_id" SET NOT NULL,
ALTER COLUMN "raid_hash_new" SET NOT NULL;

-- AlterTable
ALTER TABLE "activity_leaderboard_entry" DROP COLUMN "activity_id",
ADD COLUMN     "instance_id" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "player" ADD COLUMN     "membership_id_new" BIGINT DEFAULT 0;

UPDATE "player" SET "membership_id_new" = ("membership_id"::BIGINT);

ALTER TABLE "player"
ALTER COLUMN "membership_id_new" SET NOT NULL;

-- AlterTable
ALTER TABLE "player_activity" ADD COLUMN     "instance_id" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "membership_id_new" BIGINT NOT NULL DEFAULT 0;


UPDATE "player_activity" SET "instance_id" = ("activity_id"::BIGINT);
UPDATE "player_activity" SET "membership_id_new" = ("membership_id"::BIGINT);

ALTER TABLE "player_activity"
ALTER COLUMN "instance_id" SET NOT NULL,
ALTER COLUMN "membership_id" SET NOT NULL;


-- CreateIndex
CREATE UNIQUE INDEX "activity_instance_id_key" ON "activity"("instance_id");

-- CreateIndex
CREATE INDEX "activity_instance_id_idx" ON "activity"("instance_id");

-- CreateIndex
CREATE INDEX "activity_leaderboard_entry_leaderboard_id_index" ON "activity_leaderboard_entry" USING HASH ("leaderboard_id");

-- CreateIndex
CREATE INDEX "activity_leaderboard_entry_instance_id_index" ON "activity_leaderboard_entry" USING HASH ("instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_membership_id_new_key" ON "player"("membership_id_new");

-- CreateIndex
CREATE UNIQUE INDEX "player_activity_instance_id_membership_id_new_key" ON "player_activity"("instance_id", "membership_id_new");

-- AddForeignKey
ALTER TABLE "player_activity" ADD CONSTRAINT "player_activity_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "activity"("instance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_activity" ADD CONSTRAINT "player_activity_membership_id_new_fkey" FOREIGN KEY ("membership_id_new") REFERENCES "player"("membership_id_new") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_leaderboard_entry" ADD CONSTRAINT "activity_leaderboard_entry_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "activity"("instance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity" DROP CONSTRAINT "activity_pkey" CASCADE;

ALTER TABLE "player" DROP CONSTRAINT "player_pkey" CASCADE;

ALTER TABLE "activity" DROP COLUMN "activity_id";
ALTER TABLE "activity" ADD CONSTRAINT "activity_pkey" PRIMARY KEY ("instance_id");

ALTER TABLE "player" DROP COLUMN "membership_id";
ALTER TABLE "player" RENAME COLUMN "membership_id_new" TO "membership_id";
ALTER TABLE "player" ADD CONSTRAINT "player_pkey" PRIMARY KEY ("membership_id");

ALTER TABLE "player_activity" DROP COLUMN "activity_id",
DROP COLUMN "membership_id";

ALTER TABLE "player_activity" RENAME COLUMN "membership_id_new" TO "membership_id";

ALTER TABLE "activity"
ALTER COLUMN "instance_id" DROP DEFAULT,
ALTER COLUMN "raid_hash_new" DROP DEFAULT;

ALTER TABLE "player"
ALTER COLUMN "membership_id" DROP DEFAULT;

ALTER TABLE "player_activity"
ALTER COLUMN "membership_id" DROP DEFAULT,
ALTER COLUMN "instance_id" DROP DEFAULT;

ALTER TABLE "activity_leaderboard_entry"
ALTER COLUMN "instance_id" DROP DEFAULT;

ALTER TABLE "activity" DROP COLUMN "raid_hash";
ALTER TABLE "activity" RENAME COLUMN "raid_hash_new" TO "raid_hash";

