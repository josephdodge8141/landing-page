# landing-page

Current thoughts and ideas at [joedodge.dev](https://joedodge.dev).

The site is plain HTML, inline CSS, JavaScript, and JSON. It has no packages,
build step, framework, or backend.

## Files

- `public/index.html` contains the one-page interface.
- `public/app.js` loads content and implements search and filters.
- `public/ideas.json` stores dated ideas with HTML bodies.
- `public/tags.json` defines the allowed tag enum.

## Run locally

```sh
/usr/bin/python3 -m http.server 7310 --bind 0.0.0.0 --directory public
```

Open <http://localhost:7310>.

## Test

```sh
node --test tests/app.test.js
```

## Deploy

Cloudflare Pages deploys `public` from the `main` branch with no build command.
The public custom domain is `joedodge.dev`. Local remote testing is available at
`landing.joedodge.dev` through the Not So Localhost registry and Keycloak.
