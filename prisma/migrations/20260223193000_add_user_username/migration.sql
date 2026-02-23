ALTER TABLE users
ADD COLUMN username TEXT;

WITH normalized AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        regexp_replace(lower(name), '[^a-z0-9_]+', '', 'g'),
        ''
      ),
      'user'
    ) AS base_username
  FROM users
),
ranked AS (
  SELECT
    id,
    CASE
      WHEN row_number() OVER (PARTITION BY base_username ORDER BY id) = 1 THEN base_username
      ELSE base_username || row_number() OVER (PARTITION BY base_username ORDER BY id)::text
    END AS generated_username
  FROM normalized
)
UPDATE users u
SET username = ranked.generated_username
FROM ranked
WHERE ranked.id = u.id;

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX users_username_key
ON users(username);
