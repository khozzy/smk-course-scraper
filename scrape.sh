#!/bin/bash
BUN_PATH="/opt/homebrew/bin/bun"
PROJECT_DIR="/Users/khozzy/Projects/smk"

cd "$PROJECT_DIR"
"$BUN_PATH" scrape >> "$PROJECT_DIR/logs/scrape.log" 2>&1
echo "Scrape completed at $(date)" >> "$PROJECT_DIR/logs/scrape.log"
