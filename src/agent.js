import { ChatGroq } from '@langchain/groq';
import { SqliteDataSource } from './datasources/sqlite.js';
import { DocumentDataSource } from './datasources/document.js';
import { BashDataSource } from './datasources/bash.js';
import { ToolRouter } from './router.js';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import chalk from 'chalk';

export class MultiSourceAgent {
    constructor() {
        this.llm = null;
        this.dataSources = {};
        this.router = null;
        this.conversationHistory = [];
    }

    async initialize() {
        console.log(chalk.blue('🔧 Initializing Multi-Source AI Agent...'));

        this.llm = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: process.env.MODEL_NAME || 'llama-3.3-70b-versatile',
            temperature: parseFloat(process.env.TEMPERATURE || '0.3'),
            maxTokens: parseInt(process.env.MAX_TOKENS || '10000'),
        });

        console.log(chalk.gray('  📊 Initializing data sources...'));
        this.dataSources = {
            sqlite: new SqliteDataSource(),
            document: new DocumentDataSource(),
            bash: new BashDataSource(),
        };

        for (const [name, dataSource] of Object.entries(this.dataSources)) {
            try {
                await dataSource.initialize();
                console.log(chalk.green(`  ✅ ${name} data source ready`));
            } catch (error) {
                console.warn(chalk.yellow(`  ⚠️  ${name} data source failed to initialize: ${error.message}`));
            }
        }

        this.router = new ToolRouter(this.llm, this.dataSources);

        console.log(chalk.green('✅ Agent initialized successfully!\\n'));
    }

    async processMessage(userInput) {
        const humanMessage = new HumanMessage(userInput);
        this.conversationHistory.push(humanMessage);

        try {
            console.log(chalk.blue('🧭 Routing message...'));
            const route = await this.router.route(userInput);
            console.log(chalk.blue(`🎯 Selected route: ${route}`));

            let dataResult = null;
            switch (route) {
                case 'sqlite':
                    dataResult = await this.dataSources.sqlite.query(userInput);
                    break;
                case 'document':
                    dataResult = await this.dataSources.document.search(userInput);
                    break;
                case 'bash':
                    dataResult = await this.dataSources.bash.execute(userInput);
                    break;
                case 'direct':
                    // Direct conversation, no data source needed
                    break;
                default:
                    console.warn(chalk.yellow(`Unknown route: ${route}, using direct response`));
                    break;
            }

            const response = await this.generateResponse(userInput, dataResult, route);
            
            const aiResponse = new AIMessage(response);
            this.conversationHistory.push(aiResponse);
            
            return response;
        } catch (error) {
            console.error(chalk.red('❌ Agent processing error:'), error.message);
            return `I'm sorry, I encountered an error while processing your request: ${error.message}`;
        }
    }

    async generateResponse(userInput, dataResult, route) {
        let prompt;

        if (route === 'direct') {
            prompt = `You are a helpful AI assistant. The user said: "${userInput}". Please respond naturally and helpfully.`;
        } else if (dataResult) {
            prompt = `User question: ${userInput}

Data retrieved from ${route} source:
${dataResult}

Please provide a comprehensive and helpful answer based on the user's question and the data found. If the data doesn't fully answer the question, say so and provide what information you can.`;
        } else {
            prompt = `The user asked: "${userInput}". I tried to find relevant data using the ${route} data source, but no results were found. Please provide a helpful response explaining that no data was found and suggest how the user might rephrase their question.`;
        }

        try {
            console.log(chalk.blue('🧠 Generating response...'));
            const response = await this.llm.invoke([new HumanMessage(prompt)]);
            return response.content;
        } catch (error) {
            console.error(chalk.red('❌ LLM generation error:'), error.message);
            return `I apologize, but I encountered an error while generating a response: ${error.message}`;
        }
    }
}
