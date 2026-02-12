#!/bin/bash

# Configuration
STORAGE_ROOT="/mnt/storage_pool"
USER_HOME=$(eval echo ~$USER)
TARGET_USER="nasuser"

echo "🚀 Starting CloudDesk Hybrid Storage Setup..."

# 1. Create Storage Root
echo "--- Creating storage root at $STORAGE_ROOT ---"
sudo mkdir -p "$STORAGE_ROOT"

# 2. Create Symlinks
echo "--- Creating symlinks to home directories ---"
sudo ln -sf "$USER_HOME/Downloads" "$STORAGE_ROOT/Downloads"
sudo ln -sf "$USER_HOME/Documents" "$STORAGE_ROOT/Documents"
sudo ln -sf "$USER_HOME/Pictures" "$STORAGE_ROOT/Pictures"
sudo ln -sf "$USER_HOME/Videos" "$STORAGE_ROOT/Videos"
sudo ln -sf "$USER_HOME/Music" "$STORAGE_ROOT/Music"
sudo ln -sf "$USER_HOME/Desktop" "$STORAGE_ROOT/Desktop"

# 3. Add External Disks (if exist)
if [ -d "/media/$USER" ]; then
    echo "--- Mapping external disks from /media/$USER ---"
    for disk in /media/$USER/*; do
        if [ -d "$disk" ]; then
            disk_name=$(basename "$disk")
            sudo ln -sf "$disk" "$STORAGE_ROOT/$disk_name"
        fi
    done
fi

# 4. Permissions (Set to current user or nasuser if exists)
echo "--- Adjusting permissions ---"
# Check if target user exists
if id "$TARGET_USER" &>/dev/null; then
    sudo chown -R "$TARGET_USER":"$TARGET_USER" "$STORAGE_ROOT"
else
    echo "⚠️ User $TARGET_USER NOT found. Using current user $USER."
    sudo chown -R "$USER":"$USER" "$STORAGE_ROOT"
fi

# 5. Install Dependencies (Global)
echo "--- Checking Node.js and PM2 ---"
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js v18+ first."
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    sudo npm install -g pm2
fi

echo "✅ Storage pool setup complete!"
echo "Directories mapped in $STORAGE_ROOT:"
ls -F "$STORAGE_ROOT"
