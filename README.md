# Docs

https://api-docs.raidhub.io

# Contributing

If you notice a bug or want to fix something in the API, please fork the repo and create a PR
New features are harder to add because they might rely on data we do not have, but you are welcome to draft a PR and we will see what we can do.

# Running the API locally

Note: you will need to clone the [RaidHub-Services](https://github.com/Raid-Hub/RaidHub-Services) repository to connect to the database

### Local database

1. Clone the services repo
2. In the new cloned repo, run `cp example.env .env` and make any changes
3. Install [Docker desktop](https://www.docker.com/products/docker-desktop/)
4. Run `make postgres`

### Turning the API On

1. Run `cp example.env .env` and make any changes
2. Run `yarn db:migrate` -- This will apply the current database schema to your local database
3. Run `yarn dev`
4. By default the API is available at `http://localhost:8000`

Note: `yarn build`, `yarn start`, `yarn stop`, and `yarn restart` are production commands and do not need to be used in the dev environment

## Resources and Tools

-   TypeScript https://www.typescriptlang.org/docs/
-   Express.js (Framework) https://expressjs.com/
-   Zod (Schema Validation) https://zod.dev/
-   Zod to OpenAPI https://github.com/asteasolutions/zod-to-openapi
