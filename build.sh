#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== Step 1: Building Frontend (React + Vite) ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Step 2: Installing Backend Dependencies ==="
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo "=== Build Complete! Ready to launch on Render ==="
