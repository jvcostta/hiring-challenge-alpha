import { PromptTemplate } from '@langchain/core/prompts';
import { HumanMessage } from '@langchain/core/messages';

export class ToolRouter {
    constructor(llm, dataSources) {
        this.llm = llm;
        this.dataSources = dataSources;
        this.routingPrompt = PromptTemplate.fromTemplate(`
You are a routing assistant that determines which data source should be used to answer a user's question.

Available data sources:
1. "sqlite" - Use for questions about music, albums, artists, songs, or any database-related queries
2. "document" - Use for questions about economics, economic theory, books, authors, or economic concepts  
3. "bash" - Use for questions that require external data, web searches, current information, or system commands
4. "direct" - Use for general conversation, greetings, or questions that don't require external data

User question: {question}

Analyze the question and respond with ONLY ONE of these words: sqlite, document, bash, or direct

Examples:
- "What songs are in the database?" -> sqlite
- "Tell me about Adam Smith" -> document  
- "What's the current weather?" -> bash
- "Hello, how are you?" -> direct

Your response:`);
    }

    async route(question) {
        try {
            const prompt = await this.routingPrompt.format({ question });
            const response = await this.llm.invoke([new HumanMessage(prompt)]);
            
            const route = response.content.trim().toLowerCase();
            
            // Validate the route
            const validRoutes = ['sqlite', 'document', 'bash', 'direct'];
            if (validRoutes.includes(route)) {
                return route;
            }
            
            // Fallback routing logic based on keywords
            return this.fallbackRoute(question);
        } catch (error) {
            console.warn(`Routing error, using fallback: ${error.message}`);
            return this.fallbackRoute(question);
        }
    }

    fallbackRoute(question) {
        const lowerQuestion = question.toLowerCase();
        
        // SQLite keywords
        const sqliteKeywords = ['music', 'song', 'album', 'artist', 'band', 'track', 'database', 'sql', 'query'];
        if (sqliteKeywords.some(keyword => lowerQuestion.includes(keyword))) {
            return 'sqlite';
        }
        
        // Document keywords
        const documentKeywords = ['economics', 'economic', 'economist', 'book', 'author', 'theory', 'smith', 'keynes', 'marx', 'ricardo'];
        if (documentKeywords.some(keyword => lowerQuestion.includes(keyword))) {
            return 'document';
        }
        
        // Bash keywords
        const bashKeywords = ['weather', 'current', 'latest', 'news', 'search', 'download', 'web', 'internet', 'api'];
        if (bashKeywords.some(keyword => lowerQuestion.includes(keyword))) {
            return 'bash';
        }
        
        // Default to direct
        return 'direct';
    }
}
