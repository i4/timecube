-- Our docker compose will create a user, but not the default postgres one.
-- Let's do it here.

CREATE ROLE postgres;
