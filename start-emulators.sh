#!/bin/bash

# Start Firebase emulators for e2e testing
echo "Starting Firebase emulators for e2e testing..."

# Check if firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Start emulators in the background
firebase emulators:start --only auth,firestore &
EMULATOR_PID=$!

echo "Emulators starting... PID: $EMULATOR_PID"

# Wait a bit for emulators to start
sleep 5

# Check if emulators are running
if kill -0 $EMULATOR_PID 2>/dev/null; then
    echo "✅ Firebase emulators are running"
    echo "Auth emulator: http://localhost:9099"
    echo "Firestore emulator: http://localhost:8080"
    echo "Emulator UI: http://localhost:4000"
else
    echo "❌ Failed to start Firebase emulators"
    exit 1
fi

# Keep script running until interrupted
trap "echo 'Stopping emulators...'; kill $EMULATOR_PID 2>/dev/null; exit" INT TERM

# Wait for the emulator process
wait $EMULATOR_PID