CREATE MATERIALIZED VIEW individual_leaderboard AS
  SELECT
    membership_id,
    raid_id,

    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY clears DESC, membership_id ASC) AS clears_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY clears DESC) AS clears_rank,
    
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY fresh_clears DESC, membership_id ASC) AS fresh_clears_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY fresh_clears DESC) AS fresh_clears_rank,
    
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY sherpas DESC, membership_id ASC) AS sherpas_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY sherpas DESC) AS sherpas_rank,
    
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY trios DESC, membership_id ASC) AS trios_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY trios DESC) AS trios_rank,
    
    ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY duos DESC, membership_id ASC) AS duos_position,
    RANK() OVER (PARTITION BY raid_id ORDER BY duos DESC) AS duos_rank,
    
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

-- SELECT cron.schedule('30 */2 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY individual_leaderboard WITH DATA');