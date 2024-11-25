# SMK Course Scraper

Automated scraper for medical courses from [SMK](https://smk.ezdrowie.gov.pl/) (System Monitorowania Kształcenia) platform. Extracts orthopedic course data and updates a Google Spreadsheet.

## Features

- Headless Chrome automation with Puppeteer
- Google Sheets integration
- Automatic retry on failures
- Structured logging
- TypeScript support

## Setup

1. Install dependencies:

```bash
bun i
```

2. Configure environment variables:

```bash
cp .env.template .env
# fill in the values
```

## Usage

Run scraper manually:

```bash
bun scrape
```

### Automated Execution

The included `scrape.sh` script is designed for cron execution:

```bash
chmod +x scrape.sh
crontab -e
```

Add cron entry (example runs daily at 2 AM):

```
0 2 * * * /path/to/scrape.sh >> /path/to/logs/scrape.log 2>&1
```

The script:

- Uses absolute paths for reliability
- Logs output to `logs/scrape.log`
- Includes timestamps for each run

## Requirements

- Bun runtime
- Google Chrome
- Google Cloud service account with Sheets API access
