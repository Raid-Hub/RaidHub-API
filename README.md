# Docs

https://api-docs.raidhub.io

# Contributing

If you notice a bug or want to fix something in the API, please fork the repo and create a PR
New features are harder to add because they might rely on data we do not have, but you are welcome to draft a PR and we will see what we can do.

## Starting the API

1. Run `yarn generate`
2. Run `yarn dev`
3. By default the API is available at `http://localhost:8000`

Note: `yarn build`, `yarn start`, `yarn stop`, and `yarn restart` are production commands and do not need to be used in the dev environment

### Local database

1. Install [Docker desktop](https://www.docker.com/products/docker-desktop/)
2. Update your `.env` file with the proper environment explained in `example.env`
3. To set up your local database, run `yarn db:start`
4. Apply new changes to `schema.prisma` with `yarn db:push`
5. Reset database with `yarn db:reset`
6. Generate migration files with `yarn db:migrate`. At the moment, you should not commit any new migration files and instead modify the current ones. Migrations are applied manually.
7. To seed database, run `yarn db:seed Name#0001 Name2#0002 ...`

### Remote Database connection

_This option is only available to administrators_

1. Install [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
2. Add your SSH key to your SSH agent and DM Owen your public key
3. Update your `.env` file with the proper environment explained in `example.env`
4. Run `yarn tunnel` to create a tunnel from port 5432 to the remote database

## Resources and Tools

-   TypeScript https://www.typescriptlang.org/docs/
-   Express.js (Framework) https://expressjs.com/
-   Zod (Schema Validation) https://zod.dev/
-   Prisma (ORM) https://www.prisma.io/docs
-   Zod to OpenAPI https://github.com/asteasolutions/zod-to-openapi
