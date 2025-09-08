import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

export class SqliteDataSource {
    constructor() {
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
                
                // Promisify database methods
                db.allAsync = promisify(db.all.bind(db));
                db.getAsync = promisify(db.get.bind(db));
                db.runAsync = promisify(db.run.bind(db));
                
                this.databases.set(dbName, db);
                console.log(chalk.gray(`    📦 Loaded database: ${dbName}`));
            } catch (error) {
                console.warn(chalk.yellow(`    ⚠️  Failed to load database ${dbFile}: ${error.message}`));
            }
        }

        if (this.databases.size === 0) {
            throw new Error('No SQLite databases could be loaded');
        }
    }

    async getSchema(dbName) {
        const db = this.databases.get(dbName);
        if (!db) return null;

        try {
            const tables = await db.allAsync(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            );
            
            const schema = {};
            for (const table of tables) {
                const columns = await db.allAsync(`PRAGMA table_info(${table.name})`);
                schema[table.name] = columns.map(col => ({
                    name: col.name,
                    type: col.type,
                    nullable: !col.notnull,
                    primary_key: col.pk === 1
                }));
            }
            
            return schema;
        } catch (error) {
            console.error(`Error getting schema for ${dbName}:`, error);
            return null;
        }
    }

    async getAllSchemas() {
        const schemas = {};
        for (const [dbName] of this.databases) {
            schemas[dbName] = await this.getSchema(dbName);
        }
        return schemas;
    }

    async query(userQuestion) {
        console.log(chalk.blue('🔍 Analyzing question for SQLite query...'));
        
        // Get all available schemas
        const schemas = await this.getAllSchemas();
        
        // Generate SQL query based on the user question and available schemas
        const sqlQuery = await this.generateSqlQuery(userQuestion, schemas);
        
        if (!sqlQuery) {
            return 'I could not generate a valid SQL query for your question. Please try rephrasing your question or ask about music-related data.';
        }

        console.log(chalk.gray(`📝 Generated SQL: ${sqlQuery.query}`));
        
        try {
            const db = this.databases.get(sqlQuery.database);
            const results = await db.allAsync(sqlQuery.query);
            
            if (results.length === 0) {
                return 'No results found for your query.';
            }
            
            return this.formatResults(results, userQuestion);
        } catch (error) {
            console.error(chalk.red('SQL execution error:'), error.message);
            return `Database query error: ${error.message}`;
        }
    }

    async generateSqlQuery(question, schemas) {
        // Simple query generation based on keywords
        // In a production system, you might use an LLM to generate SQL queries
        
        const lowerQuestion = question.toLowerCase();
        
        // Default to the first available database (usually 'music')
        const dbName = Object.keys(schemas)[0];
        const schema = schemas[dbName];
        
        if (!schema) return null;
        
        const tables = Object.keys(schema);
        
        // Basic query patterns
        if (lowerQuestion.includes('all') || lowerQuestion.includes('list')) {
            if (lowerQuestion.includes('artist')) {
                return { database: dbName, query: 'SELECT * FROM artists LIMIT 10' };
            }
            if (lowerQuestion.includes('album')) {
                return { database: dbName, query: 'SELECT * FROM albums LIMIT 10' };
            }
            if (lowerQuestion.includes('song') || lowerQuestion.includes('track')) {
                return { database: dbName, query: 'SELECT * FROM tracks LIMIT 10' };
            }
        }
        
        if (lowerQuestion.includes('count')) {
            if (lowerQuestion.includes('artist')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM artists' };
            }
            if (lowerQuestion.includes('album')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM albums' };
            }
            if (lowerQuestion.includes('song') || lowerQuestion.includes('track')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM tracks' };
            }
        }
        
        // Search by name
        const nameMatch = lowerQuestion.match(/(?:artist|album|song|track).*?(?:named|called)\\s+['"](.*?)['"]/) ||
                         lowerQuestion.match(/['"](.*?)['"].*?(?:artist|album|song|track)/);
        
        if (nameMatch) {
            const searchTerm = nameMatch[1];
            if (lowerQuestion.includes('artist')) {
                return { database: dbName, query: `SELECT * FROM artists WHERE name LIKE '%${searchTerm}%'` };
            }
            if (lowerQuestion.includes('album')) {
                return { database: dbName, query: `SELECT * FROM albums WHERE title LIKE '%${searchTerm}%'` };
            }
            if (lowerQuestion.includes('song') || lowerQuestion.includes('track')) {
                return { database: dbName, query: `SELECT * FROM tracks WHERE name LIKE '%${searchTerm}%'` };
            }
        }
        
        // Default query - show some sample data
        const firstTable = tables[0];
        return { database: dbName, query: `SELECT * FROM ${firstTable} LIMIT 5` };
    }

    formatResults(results, originalQuestion) {
        if (results.length === 1 && results[0].count !== undefined) {
            return `Found ${results[0].count} records.`;
        }
        
        let response = `Found ${results.length} result(s):\\n\\n`;
        
        results.slice(0, 10).forEach((row, index) => {
            response += `${index + 1}. `;
            const fields = Object.entries(row)
                .filter(([key, value]) => value !== null && value !== '')
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            response += fields + '\\n';
        });
        
        if (results.length > 10) {
            response += `\\n... and ${results.length - 10} more results.`;
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
