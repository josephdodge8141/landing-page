# Project Agent Instructions

## Overview

This repository hosts the static `joedodge.dev` landing page. It displays dated
thoughts and ideas with fuzzy search, tag filters, date filters, and native HTML
collapsing.

## Constraints

- Keep the deployed site in `public`.
- Do not add packages, frameworks, a build step, or backend services.
- Keep idea bodies as trusted HTML strings in `public/ideas.json`.
- Keep the allowed tag enum in `public/tags.json`.
- Keep styling inline and limited to the title-centering declaration.
- Use native HTML elements before adding JavaScript behavior.

## Commands

- Run: `/usr/bin/python3 -m http.server 7310 --bind 0.0.0.0 --directory public`
- Test: `node --test tests/app.test.js`
- Syntax check: `node --check public/app.js`

## Deployment

- Cloudflare Workers Builds deploys `public` as static assets from `main` to
  `joedodge.dev` with no build command.
- `landing.joedodge.dev` is a Keycloak-protected local preview registered with
  the Not So Localhost registry.

Deploy command:

```sh
npx wrangler deploy --name landing-page --compatibility-date 2026-08-25 --assets ./public/
```
