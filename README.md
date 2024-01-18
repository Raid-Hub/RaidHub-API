# Using the API

1. Run `yarn generate`
2. Run `yarn dev`
3. By default the API is available at `http://localhost:8000`

Note: `yarn build`, `yarn start`, `yarn stop`, and `yarn restart` are production commands and do not need to be used in the dev environment

# Remote Database connection

1. Install [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
2. Add your SSH key to your SSH agent and DM Owen your public key
3. Update your `.env` file with the proper environment explained in `example.env`
4. Run `yarn tunnel` to create a tunnel from port 5432 to the remote database

# Local database

1. Install [Docker desktop](https://www.docker.com/products/docker-desktop/)
2. Update your `.env` file with the proper environment explained in `example.env`
3. To set up your local database, run `yarn db:start`
4. Apply new changes to `schema.prisma` with `yarn db:push`
5. Reset database with `yarn db:reset`
6. Generate migration files with `yarn db:migrate`. At the moment, you should not commit any new migration files and instead modify the current ones. Migrations are applied manually
7. To seed database, run `yarn db:seed Name#0000`
