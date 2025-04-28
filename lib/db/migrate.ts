import { migrate } from 'drizzle-orm/neon-http/migrator';
import { drizzle } from 'drizzle-orm/neon-http'; // both migrate and drizzle should be from drizzle-orm/neon-http
import {neon} from '@neondatabase/serverless';

import * as dotenv from 'dotenv';

dotenv.config({path: '.env.local'});

if(!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env.local file');
}

async function runMigration() {
    try {
        const sql = neon(process.env.DATABASE_URL!);
        const db = drizzle(sql);

        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('Migrations completed successfully!');
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1); // Exit with failure code
    }
}

runMigration()