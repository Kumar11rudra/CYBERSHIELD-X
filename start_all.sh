#!/bin/bash

PROJECT_ROOT="/Users/anil/Documents/New project/cybershield-x"
SERVER_DIR="$PROJECT_ROOT/server"
CLIENT_DIR="$PROJECT_ROOT/client"
BACKEND_LOG="$PROJECT_ROOT/.run-backend.log"
FRONTEND_LOG="$PROJECT_ROOT/.run-frontend.log"

echo "==============================================="
echo "🛡️  Starting CyberShield X Services..."
echo "==============================================="

# Start backend server in a new Terminal window/tab and mirror output to the shared log file.
osascript -e "tell app \"Terminal\" to do script \"cd \\\"$SERVER_DIR\\\" && : > \\\"$BACKEND_LOG\\\" && npm run dev 2>&1 | tee \\\"$BACKEND_LOG\\\"\""

# Start frontend react app in a new Terminal window/tab and mirror output to the shared log file.
osascript -e "tell app \"Terminal\" to do script \"cd \\\"$CLIENT_DIR\\\" && : > \\\"$FRONTEND_LOG\\\" && npm start 2>&1 | tee \\\"$FRONTEND_LOG\\\"\""

echo "✅ Both servers are booting up in separate Terminal windows!"
echo "➡️  Frontend will be available at http://127.0.0.1:3000"
echo "➡️  Backend will be available at http://127.0.0.1:3001"
echo "➡️  Live logs: .run-frontend.log and .run-backend.log"
echo "==============================================="
