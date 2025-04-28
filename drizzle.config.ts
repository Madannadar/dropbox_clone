import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({path: '.env.local'});

if(!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env.local file');
}

export default defineConfig({
    schema: './lib/db/schema.ts',
    out:'./drizzle', // output directory for the generated migration files
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },  
    migrations: {
        table: '__drizzle_migrations', // name of the table that will be used to store the migration history
        schema: 'public', // schema where the migration table will be created
    },
    verbose: true, // enable verbose logging for the migration process
    strict: true, // asks should i really want to run the migration
});