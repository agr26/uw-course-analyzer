```markdown
# UW Course History Analyzer

A tool to analyze historical course offerings at University of Washington and provide insights through a Chrome extension.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Run the scraper:
```bash
python -m scraper.time_schedule
```

3. Start the API server:
```bash
python -m api.app
```

## Project Structure
- `scraper/`: Course data collection scripts
- `database/`: Database models and management
- `api/`: Flask API server
- `extension/`: Chrome extension files
```