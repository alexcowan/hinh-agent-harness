#!/usr/bin/env bash
# Makes the Wizard of Oz pages reachable by a classmate, and prints the links.
if [ -z "$CODESPACE_NAME" ]; then
  echo "This isn't a Codespace, so there's nothing to share. Open http://localhost:3000/wizard"
  exit 0
fi
URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
if gh codespace ports visibility 3000:public -c "$CODESPACE_NAME" >/dev/null 2>&1; then
  echo "Port 3000 is now public."
else
  echo "Couldn't make the port public automatically."
  echo "Open the Ports tab, right-click port 3000, and choose Port Visibility > Public."
fi
echo ""
echo "Your page (the wizard):  ${URL}/wizard"
echo "Start a session there; it gives you the link to send your tester."
echo "When you're done: npm run unshare"
