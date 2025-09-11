import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

// Simple implementation without RAG/embeddings to avoid API key dependency.
// The tool reads the file content into memory and performs a search.
export class FileTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'file_search', // Renamed to match what the LLM is calling
            description: `Searches for a query within the content of pre-loaded text files (e.g., economy_books.txt).
            Use this to answer questions about economics, specific theories, or economists mentioned in the documents.`,
            schema: z.object({
                query: z.string().describe("The keyword or phrase to search for in the document content."),
            }),
            func: async ({ query }) => {
                return await this.searchInFiles(query);
            },
        });
        
        this.dataPath = path.join(process.cwd(), 'data', 'documents');
        this.fileContents = new Map(); // Stores file content in memory
    }

    async initialize() {
        try {
            if (!fs.existsSync(this.dataPath)) {
                console.warn(chalk.yellow(`      ⚠️  Documents directory not found: ${this.dataPath}`));
                return;
            }

            const txtFiles = fs.readdirSync(this.dataPath).filter(file => file.endsWith('.txt'));
            if (txtFiles.length === 0) {
                console.warn(chalk.yellow('      ⚠️  No .txt files found in the documents directory.'));
                return;
            }
            
            console.log(chalk.gray(`      📄 Loading ${txtFiles.length} document(s) into memory...`));

            for (const file of txtFiles) {
                const filePath = path.join(this.dataPath, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                this.fileContents.set(file, content);
            }
            console.log(chalk.green('  ✅ File tool ready'));
        } catch (error) {
            console.error(chalk.red(`  ⚠️  File tool failed to initialize: ${error.message}`));
            // Allow the agent to continue running even if this tool fails
        }
    }

    async searchInFiles(query) {
        if (this.fileContents.size === 0) {
            return "File tool is not available because no documents were loaded.";
        }

        console.log(chalk.blue(`      🔍 Searching documents for: "${query}"`));

        // For simplicity, we search across all loaded files.
        let combinedContent = "";
        for (const content of this.fileContents.values()) {
            combinedContent += content + "\n\n";
        }

        // This is a simple keyword search. The real "magic" happens when the LLM
        // gets this context and formulates an answer.
        const searchRegex = new RegExp(query.split(' ').join('.*'), 'is');
        const match = combinedContent.match(searchRegex);

        if (match) {
            // Return a snippet of context around the match
            const contextSnippet = combinedContent.substring(Math.max(0, match.index - 250), Math.min(combinedContent.length, match.index + 250));
            return `Found relevant context: "...${contextSnippet}..."`;
        }

        return "No direct matches found for your query in the documents. The agent can try a broader query.";
    }
}