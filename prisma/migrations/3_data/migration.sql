-- Insert Raid data
INSERT INTO "raid" ("id", "name", "is_sunset") VALUES
    (1, 'Leviathan', true),
    (2, 'Eater of Worlds', true),
    (3, 'Spire of Stars', true),
    (4, 'Last Wish', false),
    (5, 'Scourge of the Past', true),
    (6, 'Crown of Sorrow', true),
    (7, 'Garden of Salvation', false),
    (8, 'Deep Stone Crypt', false),
    (9, 'Vault of Glass', false),
    (10, 'Vow of the Disciple', false),
    (11, 'King''s Fall', false),
    (12, 'Root of Nightmares', false),
    (13, 'Crota''s End', false);

-- Insert Version data
INSERT INTO "raid_version" ("id", "name", "associated_raid_id") VALUES
    (1, 'Normal', NULL),
    (2, 'Guided Games', NULL),
    (3, 'Prestige', NULL),
    (4, 'Master', NULL),
    (64, 'Tempo''s Edge', 9),
    (65, 'Regicide', 11),
    (66, 'Superior Swordplay', 13);


-- Insert RaidHash data
INSERT INTO "raid_definition" ("raid_id", "version_id", "hash") VALUES
    -- LEVIATHAN
    (1, 1, 2693136600),
    (1, 1, 2693136601),
    (1, 1, 2693136602),
    (1, 1, 2693136603),
    (1, 1, 2693136604),
    (1, 1, 2693136605),
    -- LEVIATHAN GUIDEDGAMES
    (1, 2, 89727599),
    (1, 2, 287649202),
    (1, 2, 1699948563),
    (1, 2, 1875726950),
    (1, 2, 3916343513),
    (1, 2, 4039317196),
    -- LEVIATHAN PRESTIGE
    (1, 3, 417231112),
    (1, 3, 508802457),
    (1, 3, 757116822),
    (1, 3, 771164842),
    (1, 3, 1685065161),
    (1, 3, 1800508819),
    (1, 3, 2449714930),
    (1, 3, 3446541099),
    (1, 3, 4206123728),
    (1, 3, 3912437239),
    (1, 3, 3879860661),
    (1, 3, 3857338478),
    -- EATER_OF_WORLDS
    (2, 1, 3089205900),
    -- EATER_OF_WORLDS GUIDEDGAMES
    (2, 2, 2164432138),
    -- EATER_OF_WORLDS PRESTIGE
    (2, 3, 809170886),
    -- SPIRE_OF_STARS
    (3, 1, 119944200),
    -- SPIRE_OF_STARS GUIDEDGAMES
    (3, 2, 3004605630),
    -- SPIRE_OF_STARS PRESTIGE
    (3, 3, 3213556450),
    -- LAST_WISH
    (4, 1, 2122313384),
    (4, 1, 2214608157),
    -- LAST_WISH GUIDEDGAMES
    (4, 2, 1661734046),
    -- SCOURGE_OF_THE_PAST
    (5, 1, 548750096),
    -- SCOURGE_OF_THE_PAST GUIDEDGAMES
    (5, 2, 2812525063),
    -- CROWN_OF_SORROW
    (6, 1, 3333172150),
    -- CROWN_OF_SORROW GUIDEDGAMES
    (6, 2, 960175301),
    -- GARDEN_OF_SALVATION
    (7, 1, 2659723068),
    (7, 1, 3458480158),
    (7, 1, 1042180643),
    -- GARDEN_OF_SALVATION GUIDEDGAMES
    (7, 2, 2497200493),
    (7, 2, 3845997235),
    (7, 2, 3823237780),
    -- DEEP_STONE_CRYPT
    (8, 1, 910380154),
    -- DEEP_STONE_CRYPT GUIDEDGAMES
    (8, 2, 3976949817),
    -- VAULT_OF_GLASS
    (9, 1, 3881495763),
    -- VAULT_OF_GLASS GUIDEDGAMES
    (9, 2, 3711931140),
    -- VAULT_OF_GLASS CHALLENGE_VOG
    (9, 64, 1485585878),
    -- VAULT_OF_GLASS MASTER
    (9, 4, 1681562271),
    (9, 4, 3022541210),
    -- VOW_OF_THE_DISCIPLE
    (10, 1, 1441982566),
    (10, 1, 2906950631),
    -- VOW_OF_THE_DISCIPLE GUIDEDGAMES
    (10, 2, 4156879541),
    -- VOW_OF_THE_DISCIPLE MASTER
    (10, 4, 4217492330),
    (10, 4, 3889634515),
    -- KINGS_FALL
    (11, 1, 1374392663),
    -- KINGS_FALL GUIDEDGAMES
    (11, 2, 2897223272),
    -- KINGS_FALL CHALLENGE_KF
    (11, 65, 1063970578),
    -- KINGS_FALL MASTER
    (11, 4, 2964135793),
    (11, 4, 3257594522),
    -- ROOT_OF_NIGHTMARES
    (12, 1, 2381413764),
    -- ROOT_OF_NIGHTMARES GUIDEDGAMES
    (12, 2, 1191701339),
    -- ROOT_OF_NIGHTMARES MASTER
    (12, 4, 2918919505),
    -- CROTAS_END
    (13, 1, 4179289725),
    -- CROTAS_END GUIDEDGAMES
    (13, 2, 4103176774),
    -- CROTAS_END CHALLENGE_CROTA
    (13, 66, 156253568),
    -- CROTAS_END MASTER
    (13, 4, 1507509200);

CREATE OR REPLACE FUNCTION SEASON(p_input_date timestamp with time zone)
RETURNS integer AS $$
DECLARE
    v_season_number integer;
    v_season_dates timestamp with time zone[] := ARRAY[
        '2017-12-05T17:00:00Z',
        '2018-05-08T18:00:00Z',
        '2018-09-04T17:00:00Z',
        '2018-11-27T17:00:00Z',
        '2019-03-05T17:00:00Z',
        '2019-06-04T17:00:00Z',
        '2019-10-01T17:00:00Z',
        '2019-12-10T17:00:00Z',
        '2020-03-10T17:00:00Z',
        '2020-06-09T17:00:00Z',
        '2020-11-10T17:00:00Z',
        '2021-02-09T17:00:00Z',
        '2021-05-11T17:00:00Z',
        '2021-08-24T17:00:00Z',
        '2022-02-22T17:00:00Z',
        '2022-05-24T17:00:00Z',
        '2022-08-23T17:00:00Z',
        '2022-12-06T17:00:00Z',
        '2023-02-28T17:00:00Z',
        '2023-05-23T17:00:00Z',
        '2023-08-22T17:00:00Z',
        '2023-11-28T17:00:00Z',
        '2024-06-04T17:00:00Z',
        -- add new seasons here
        '2099-12-31T17:00:00Z'
    ];
    v_low integer := 1;
    v_high integer := array_length(v_season_dates, 1);
BEGIN
    -- binary search
    WHILE v_low <= v_high LOOP
        DECLARE
            v_mid integer := floor((v_low + v_high) / 2);
        BEGIN
            IF p_input_date >= v_season_dates[v_mid] THEN
                v_low := v_mid + 1;
            ELSE
                v_high := v_mid - 1;
            END IF;
        END;
    END LOOP;

    v_season_number := v_high + 1;

    RETURN v_season_number;
END;
$$ LANGUAGE plpgsql;