CREATE TABLE raw_pgcr (
    _id SERIAL PRIMARY KEY,
    raw_json JSONB
);

INSERT INTO raw_pgcr (_id, raw_json) VALUES (1, '{"test": "value"}');
