CREATE OR REPLACE FUNCTION create_individual_leaderboard_view(
  stat_column TEXT,
  cron TEXT
)
RETURNS VOID AS $$
BEGIN
  EXECUTE FORMAT('
    CREATE MATERIALIZED VIEW public.individual_leaderboard_%I AS
    SELECT
      membership_id,
      raid_id,
      %I as value,
      ROW_NUMBER() OVER (PARTITION BY raid_id ORDER BY %I DESC, membership_id ASC) AS position,
      RANK() OVER (PARTITION BY raid_id ORDER BY %I DESC) AS rank
    FROM player_stats
    WHERE %I > 0;

    CREATE UNIQUE INDEX idx_individual_leaderboard_%I_position ON public.individual_leaderboard_%I (raid_id, position ASC);
    CREATE UNIQUE INDEX idx_individual_leaderboard_%I_membership_id ON public.individual_leaderboard_%I (raid_id, membership_id);
    
    
    ',
    stat_column, stat_column, stat_column, stat_column,
    stat_column, stat_column, stat_column, stat_column,
    stat_column);
    
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule(%L, ''REFRESH MATERIALIZED VIEW CONCURRENTLY individual_leaderboard_%I WITH DATA'');
-- cron, stat_column);


-- For clears
SELECT create_individual_leaderboard_view('clears', '45 */2 * * *');

-- For fresh_clears
SELECT create_individual_leaderboard_view('fresh_clears', '15 * * * *');

-- For sherpas
SELECT create_individual_leaderboard_view('sherpas', '0 * * * *');

-- For trios
SELECT create_individual_leaderboard_view('trios', '30 */2 * * *');

-- For duos
SELECT create_individual_leaderboard_view('duos', '35 */2 * * *');

-- For solos
SELECT create_individual_leaderboard_view('solos', '25 */6 * * *');