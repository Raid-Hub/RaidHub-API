CREATE MATERIALIZED VIEW individual_leaderboard AS
  SELECT
    membership_id,
    raid_id,

    clears,
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY clears DESC, membership_id ASC) AS clears_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY clears DESC) AS clears_rank,

    fresh_clears,
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY fresh_clears DESC, membership_id ASC) AS fresh_clears_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY fresh_clears DESC) AS fresh_clears_rank,
    
    sherpas,
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY sherpas DESC, membership_id ASC) AS sherpas_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY sherpas DESC) AS sherpas_rank,
    
    trios,
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY trios DESC, membership_id ASC) AS trios_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY trios DESC) AS trios_rank,
    
    duos,
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY duos DESC, membership_id ASC) AS duos_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY duos DESC) AS duos_rank,
    
    solos,
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY solos DESC, membership_id ASC) AS solos_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY solos DESC) AS solos_rank
  FROM player_stats
  WHERE clears > 0;

CREATE UNIQUE INDEX idx_individual_leaderboard_membership_id ON individual_leaderboard (raid_id DESC, membership_id ASC);
CREATE UNIQUE INDEX idx_individual_leaderboard_clears ON individual_leaderboard (raid_id DESC, clears_position ASC);
CREATE UNIQUE INDEX idx_individual_leaderboard_fresh_clears ON individual_leaderboard (raid_id DESC, fresh_clears_position ASC);
CREATE UNIQUE INDEX idx_individual_leaderboard_sherpas ON individual_leaderboard (raid_id DESC, sherpas_position ASC);
CREATE UNIQUE INDEX idx_individual_leaderboard_trios ON individual_leaderboard (raid_id DESC, trios_position ASC);
CREATE UNIQUE INDEX idx_individual_leaderboard_duos ON individual_leaderboard (raid_id DESC, duos_position ASC);
CREATE UNIQUE INDEX idx_individual_leaderboard_solos ON individual_leaderboard (raid_id DESC, solos_position ASC);


CREATE MATERIALIZED VIEW global_leaderboard AS
  SELECT
    membership_id,

    clears,
    ROW_NUMBER() OVER (ORDER BY clears DESC, membership_id ASC) AS clears_position,
    RANK() OVER (ORDER BY clears DESC) AS clears_rank,

    fresh_clears,
    ROW_NUMBER() OVER (ORDER BY fresh_clears DESC, membership_id ASC) AS fresh_clears_position,
    RANK() OVER (ORDER BY fresh_clears DESC) AS fresh_clears_rank,
    
    sherpas,
    ROW_NUMBER() OVER (ORDER BY sherpas DESC, membership_id ASC) AS sherpas_position,
    RANK() OVER (ORDER BY sherpas DESC) AS sherpas_rank,

    sum_of_best as speed,
    ROW_NUMBER() OVER (ORDER BY sum_of_best ASC, membership_id ASC) AS speed_position,
    RANK() OVER (ORDER BY sum_of_best ASC) AS speed_rank
    
  FROM player
  WHERE clears > 0;

CREATE UNIQUE INDEX idx_global_leaderboard_membership_id ON global_leaderboard (membership_id ASC);
CREATE UNIQUE INDEX idx_global_leaderboard_clears ON global_leaderboard (clears_position ASC);
CREATE UNIQUE INDEX idx_global_leaderboard_fresh_clears ON global_leaderboard (fresh_clears_position ASC);
CREATE UNIQUE INDEX idx_global_leaderboard_sherpas ON global_leaderboard (sherpas_position ASC);
CREATE UNIQUE INDEX idx_global_leaderboard_speed ON global_leaderboard (speed_position ASC);

CREATE MATERIALIZED VIEW world_first_player_rankings AS 
WITH tmp AS (
    SELECT
        p.membership_id,
        ROW_NUMBER() OVER (PARTITION BY p.membership_id, al.raid_id ORDER BY ale.rank ASC) AS placement_num,
        ((1 / SQRT(ale.rank)) * POWER(1.25, raid_id - 1)) as score
    FROM
        player p
    JOIN
        player_activity pa ON p.membership_id = pa.membership_id
    JOIN
        activity_leaderboard_entry ale ON pa.instance_id = ale.instance_id
    JOIN
        leaderboard al ON ale.leaderboard_id = al.id
    WHERE
        ale.rank <= 500 AND al.is_world_first
)
SELECT
    membership_id,
    SUM(score) AS score,
    RANK() OVER (ORDER BY SUM(score) DESC) AS rank
FROM tmp
WHERE placement_num = 1
GROUP BY membership_id
ORDER BY rank ASC;

CREATE UNIQUE INDEX idx_world_first_player_ranking_membership_id ON world_first_player_rankings (membership_id);
CREATE INDEX idx_world_first_player_ranking_rank ON world_first_player_rankings (rank ASC);
