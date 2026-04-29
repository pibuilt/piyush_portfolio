# Piyush Bhuyan Portfolio

A terminal-inspired portfolio built with React, TypeScript, and Vite. The page behaves like a command-driven interface: you type commands such as `/about`, `/projects`, or `/resume`, see a short processing phase, and then get a clean terminal-style response.

This project is fully static and designed to be hosted on GitHub Pages.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Available Commands](#available-commands)
- [Local Development](#local-development)
- [Build](#build)
- [GitHub Pages Deployment](#github-pages-deployment)

---

## Overview

This portfolio is not a traditional multi-section landing page.

Instead, it presents personal and professional information through a CLI-like interaction model:

- The page itself acts like a terminal
- Commands are entered into a single prompt
- Results render as terminal output
- Only the latest command/output is shown, keeping the experience focused
- A side command drawer can be opened when needed

The design direction is inspired by modern coding tools and terminal interfaces, with a green-accent theme and a minimal static footprint.

---

## Features

- Terminal-style portfolio interaction
- Slash-command discovery and autocomplete
- Inline `Scaffolding...` and `Thinking...` states before output
- Single-result transcript flow instead of long scrolling history
- Side drawer for available commands
- Resume download from both a top link and `/resume`
- Static deployment-friendly architecture with no backend

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Plain CSS |
| Hosting Target | GitHub Pages |

---

## Project Structure

```text
Portfolio/
├── public/
│   └── Piyush_Bhuyan_Resume.pdf
├── src/
│   ├── data/
│   │   └── portfolio.ts      # typed content and command definitions
│   ├── App.tsx               # terminal interaction and UI flow
│   ├── main.tsx              # app entry
│   ├── styles.css            # terminal styling
│   └── vite-env.d.ts         # Vite typings
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## How It Works

### Interaction Flow

1. The user types a command into the prompt
2. The terminal shows a short processing phase
3. The resolved content is rendered as terminal output
4. The prompt returns below the latest result

### Content Model

All portfolio content is stored in `src/data/portfolio.ts`.

That file defines:

- available commands
- aliases
- descriptions
- portfolio content for each section

This keeps the UI logic separate from the actual portfolio data.

### Resume Download

The resume PDF is stored in `public/Piyush_Bhuyan_Resume.pdf`.

Because it lives in `public/`, it is copied directly into the final static build and can be downloaded via:

- the top `resume` link
- the `/resume` command

---

## Available Commands

Current commands include:

- `/help`
- `/about`
- `/experience`
- `/projects`
- `/skillset`
- `/certifications`
- `/credentials`
- `/education`
- `/publications`
- `/connect`
- `/resume`

Aliases are also supported for some commands.

---

## Local Development

### Prerequisites

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Start the dev server

```bash
npm run dev
```

Vite will start a local development server and you can test the portfolio in the browser.

---

## Build

Create a production build with:

```bash
npm run build
```

Preview the production output locally with:

```bash
npm run preview
```

---

## GitHub Pages Deployment

This project is already set up as a static Vite app, so deployment is straightforward.

### Option A: Deploy manually

1. Build the project:

```bash
npm run build
```

2. The output will be created in:

```text
dist/
```

3. Publish the contents of `dist/` to your GitHub Pages branch or Pages source.

### Option B: Deploy with GitHub Actions

You can create a workflow that:

1. installs dependencies
2. runs `npm run build`
3. uploads `dist/`
4. deploys it to GitHub Pages

### Notes

- `vite.config.ts` uses a relative base path, which works well for static hosting
- The resume file in `public/` will also be available in the deployed site
- No server-side runtime is required

---

## Notes

- This is a static portfolio, not a backend app
- There is no database, authentication layer, or API dependency
- Most future customization will happen in `src/data/portfolio.ts` and `src/styles.css`

