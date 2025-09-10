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
        
        const schemas = await this.getAllSchemas();
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
        const lowerQuestion = question.toLowerCase();
        const dbName = Object.keys(schemas)[0];
        const schema = schemas[dbName];
        
        if (!schema) return null;
        
        const tables = Object.keys(schema);
        console.log(chalk.gray(`📋 Available tables: ${tables.join(', ')}`));
        const tableMapping = this.createTableMapping(tables);
        
        if (lowerQuestion.includes('all') || lowerQuestion.includes('list')) {
            if (lowerQuestion.includes('artist')) {
                return { database: dbName, query: 'SELECT * FROM Artist ORDER BY Name' };
            }
            if (lowerQuestion.includes('album')) {
                return { database: dbName, query: `SELECT Album.AlbumId, Album.Title, Artist.Name as ArtistName 
                       FROM Album 
                       INNER JOIN Artist ON Album.ArtistId = Artist.ArtistId 
                       ORDER BY Artist.Name, Album.Title` };
            }
            if (lowerQuestion.includes('song') || lowerQuestion.includes('track')) {
                return { database: dbName, query: `SELECT Track.TrackId, Track.Name, Album.Title as AlbumTitle, Artist.Name as ArtistName
                       FROM Track 
                       INNER JOIN Album ON Track.AlbumId = Album.AlbumId
                       INNER JOIN Artist ON Album.ArtistId = Artist.ArtistId
                       ORDER BY Artist.Name, Album.Title, Track.TrackId` };
            }
            if (lowerQuestion.includes('customer')) {
                return { database: dbName, query: 'SELECT * FROM Customer ORDER BY LastName, FirstName' };
            }
            if (lowerQuestion.includes('employee')) {
                return { database: dbName, query: 'SELECT * FROM Employee ORDER BY LastName, FirstName' };
            }
            if (lowerQuestion.includes('invoice')) {
                return { database: dbName, query: `SELECT Invoice.InvoiceId, Invoice.InvoiceDate, Customer.FirstName, Customer.LastName, Invoice.Total
                       FROM Invoice 
                       INNER JOIN Customer ON Invoice.CustomerId = Customer.CustomerId
                       ORDER BY Invoice.InvoiceDate DESC` };
            }
            if (lowerQuestion.includes('genre')) {
                return { database: dbName, query: 'SELECT * FROM Genre ORDER BY Name' };
            }
            if (lowerQuestion.includes('playlist')) {
                return { database: dbName, query: 'SELECT * FROM Playlist ORDER BY Name' };
            }
            if (lowerQuestion.includes('mediatype')) {
                return { database: dbName, query: 'SELECT * FROM MediaType ORDER BY Name' };
            }
            if (lowerQuestion.includes('playlisttrack')) {
                return { database: dbName, query: `SELECT PlaylistTrack.PlaylistId, PlaylistTrack.TrackId, 
                       Playlist.Name as PlaylistName, Track.Name as TrackName
                       FROM PlaylistTrack 
                       INNER JOIN Playlist ON PlaylistTrack.PlaylistId = Playlist.PlaylistId
                       INNER JOIN Track ON PlaylistTrack.TrackId = Track.TrackId
                       ORDER BY PlaylistTrack.PlaylistId, PlaylistTrack.TrackId` };
            }
            if (lowerQuestion.includes('invoiceline')) {
                return { database: dbName, query: `SELECT InvoiceLine.InvoiceLineId, InvoiceLine.InvoiceId, 
                       Track.Name as TrackName, InvoiceLine.UnitPrice, InvoiceLine.Quantity
                       FROM InvoiceLine 
                       INNER JOIN Track ON InvoiceLine.TrackId = Track.TrackId
                       ORDER BY InvoiceLine.InvoiceId, InvoiceLine.InvoiceLineId` };
            }
        }
        
        if (lowerQuestion.includes('count') || lowerQuestion.includes('how many')) {
            if (lowerQuestion.includes('artist')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM Artist' };
            }
            if (lowerQuestion.includes('album')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM Album' };
            }
            if (lowerQuestion.includes('song') || lowerQuestion.includes('track')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM Track' };
            }
            if (lowerQuestion.includes('customer')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM Customer' };
            }
            if (lowerQuestion.includes('employee')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM Employee' };
            }
            if (lowerQuestion.includes('invoice')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM Invoice' };
            }
            if (lowerQuestion.includes('genre')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM Genre' };
            }
            if (lowerQuestion.includes('playlist')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM Playlist' };
            }
            if (lowerQuestion.includes('mediatype')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM MediaType' };
            }
            if (lowerQuestion.includes('playlisttrack')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM PlaylistTrack' };
            }
            if (lowerQuestion.includes('invoiceline')) {
                return { database: dbName, query: 'SELECT COUNT(*) as count FROM InvoiceLine' };
            }
        }
        
        const nameMatch = lowerQuestion.match(/(?:artist|album|song|track).*?(?:named|called)\\s+['"](.*?)['"]/) ||
                         lowerQuestion.match(/['"](.*?)['"].*?(?:artist|album|song|track)/);
        
        if (nameMatch) {
            const searchTerm = nameMatch[1];
            if (lowerQuestion.includes('artist')) {
                return { database: dbName, query: `SELECT * FROM Artist WHERE Name LIKE '%${searchTerm}%'` };
            }
            if (lowerQuestion.includes('album')) {
                return { database: dbName, query: `SELECT * FROM Album WHERE Title LIKE '%${searchTerm}%'` };
            }
            if (lowerQuestion.includes('song') || lowerQuestion.includes('track')) {
                return { database: dbName, query: `SELECT * FROM Track WHERE Name LIKE '%${searchTerm}%'` };
            }
        }
        
        if (lowerQuestion.includes('album') && lowerQuestion.includes('artist')) {
            return { 
                database: dbName, 
                query: `SELECT Album.Title as AlbumTitle, Artist.Name as ArtistName 
                       FROM Album 
                       INNER JOIN Artist ON Album.ArtistId = Artist.ArtistId 
                       LIMIT 20` 
            };
        }
        
        if (lowerQuestion.includes('track') && lowerQuestion.includes('album')) {
            return { 
                database: dbName, 
                query: `SELECT Track.Name as TrackName, Album.Title as AlbumTitle, Artist.Name as ArtistName
                       FROM Track 
                       INNER JOIN Album ON Track.AlbumId = Album.AlbumId
                       INNER JOIN Artist ON Album.ArtistId = Artist.ArtistId
                       LIMIT 20` 
            };
        }
        
        const firstMatch = lowerQuestion.match(/(?:first|top)\\s+(\\d+)\\s+(\\w+)/);
        if (firstMatch) {
            const limit = parseInt(firstMatch[1]);
            const entity = firstMatch[2].toLowerCase();
            
            if (entity.includes('album')) {
                return { 
                    database: dbName, 
                    query: `SELECT Album.AlbumId, Album.Title, Artist.Name as ArtistName 
                           FROM Album 
                           INNER JOIN Artist ON Album.ArtistId = Artist.ArtistId 
                           ORDER BY Album.AlbumId
                           LIMIT ${limit}` 
                };
            }
            if (entity.includes('artist')) {
                return { 
                    database: dbName, 
                    query: `SELECT * FROM Artist ORDER BY Name LIMIT ${limit}` 
                };
            }
            if (entity.includes('track') || entity.includes('song')) {
                return { 
                    database: dbName, 
                    query: `SELECT Track.Name, Album.Title as AlbumTitle, Artist.Name as ArtistName
                           FROM Track 
                           INNER JOIN Album ON Track.AlbumId = Album.AlbumId
                           INNER JOIN Artist ON Album.ArtistId = Artist.ArtistId
                           ORDER BY Track.TrackId
                           LIMIT ${limit}` 
                };
            }
            if (entity.includes('customer')) {
                return { 
                    database: dbName, 
                    query: `SELECT * FROM Customer ORDER BY CustomerId LIMIT ${limit}` 
                };
            }
            if (entity.includes('invoice') && !entity.includes('invoiceline')) {
                return { 
                    database: dbName, 
                    query: `SELECT Invoice.InvoiceId, Invoice.InvoiceDate, Customer.FirstName, Customer.LastName, Invoice.Total
                           FROM Invoice 
                           INNER JOIN Customer ON Invoice.CustomerId = Customer.CustomerId
                           ORDER BY Invoice.InvoiceDate DESC
                           LIMIT ${limit}` 
                };
            }
            if (entity.includes('invoiceline')) {
                return { 
                    database: dbName, 
                    query: `SELECT InvoiceLine.InvoiceLineId, Track.Name as TrackName, InvoiceLine.UnitPrice, InvoiceLine.Quantity
                           FROM InvoiceLine 
                           INNER JOIN Track ON InvoiceLine.TrackId = Track.TrackId
                           ORDER BY InvoiceLine.InvoiceLineId
                           LIMIT ${limit}` 
                };
            }
        }
        
        if (lowerQuestion.includes('sales') || lowerQuestion.includes('revenue')) {
            return { 
                database: dbName, 
                query: `SELECT Customer.FirstName, Customer.LastName, SUM(Invoice.Total) as TotalSpent
                       FROM Customer 
                       INNER JOIN Invoice ON Customer.CustomerId = Invoice.CustomerId
                       GROUP BY Customer.CustomerId
                       ORDER BY TotalSpent DESC` 
            };
        }
        
        if (lowerQuestion.includes('popular') && lowerQuestion.includes('track')) {
            return { 
                database: dbName, 
                query: `SELECT Track.Name, Album.Title, Artist.Name, COUNT(InvoiceLine.TrackId) as TimesPurchased
                       FROM Track
                       INNER JOIN Album ON Track.AlbumId = Album.AlbumId
                       INNER JOIN Artist ON Album.ArtistId = Artist.ArtistId
                       LEFT JOIN InvoiceLine ON Track.TrackId = InvoiceLine.TrackId
                       GROUP BY Track.TrackId
                       ORDER BY TimesPurchased DESC` 
            };
        }
        
        if (lowerQuestion.includes('tracks') && lowerQuestion.includes('playlist')) {
            return { 
                database: dbName, 
                query: `SELECT Playlist.Name as PlaylistName, COUNT(PlaylistTrack.TrackId) as NumberOfTracks
                       FROM Playlist 
                       LEFT JOIN PlaylistTrack ON Playlist.PlaylistId = PlaylistTrack.PlaylistId
                       GROUP BY Playlist.PlaylistId, Playlist.Name
                       ORDER BY NumberOfTracks DESC` 
            };
        }
        
        if (lowerQuestion.includes('format') || (lowerQuestion.includes('media') && lowerQuestion.includes('type'))) {
            return { 
                database: dbName, 
                query: `SELECT MediaType.Name as MediaFormat, COUNT(Track.TrackId) as NumberOfTracks
                       FROM MediaType 
                       LEFT JOIN Track ON MediaType.MediaTypeId = Track.MediaTypeId
                       GROUP BY MediaType.MediaTypeId, MediaType.Name
                       ORDER BY NumberOfTracks DESC` 
            };
        }
        
        if (lowerQuestion.includes('detailed') && lowerQuestion.includes('invoice')) {
            return { 
                database: dbName, 
                query: `SELECT Invoice.InvoiceId, Invoice.InvoiceDate, Customer.FirstName, Customer.LastName,
                       Track.Name as TrackName, InvoiceLine.UnitPrice, InvoiceLine.Quantity,
                       (InvoiceLine.UnitPrice * InvoiceLine.Quantity) as LineTotal
                       FROM Invoice 
                       INNER JOIN Customer ON Invoice.CustomerId = Customer.CustomerId
                       INNER JOIN InvoiceLine ON Invoice.InvoiceId = InvoiceLine.InvoiceId
                       INNER JOIN Track ON InvoiceLine.TrackId = Track.TrackId
                       ORDER BY Invoice.InvoiceDate DESC, Invoice.InvoiceId` 
            };
        }
        
        if (lowerQuestion.includes('tables') || lowerQuestion.includes('structure')) {
            return { 
                database: dbName, 
                query: `SELECT name as TableName FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name` 
            };
        }
        
        for (const table of tables) {
            const lowerTable = table.toLowerCase();
            if (lowerQuestion.includes(lowerTable)) {
                if (table === 'PlaylistTrack') {
                    return { database: dbName, query: `SELECT PlaylistTrack.*, Playlist.Name as PlaylistName, Track.Name as TrackName
                           FROM PlaylistTrack 
                           INNER JOIN Playlist ON PlaylistTrack.PlaylistId = Playlist.PlaylistId
                           INNER JOIN Track ON PlaylistTrack.TrackId = Track.TrackId
                           ORDER BY PlaylistTrack.PlaylistId, PlaylistTrack.TrackId` };
                }
                else if (table === 'InvoiceLine') {
                    return { database: dbName, query: `SELECT InvoiceLine.*, Track.Name as TrackName
                           FROM InvoiceLine 
                           INNER JOIN Track ON InvoiceLine.TrackId = Track.TrackId
                           ORDER BY InvoiceLine.InvoiceLineId` };
                }
                else {
                    const idColumn = `${table}Id`;
                    return { database: dbName, query: `SELECT * FROM ${table} ORDER BY ${idColumn}` };
                }
            }
        }
        
        for (const [term, tableName] of Object.entries(tableMapping)) {
            if (lowerQuestion.includes(term)) {
                if (tableName === 'PlaylistTrack') {
                    return { database: dbName, query: `SELECT PlaylistTrack.*, Playlist.Name as PlaylistName, Track.Name as TrackName
                           FROM PlaylistTrack 
                           INNER JOIN Playlist ON PlaylistTrack.PlaylistId = Playlist.PlaylistId
                           INNER JOIN Track ON PlaylistTrack.TrackId = Track.TrackId
                           ORDER BY PlaylistTrack.PlaylistId, PlaylistTrack.TrackId` };
                }
                else if (tableName === 'InvoiceLine') {
                    return { database: dbName, query: `SELECT InvoiceLine.*, Track.Name as TrackName
                           FROM InvoiceLine 
                           INNER JOIN Track ON InvoiceLine.TrackId = Track.TrackId
                           ORDER BY InvoiceLine.InvoiceLineId` };
                }
                else {
                    const idColumn = `${tableName}Id`;
                    return { database: dbName, query: `SELECT * FROM ${tableName} ORDER BY ${idColumn}` };
                }
            }
        }
        
        if (tables.includes('Album')) {
            return { database: dbName, query: `SELECT Album.Title, Artist.Name FROM Album INNER JOIN Artist ON Album.ArtistId = Artist.ArtistId ORDER BY Artist.Name LIMIT 20` };
        }
        
        const firstTable = tables[0];
        return { database: dbName, query: `SELECT * FROM ${firstTable} LIMIT 20` };
    }

    createTableMapping(tables) {
        const mapping = {};
        
        tables.forEach(table => {
            const lowerTable = table.toLowerCase();
            mapping[lowerTable] = table;
            if (table === 'Artist') {
                mapping['artists'] = table;
                mapping['musician'] = table;
                mapping['musicians'] = table;
            }
            if (table === 'Album') {
                mapping['albums'] = table;
                mapping['record'] = table;
                mapping['records'] = table;
            }
            if (table === 'Track') {
                mapping['tracks'] = table;
                mapping['song'] = table;
                mapping['songs'] = table;
                mapping['music'] = table;
            }
            if (table === 'Customer') {
                mapping['customers'] = table;
                mapping['client'] = table;
                mapping['clients'] = table;
            }
            if (table === 'Invoice') {
                mapping['invoices'] = table;
                mapping['sale'] = table;
                mapping['sales'] = table;
                mapping['purchase'] = table;
                mapping['purchases'] = table;
            }
            if (table === 'InvoiceLine') {
                mapping['invoicelines'] = table;
                mapping['invoiceline'] = table;
                mapping['lineitem'] = table;
                mapping['lineitems'] = table;
            }
            if (table === 'PlaylistTrack') {
                mapping['playlisttracks'] = table;
                mapping['playlisttrack'] = table;
            }
            if (table === 'MediaType') {
                mapping['mediatypes'] = table;
                mapping['mediatype'] = table;
                mapping['format'] = table;
                mapping['formats'] = table;
            }
            if (table === 'Genre') {
                mapping['genres'] = table;
                mapping['category'] = table;
                mapping['categories'] = table;
            }
            if (table === 'Employee') {
                mapping['employees'] = table;
                mapping['staff'] = table;
                mapping['worker'] = table;
                mapping['workers'] = table;
            }
            if (table === 'Playlist') {
                mapping['playlists'] = table;
            }
        });
        
        return mapping;
    }

    formatResults(results, originalQuestion) {
        if (results.length === 1 && results[0].count !== undefined) {
            return `Found ${results[0].count} records.`;
        }
        
        let response = `Found ${results.length} result(s):\\n\\n`;
        
        const maxResults = Math.min(results.length, 100);
        
        results.slice(0, maxResults).forEach((row, index) => {
            response += `${index + 1}. `;
            const fields = Object.entries(row)
                .filter(([key, value]) => value !== null && value !== '')
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            response += fields + '\\n';
        });
        
        if (results.length > maxResults) {
            response += `\\n... and ${results.length - maxResults} more results.`;
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
