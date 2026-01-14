#!/bin/sh

# Default values if not set
: "${API_URL:=https://pos-jogos-api.uawtgc.easypanel.host}"
: "${COMPANY_ID:=default}"

# Create env-config.js
echo "window.ENV = {" > /usr/share/nginx/html/env-config.js
echo "  API_URL: \"$API_URL\"," >> /usr/share/nginx/html/env-config.js
echo "  COMPANY_ID: \"$COMPANY_ID\"" >> /usr/share/nginx/html/env-config.js
echo "};" >> /usr/share/nginx/html/env-config.js

# Execute the passed command (usually nginx)
exec "$@"
