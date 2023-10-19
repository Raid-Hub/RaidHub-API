CREATE TABLE raw_pgcr (
    _id SERIAL PRIMARY KEY,
    raw_json JSONB
);

CREATE TABLE activities (
    activity_id BIGINT PRIMARY KEY,
    raid_hash BIGINT,
    flawless BOOLEAN,
    fresh BOOLEAN,
    player_count INT,
    date_started DATE,
    date_completed DATE
);

CREATE TABLE players (
    membership_id VARCHAR(255) PRIMARY KEY
);

CREATE TABLE activity_players (
    activity_id BIGINT,
    membership_id VARCHAR(255),
    PRIMARY KEY (activity_id, membership_id),
    FOREIGN KEY (activity_id) REFERENCES activities(activity_id),
    FOREIGN KEY (membership_id) REFERENCES players(membership_id)
);
