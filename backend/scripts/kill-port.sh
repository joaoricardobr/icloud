#!/bin/bash
PORT=3001
echo "Checking port $PORT..."

# Try fuser first (more robust)
fuser -k -n tcp $PORT || true

# Then lsof
PID=$(lsof -t -i:$PORT)
if [ -n "$PID" ]; then
  echo "Killing process $PID on port $PORT..."
  kill -9 $PID
fi

sleep 3

# Double check
PID=$(lsof -t -i:$PORT)
if [ -n "$PID" ]; then
  echo "Force killing process $PID..."
  kill -9 $PID
  sleep 2
fi

# Final check
if lsof -i:$PORT; then
    echo "Port $PORT is STILL in use!"
    exit 1
else
    echo "Port $PORT is ready."
fi
