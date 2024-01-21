CREATE OR REPLACE FUNCTION bungie_name(p player) RETURNS VARCHAR AS $$
BEGIN
  RETURN CASE
           WHEN p.bungie_global_display_name IS NOT NULL AND p.bungie_global_display_name_code IS NOT NULL THEN
             CONCAT(p.bungie_global_display_name, '#', p.bungie_global_display_name_code)
           ELSE
             NULL
         END;
END;
$$ LANGUAGE plpgsql;