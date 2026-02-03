#!/bin/bash

# File to be updated
CONFIG_FILE="sorj-manager/config.yaml"

echo "Bumping version number in $CONFIG_FILE..."

# Read the full line containing the version, e.g., version: "1.2.184"
OLD_VERSION_LINE=$(grep 'version:' "$CONFIG_FILE")

# Extract just the version string itself, e.g., 1.2.184
VERSION=$(echo "$OLD_VERSION_LINE" | sed 's/version: "\(.*\)"/\1/')

# Split the version into major.minor and patch parts
MAJOR_MINOR=$(echo "$VERSION" | cut -d. -f1,2)
PATCH=$(echo "$VERSION" | cut -d. -f3)

# Increment the patch number
NEW_PATCH=$((PATCH + 1))

# Reconstruct the new version string and the full line
NEW_VERSION="$MAJOR_MINOR.$NEW_PATCH"
NEW_VERSION_LINE="version: \"$NEW_VERSION\""

echo "Version changed from $VERSION to $NEW_VERSION"

# Use sed to replace the old version line with the new one in the file
sed -i "s/$OLD_VERSION_LINE/$NEW_VERSION_LINE/" "$CONFIG_FILE"

# --- Original script ---
git add . ; git commit -m "$1" ; git push
# xh POST https://hass.sal.net.br/api/hassio/store/refresh \
#   Authorization="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjYjBiMmZhNjcyMmQ0YjdiOWE1ZjM4NjgwOTc3YmRkMiIsImlhdCI6MTc3MDAyOTU4NCwiZXhwIjoyMDg1Mzg5NTg0fQ.LqkZG85reW-uDICWw9XKaOlTzD1oUvXozZS-tulY5mA"

# xh POST https://hass.sal.net.br/supervisor/addons/reload \
#   Authorization:"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjYjBiMmZhNjcyMmQ0YjdiOWE1ZjM4NjgwOTc3YmRkMiIsImlhdCI6MTc3MDAyOTU4NCwiZXhwIjoyMDg1Mzg5NTg0fQ.LqkZG85reW-uDICWw9XKaOlTzD1oUvXozZS-tulY5mA" \
#   addon=db25358c_sorj_net_manager


# xh POST https://hass.sal.net.br/api/hassio/addons/db25358c_sorj_net_manager/update \
#     "Authorization: Bearer "
