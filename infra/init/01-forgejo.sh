#!/bin/sh
set -e
export PGPASSWORD="${POSTGRES_PASSWORD}"
PW="${FORGEJO_DB_PASSWORD:-$POSTGRES_PASSWORD}"
pw_sql=$(printf "%s" "$PW" | sed "s/'/''/g")

run_psql() {
  psql -v ON_ERROR_STOP=1 -h 127.0.0.1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" "$@"
}

if [ "$(run_psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'forgejo'")" != "1" ]; then
  run_psql -c "CREATE USER forgejo WITH ENCRYPTED PASSWORD '$pw_sql';"
fi

if [ "$(run_psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'forgejo'")" != "1" ]; then
  run_psql -c "CREATE DATABASE forgejo OWNER forgejo;"
fi
