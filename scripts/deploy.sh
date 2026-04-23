#!/bin/bash

set -e

docker compose down

# sync repo
echo "Sincronizando repo..."
git pull origin main

# deploy container
docker compose up -d
echo "Desplegado correctamente"
