import dotenv from 'dotenv';
import { MultiSourceAgent } from './agent.js';
import { ConversationInterface } from './interface.js';
import chalk from 'chalk';

dotenv.config();

async function main() {
    console.log(chalk.blue.bold('🤖 Multi-Source AI Agent Challenge'));
    console.log(chalk.gray('An intelligent agent that can query SQLite databases, documents, and external sources\n'));

    try {
        // Initialize the agent
        const agent = new MultiSourceAgent();
        await agent.initialize();

        // Start the conversation interface
        const conversationInterface = new ConversationInterface(agent);
        await conversationInterface.start();
    } catch (error) {
        console.error(chalk.red('❌ Error starting the agent:'), error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Goodbye!'));
    process.exit(0);
});

main();
