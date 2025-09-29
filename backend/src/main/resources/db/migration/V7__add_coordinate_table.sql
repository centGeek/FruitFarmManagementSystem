CREATE TABLE coordinate_entity
(
    coordinate_id serial PRIMARY KEY,
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    sector_id     BIGINT,
    CONSTRAINT fk_coordinate_sector FOREIGN KEY (sector_id) REFERENCES sector_entity (sector_id) ON DELETE CASCADE
);