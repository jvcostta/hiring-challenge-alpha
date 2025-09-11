import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

export class DatabaseTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'database_query',
            description: `You are an expert SQL assistant for a music database.
- ALWAYS generate syntactically correct SQLite queries.
- Only SELECT queries are allowed (NO INSERT, UPDATE, DELETE, DROP).
- Use explicit SELECT columns instead of SELECT *.
- Use table aliases (e.g., ar, a, t) for clarity in JOINs.
- When filtering text, prefer "LIKE '%term%'" instead of "=" for robustness.
- Return aggregated values using COUNT, SUM, AVG, etc., if the user asks for totals, averages, or counts.
- Use LIMIT 10 for large result sets unless the user explicitly asks for all.
- The database schema is:

Artist(ArtistId, Name)
Album(AlbumId, Title, ArtistId)
Track(TrackId, Name, AlbumId, MediaTypeId, GenreId, Composer, Milliseconds, Bytes, UnitPrice)
Genre(GenreId, Name)
MediaType(MediaTypeId, Name)
Playlist(PlaylistId, Name)
PlaylistTrack(PlaylistId, TrackId)
Invoice(InvoiceId, CustomerId, InvoiceDate, BillingAddress, BillingCity, BillingState, BillingCountry, BillingPostalCode, Total)
InvoiceLine(InvoiceLineId, InvoiceId, TrackId, UnitPrice, Quantity)
Customer(CustomerId, FirstName, LastName, Company, Address, City, State, Country, PostalCode, Phone, Fax, Email, SupportRepId)
Employee(EmployeeId, LastName, FirstName, Title, ReportsTo, BirthDate, HireDate, Address, City, State, Country, PostalCode, Phone, Fax, Email)

Examples:
Q: "What are the Beatles' albums?"
SQL: SELECT a.Title FROM Artist ar JOIN Album a ON ar.ArtistId = a.ArtistId WHERE ar.Name LIKE '%Beatles%';

Q: "How many tracks are in the database?"
SQL: SELECT COUNT(*) as count FROM Track;

Q: "List customers from Brazil"
SQL: SELECT FirstName, LastName, Email FROM Customer WHERE Country = 'Brazil';

Q: "Top 5 longest tracks"
SQL: SELECT Name, Milliseconds FROM Track ORDER BY Milliseconds DESC LIMIT 5;
            `,
            schema: z.object({
                sqlQuery: z.string().describe("The complete and valid SQLite SQL query to execute."),
            }),
            func: async ({ sqlQuery }) => {
                return await this.executeQuery(sqlQuery);
            },
        });
        
        this.databases = new Map();
        this.dataPath = path.join(process.cwd(), 'data', 'sqlite');
    }

    async initialize() {
        if (!fs.existsSync(this.dataPath)) {
            throw new Error(`SQLite data directory not found: ${this.dataPath}`);
        }

        const dbFiles = fs.readdirSync(this.dataPath).filter(file => file.endsWith('.db'));
        
        if (dbFiles.length === 0) {
            throw new Error('No SQLite database files found in data/sqlite directory');
        }

        for (const dbFile of dbFiles) {
            const dbPath = path.join(this.dataPath, dbFile);
            const dbName = path.basename(dbFile, '.db');
            
            try {
                const db = new sqlite3.Database(dbPath);
                
                // Promisify for async/await usage
                db.allAsync = promisify(db.all.bind(db));
                db.getAsync = promisify(db.get.bind(db));
                db.runAsync = promisify(db.run.bind(db));
                
                this.databases.set(dbName, db);
                console.log(chalk.gray(`      📦 Database tool loaded: ${dbName}`));
            } catch (error) {
                console.warn(chalk.yellow(`      ⚠️  Failed to load database ${dbFile}: ${error.message}`));
            }
        }

        if (this.databases.size === 0) {
            throw new Error('No SQLite databases could be loaded');
        }
    }

    async executeQuery(sqlQuery) {
        try {
            // Safety check: block write operations
            if (/drop|delete|update|insert/i.test(sqlQuery)) {
                return '⚠️ Write operations (INSERT, UPDATE, DELETE, DROP) are not allowed. Only SELECT queries are permitted.';
            }

            // Get the first available database (assuming it's the music database)
            const dbName = Array.from(this.databases.keys())[0];
            const db = this.databases.get(dbName);
            
            if (!db) {
                return 'No database available for querying.';
            }

            console.log(chalk.blue(`      🔍 Executing SQL: ${sqlQuery}`));
            
            const results = await db.allAsync(sqlQuery);
            
            if (results.length === 0) {
                return `Executed SQL: ${sqlQuery}\n\nNo results found for your query.`;
            }
            
            return this.formatResults(sqlQuery, results);
        } catch (error) {
            const errorMessage = error.message;
            console.error(chalk.red('      ❌ Database query error:'), errorMessage);
            return `❌ SQL Error: ${errorMessage}.
Executed SQL: ${sqlQuery}
💡 Tip: Check table/column names against the schema. Remember: this is SQLite, not MySQL/Postgres.`;
        }
    }

    formatResults(sqlQuery, results) {
        if (results.length === 1 && results[0].count !== undefined) {
            return `Executed SQL: ${sqlQuery}\n\nThe result is ${results[0].count}.`;
        }
        
        let response = `Executed SQL: ${sqlQuery}\n\nFound ${results.length} result(s):\n\n`;
        
        // Limit display to avoid overwhelming the LLM context
        results.slice(0, 10).forEach((row, index) => {
            response += `${index + 1}. `;
            const fields = Object.entries(row)
                .filter(([, value]) => value !== null && value !== '')
                .map(([key, value]) => `${key}: ${value}`)
                .join(' | ');
            response += fields + '\n';
        });
        
        if (results.length > 10) {
            response += `\n... and ${results.length - 10} more results.`;
        }
        
        return response;
    }

    async close() {
        for (const [name, db] of this.databases) {
            db.close((err) => {
                if (err) {
                    console.error(`Error closing database ${name}:`, err);
                }
            });
        }
        this.databases.clear();
    }
}
