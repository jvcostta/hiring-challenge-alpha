import readline from 'readline';
import chalk from 'chalk';

export class ConversationInterface {
    constructor(agent) {
        this.agent = agent;
        this.rl = null;
        this.isRunning = false;
    }

    async start() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.green('💬 You: ')
        });

        this.showWelcomeMessage();
        this.showExamples();
        
        this.isRunning = true;
        this.rl.prompt();

        this.rl.on('line', async (input) => {
            const userInput = input.trim();
            
            if (this.handleSpecialCommands(userInput)) {
                return;
            }

            if (userInput === '') {
                this.rl.prompt();
                return;
            }

            console.log(chalk.blue('🤖 Agent: '), 'Processing your question...');
            
            try {
                const response = await this.agent.processMessage(userInput);
                console.log(chalk.blue('🤖 Agent: '), response);
            } catch (error) {
                console.error(chalk.red('❌ Error:'), error.message);
            }
            
            console.log(); // Empty line for better readability
            this.rl.prompt();
        });

        this.rl.on('close', () => {
            this.shutdown();
        });
    }

    handleSpecialCommands(input) {
        const command = input.toLowerCase();
        
        switch (command) {
            case 'quit':
            case 'exit':
            case 'bye':
                this.shutdown();
                return true;
                
            case 'help':
                this.showHelp();
                this.rl.prompt();
                return true;
                
            case 'examples':
                this.showExamples();
                this.rl.prompt();
                return true;
                
            case 'clear':
                console.clear();
                this.showWelcomeMessage();
                this.rl.prompt();
                return true;
                
            default:
                return false;
        }
    }

    showWelcomeMessage() {
        console.log(chalk.green.bold('\\n🚀 Multi-Source AI Agent is ready!'));
        console.log(chalk.gray('I can help you by querying SQLite databases, searching documents, and fetching external data.'));
        console.log(chalk.gray('Type "help" for commands, "examples" for sample questions, or "quit" to exit.\\n'));
    }

    showHelp() {
        console.log(chalk.yellow.bold('\\n📖 Available Commands:'));
        console.log(chalk.cyan('  help     ') + chalk.gray('- Show this help message'));
        console.log(chalk.cyan('  examples ') + chalk.gray('- Show example questions'));
        console.log(chalk.cyan('  clear    ') + chalk.gray('- Clear the screen'));
        console.log(chalk.cyan('  quit     ') + chalk.gray('- Exit the application'));
        console.log();
    }

    showExamples() {
        console.log(chalk.yellow.bold('\\n💡 Example Questions:'));
        
        console.log(chalk.magenta.bold('\\n📊 SQLite Database Queries:'));
        console.log(chalk.cyan('  • "List all artists in the database"'));
        console.log(chalk.cyan('  • "How many albums are there?"'));
        console.log(chalk.cyan('  • "Show me songs by a specific artist"'));
        console.log(chalk.cyan('  • "What tracks are in the database?"'));
        
        console.log(chalk.magenta.bold('\\n📄 Document Search:'));
        console.log(chalk.cyan('  • "Tell me about Adam Smith"'));
        console.log(chalk.cyan('  • "What is the invisible hand theory?"'));
        console.log(chalk.cyan('  • "Explain Keynesian economics"'));
        console.log(chalk.cyan('  • "Who wrote Das Kapital?"'));
        
        console.log(chalk.magenta.bold('\\n🌐 External Data (requires approval):'));
        console.log(chalk.cyan('  • "What\'s the current weather?"'));
        console.log(chalk.cyan('  • "What time is it?"'));
        console.log(chalk.cyan('  • "Get current exchange rates"'));
        console.log(chalk.cyan('  • "What\'s my IP address?"'));
        
        console.log(chalk.magenta.bold('\\n💬 General Conversation:'));
        console.log(chalk.cyan('  • "Hello, how are you?"'));
        console.log(chalk.cyan('  • "What can you do?"'));
        console.log(chalk.cyan('  • "Thank you for your help"'));
        
        console.log();
    }

    shutdown() {
        if (this.isRunning) {
            console.log(chalk.yellow('\\n👋 Thank you for using the Multi-Source AI Agent!'));
            console.log(chalk.gray('Shutting down...'));
            
            // Clean up data sources
            if (this.agent && this.agent.dataSources) {
                if (this.agent.dataSources.sqlite && typeof this.agent.dataSources.sqlite.close === 'function') {
                    this.agent.dataSources.sqlite.close();
                }
                if (this.agent.dataSources.bash && typeof this.agent.dataSources.bash.close === 'function') {
                    this.agent.dataSources.bash.close();
                }
            }
            
            this.isRunning = false;
        }
        
        if (this.rl) {
            this.rl.close();
        }
        
        process.exit(0);
    }
}
