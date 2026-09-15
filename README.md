# Scientific Calculator

A professional, responsive scientific calculator built with vanilla HTML, CSS, and JavaScript.

## Features

- Basic arithmetic
- Scientific functions
- DEG / RAD angle modes
- Factorials
- Powers and square roots
- Logarithms and natural logarithms
- Constants π, e, and ANS
- Memory: MC, MR, M+, M−
- Calculation history
- Keyboard controls
- Light/dark theme
- Responsive mobile layout
- Safe custom expression parser (no `eval()`)

## Run locally

Open `index.html` in a browser, or serve the directory with any static web server.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy on Render

Create a new **Static Site** on Render and connect this GitHub repository.

- Build command: leave empty
- Publish directory: `.`
- The site entry point is `index.html`

`render.yaml` is included for Blueprint-based deployment.
