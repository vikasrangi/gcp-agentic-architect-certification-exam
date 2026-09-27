# GCP Agentic Architect Certification Exam

This project is a simple exam-style UI for practicing Google Cloud Agentic Architecture multiple-choice questions.

## Features

- Multiple-choice question flow
- Correct/wrong result feedback for every answer
- Explanation shown for both correct and incorrect selections
- Progress and score tracking
- Reset and navigation controls
- Works by opening `index.html` directly in a browser

## Files

- `index.html` – main exam page
- `styles.css` – styling
- `app.js` – exam behavior and scoring
- `exam-data.js` – embedded question dataset

## Run locally

Open `index.html` directly in any browser.

Or run a local static server:

```bash
cd /Users/vikas/certification
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000/index.html
```

## Notes

The exam content is stored in `exam-data.js` so the app can be opened directly from a browser without needing a local JSON fetch.
