#!/bin/bash

# CloudDesk Professional Storage Setup
# Objective: Map local folders and external disks to /mnt/storage_pool

USER_NAME="ricardo"
USER_HOME="/home/$USER_NAME"
STORAGE_ROOT="/mnt/storage_pool"

echo "🚀 Starting Storage Pool Configuration..."

# 1. Clean existing pool
echo "🧹 Cleaning existing pool..."
sudo rm -rf "$STORAGE_ROOT"
sudo mkdir -p "$STORAGE_ROOT"

# 2. Map User Folders (Supporting Portuguese names)
echo "📂 Mapping User Folders..."

FOLDERS=(
    "Transferências"
    "Downloads"
    "Documentos"
    "Documents"
    "Imagens"
    "Pictures"
    "Fotos"
    "Vídeos"
    "Videos"
    "Música"
    "Músicas"
    "Music"
    "Área de Trabalho"
    "Desktop"
    "Público"
    "Modelos"
)

for folder in "${FOLDERS[@]}"; do
    if [ -d "$USER_HOME/$folder" ]; then
        echo "🔗 Linking $folder..."
        sudo ln -s "$USER_HOME/$folder" "$STORAGE_ROOT/$folder"
    fi
done

# 3. Map External Disks (Ubuntu standard)
echo "💿 Mapping External Disks in /media/$USER_NAME..."
if [ -d "/media/$USER_NAME" ]; then
    for disk in "/media/$USER_NAME"/*; do
        if [ -d "$disk" ]; then
            disk_name=$(basename "$disk")
            echo "🔗 Linking Disk: $disk_name..."
            sudo ln -s "$disk" "$STORAGE_ROOT/$disk_name"
        fi
    done
fi

# 4. Map other common mount points
echo "💿 Checking /mnt for other disks..."
for disk in /mnt/*; do
    if [ -d "$disk" ] && [ "$disk" != "$STORAGE_ROOT" ]; then
        disk_name=$(basename "$disk")
        echo "🔗 Linking Mount: $disk_name..."
        sudo ln -s "$disk" "$STORAGE_ROOT/$disk_name"
    fi
done

# 5. Set Permissions
echo "🔐 Setting Permissions..."
sudo chown -R $USER_NAME:$USER_NAME "$STORAGE_ROOT"
sudo chmod -R 755 "$STORAGE_ROOT"

echo "✅ Storage Pool Ready at $STORAGE_ROOT!"
ls -la "$STORAGE_ROOT"
