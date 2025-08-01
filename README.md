# rudyisme.com

Source files for the website rudyisme.com. It uses [Eleventy](https://www.11ty.dev) and [Sass](https://sass-lang.com).

## Requirements

- Node.js 18 or higher

## Commands

- `npm run build` Build Eleventy and Sass files
- `npm run watch` Build and watch Eleventy and Sass files
- `npm run build:eleventy` Build Eleventy files
- `npm run watch:eleventy` Build and watch Eleventy files
- `npm run build:sass` Build Sass files
- `npm run watch:sass` Build and watch Sass files

## Run locally

When running locally with `npm run watch` or `npm run watch:eleventy`, a webserver is started. It can be reached through http://localhost:8080. Any changes to Eleventy files will automatically be refresh the page. 

## Deployment

Deployment is done using GitHub Actions. See `.github/workflows/deploy.yaml` for the steps involved.

The following secrets need to be added to the repository:

| Name            | Description                                              |
|-----------------|----------------------------------------------------------|
| SSH_HOST        | The host the code should be deployed to                  |
| SSH_PRIVATE_KEY | The SSH private key needed to connect to the host        |
| SSH_TARGET_DIR  | The directory on the host the code should be deployed to |
| SSH_USER        | The user needed to connect to the host                   |