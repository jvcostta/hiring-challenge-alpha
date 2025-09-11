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
            description: `Execute SQL queries on a music database. 
            Essential for answering any questions about artists, albums, or tracks.
            The input to this tool MUST be a valid SQLite SQL query.
            
            Database schema:

            - Table "Artist": columns (ArtistId, Name)
            - Table "Album": columns (AlbumId, Title, ArtistId)
            - Table "Track": columns (TrackId, Name, AlbumId, MediaTypeId, GenreId, Composer, Milliseconds, Bytes, UnitPrice)
            - Table "Genre": columns (GenreId, Name)
            - Table "MediaType": columns (MediaTypeId, Name)
            - Table "Playlist": columns (PlaylistId, Name)
            - Table "PlaylistTrack": columns (PlaylistId, TrackId)
            - Table "Invoice": columns (InvoiceId, CustomerId, InvoiceDate, BillingAddress, BillingCity, BillingState, BillingCountry, BillingPostalCode, Total)
            - Table "InvoiceLine": columns (InvoiceLineId, InvoiceId, TrackId, UnitPrice, Quantity)
            - Table "Customer": columns (CustomerId, FirstName, LastName, Company, Address, City, State, Country, PostalCode, Phone, Fax, Email, SupportRepId)
            - Table "Employee": columns (EmployeeId, LastName, FirstName, Title, ReportsTo, BirthDate, HireDate, Address, City, State, Country, PostalCode, Phone, Fax, Email)
            
            Use JOINs when the question involves multiple tables.
            Example: "What are the Beatles' albums?" -> Generated SQL query: "SELECT Album.Title FROM Artist JOIN Album ON Artist.ArtistId = Album.ArtistId WHERE Artist.Name LIKE '%Beatles%'"
            
            IMPORTANT: You are the agent responsible for ALL SQL logic. Generate complete, valid SQL queries based on the user's natural language request.`,
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
            // Get the first available database (assuming it's the music database)
            const dbName = Array.from(this.databases.keys())[0];
            const db = this.databases.get(dbName);
            
            if (!db) {
                return 'No database available for querying.';
            }

            console.log(chalk.blue(`      🔍 Executing SQL: ${sqlQuery}`));
            
            const results = await db.allAsync(sqlQuery);
            
            if (results.length === 0) {
                return 'No results found for your query.';
            }
            
            return this.formatResults(results);
        } catch (error) {
            const errorMessage = error.message;
            console.error(chalk.red('      ❌ Database query error:'), errorMessage);
            return `Database query error: ${errorMessage}. Please check if the SQL query is correct and try again.`;
        }
    }

    formatResults(results) {
        if (results.length === 1 && results[0].count !== undefined) {
            return `The result is ${results[0].count}.`;
        }
        
        let response = `Found ${results.length} result(s):\n\n`;
        
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