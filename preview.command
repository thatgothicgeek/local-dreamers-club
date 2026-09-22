#!/bin/zsh

cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display dialog "Local Dreamers Club needs Node.js to run its preview." buttons {"OK"} default button "OK" with title "Preview setup"'
  open "https://nodejs.org/en/download"
  exit 1
fi

(sleep 1; open "http://localhost:4321") &

clear
echo "LOCAL DREAMERS CLUB — LOCAL PREVIEW"
echo ""
echo "Safari will open automatically."
echo "Keep this window open while reviewing the site."
echo "Press Control-C here when you are finished."
echo ""

npm run dev
