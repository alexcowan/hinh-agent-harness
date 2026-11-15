#!/usr/bin/env bash
# Makes the Wizard of Oz pages private again.
[ -z "$CODESPACE_NAME" ] && exit 0
command -v gh >/dev/null 2>&1 || (sudo apt-get update -qq && sudo apt-get install -y -qq gh) >/dev/null 2>&1
if gh codespace ports visibility 3000:private -c "$CODESPACE_NAME" >/dev/null 2>&1; then
  echo "Port 3000 is private again."
else
  echo "Open the Ports tab, right-click port 3000, and choose Port Visibility > Private."
fi
