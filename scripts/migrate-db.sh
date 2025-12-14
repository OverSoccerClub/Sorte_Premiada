
#!/bin/bash

# Configuration
CONTAINER_NAME="megasena_db"
DB_USER="postgres"
DB_NAME="megasena"
DUMP_FILE="megasena_dump.sql"

# 1. Dump Local Database (Assuming local postgres is running on default port or accessible via some way)
# If local is Docker:
# docker exec -t local_postgres_container pg_dump -U $DB_USER $DB_NAME > $DUMP_FILE
# If local is Host:
echo "Creating dump from local database..."
# You might need to adjust PGPASSWORD or .pgpass if needed
pg_dump -U $DB_USER -h localhost $DB_NAME > $DUMP_FILE

if [ $? -eq 0 ]; then
  echo "Dump created successfully: $DUMP_FILE"
else
  echo "Error creating dump. Please check connection details."
  exit 1
fi

# 2. Restore to Production Docker Container
echo "Restoring to Docker container ($CONTAINER_NAME)..."

# Copy dump to container
docker cp $DUMP_FILE $CONTAINER_NAME:/tmp/$DUMP_FILE

# Exec restore
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -f /tmp/$DUMP_FILE

if [ $? -eq 0 ]; then
  echo "Migration completed successfully!"
else
  echo "Error restoring database."
  exit 1
fi

# Cleanup
rm $DUMP_FILE
