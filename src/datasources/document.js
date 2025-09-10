import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export class DocumentDataSource {
    constructor() {
        this.documents = new Map();
        this.dataPath = path.join(process.cwd(), 'data', 'documents');
    }

    async initialize() {
        if (!fs.existsSync(this.dataPath)) {
            throw new Error(`Documents data directory not found: ${this.dataPath}`);
        }

        const txtFiles = fs.readdirSync(this.dataPath).filter(file => file.endsWith('.txt'));
        
        if (txtFiles.length === 0) {
            throw new Error('No text documents found in data/documents directory');
        }

        for (const txtFile of txtFiles) {
            const filePath = path.join(this.dataPath, txtFile);
            const fileName = path.basename(txtFile, '.txt');
            
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                this.documents.set(fileName, {
                    filename: txtFile,
                    content: content,
                    path: filePath
                });
                console.log(chalk.gray(`    📄 Loaded document: ${fileName}`));
            } catch (error) {
                console.warn(chalk.yellow(`    ⚠️  Failed to load document ${txtFile}: ${error.message}`));
            }
        }

        if (this.documents.size === 0) {
            throw new Error('No documents could be loaded');
        }
    }

    async search(userQuestion) {
        console.log(chalk.blue('🔍 Searching documents...'));
        
        const searchTerms = this.extractSearchTerms(userQuestion);
        console.log(chalk.gray(`🔎 Search terms: ${searchTerms.join(', ')}`));
        
        const results = new Map();
        
        for (const [docName, docData] of this.documents) {
            const matches = this.findMatches(docData.content, searchTerms, userQuestion);
            if (matches.length > 0) {
                results.set(docName, matches);
            }
        }
        
        if (results.size === 0) {
            return 'No relevant information found in the documents. Please try rephrasing your question or asking about economics-related topics.';
        }
        
        return this.formatSearchResults(results, userQuestion);
    }

    extractSearchTerms(question) {
        const lowerQuestion = question.toLowerCase();
        
        // Common economics terms and concepts
        const economicsTerms = [
            'adam smith', 'keynes', 'marx', 'ricardo', 'mill', 'marshall', 'schumpeter',
            'wealth of nations', 'invisible hand', 'comparative advantage', 'labor theory',
            'supply', 'demand', 'capitalism', 'socialism', 'communism', 'free market',
            'economic', 'economics', 'economy', 'trade', 'value', 'price', 'money',
            'competition', 'monopoly', 'elasticity', 'equilibrium', 'inflation',
            'unemployment', 'fiscal', 'monetary', 'policy', 'government', 'intervention'
        ];
        
        const foundTerms = economicsTerms.filter(term => lowerQuestion.includes(term));
        
        // Also extract potential names or specific terms from the question
        const words = lowerQuestion.match(/\\b[a-z]{3,}\\b/g) || [];
        const relevantWords = words.filter(word => 
            !['what', 'who', 'how', 'why', 'when', 'where', 'the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'about', 'tell', 'explain', 'describe'].includes(word)
        );
        
        return [...new Set([...foundTerms, ...relevantWords])];
    }

    findMatches(content, searchTerms, originalQuestion) {
        const matches = [];
        const contentLower = content.toLowerCase();
        
        // Split content into sections (assuming sections are separated by ##)
        const sections = content.split(/(?=##)/);
        
        for (const section of sections) {
            const sectionLower = section.toLowerCase();
            let score = 0;
            let matchedTerms = [];
            
            // Score based on search terms
            for (const term of searchTerms) {
                const termCount = (sectionLower.match(new RegExp(term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g')) || []).length;
                if (termCount > 0) {
                    score += termCount;
                    matchedTerms.push(term);
                }
            }
            
            // Bonus for section headers
            if (section.includes('###') || section.includes('##')) {
                score += 2;
            }
            
            if (score > 0) {
                matches.push({
                    content: section.trim(),
                    score: score,
                    matchedTerms: matchedTerms
                });
            }
        }
        
        // Sort by score and return top matches
        return matches.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    formatSearchResults(results, originalQuestion) {
        let response = `Found relevant information in ${results.size} document(s):\\n\\n`;
        
        let totalMatches = 0;
        for (const [docName, matches] of results) {
            response += `📄 **${docName}**:\\n`;
            
            for (const match of matches.slice(0, 2)) { // Limit to top 2 matches per document
                totalMatches++;
                const preview = this.createPreview(match.content);
                response += `\\n${preview}\\n`;
                
                if (match.matchedTerms.length > 0) {
                    response += `*Matched terms: ${match.matchedTerms.join(', ')}*\\n`;
                }
                response += `\\n---\\n`;
            }
        }
        
        if (totalMatches === 0) {
            return 'No specific matches found, but I have access to documents about economics. Please ask more specific questions about economic theories, economists, or economic concepts.';
        }
        
        response += `\\n*Found ${totalMatches} relevant section(s) across ${results.size} document(s).*`;
        
        return response;
    }

    createPreview(content, maxLength = 500) {
        // Clean up the content
        let preview = content
            .replace(/^#+\\s*/gm, '') // Remove markdown headers
            .replace(/\\*\\*(.*?)\\*\\*/g, '$1') // Remove bold formatting
            .replace(/\\*(.*?)\\*/g, '$1') // Remove italic formatting
            .trim();
        
        if (preview.length > maxLength) {
            preview = preview.substring(0, maxLength);
            // Try to cut at a sentence end
            const lastSentence = preview.lastIndexOf('.');
            if (lastSentence > maxLength * 0.7) {
                preview = preview.substring(0, lastSentence + 1);
            }
            preview += '...';
        }
        
        return preview;
    }

    listDocuments() {
        return Array.from(this.documents.keys());
    }

    getDocument(name) {
        return this.documents.get(name);
    }
}
