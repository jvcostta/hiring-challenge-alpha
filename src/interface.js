import readline from 'readline';
import chalk from 'chalk';
import { platform } from 'os';

export class ConversationInterface {
    constructor(agent) {
        this.agent = agent;
        this.rl = null;
        this.isRunning = false;
    }

    async start() {
        const isWindows = platform() === 'win32';
        const isPowerShell = process.env.PSModulePath !== undefined;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.green('💬 You: '),
            terminal: !(isWindows && isPowerShell),
            historySize: 100,
            removeHistoryDuplicates: true
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
            
            console.log();
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
        console.log(chalk.green.bold('\n🚀 Multi-Source AI Agent is ready!'));
        console.log(chalk.gray('I can help you by querying SQLite databases, searching documents, and fetching external data.'));
        console.log(chalk.yellow('\n 📋 Available tables: Artist, Album, Track, Customer, Employee, Invoice, InvoiceLine, Playlist, PlaylistTrack, Genre, MediaType'));
        console.log(chalk.gray('Type "help" for commands, "examples" for sample questions, or "quit" to exit.'));
        console.log(chalk.cyan('\n\n💡 Pro tip: Be specific! Mention table names like "From the Customer table..." for better results.\\n'));
    }

    showHelp() {
        console.log(chalk.yellow.bold('\n📖 Available Commands:'));
        console.log(chalk.cyan('  help     ') + chalk.gray('- Show this help message'));
        console.log(chalk.cyan('  examples ') + chalk.gray('- Show example questions'));
        console.log(chalk.cyan('  clear    ') + chalk.gray('- Clear the screen'));
        console.log(chalk.cyan('  quit     ') + chalk.gray('- Exit the application'));
        console.log();
    }

    showExamples() {
        console.log(chalk.yellow.bold('\n💡 Example Questions - Ask Naturally!'));
        console.log(chalk.gray('The AI agent will automatically decide which tool to use based on your question.\\n'));

        console.log(chalk.magenta.bold('� Music Database Questions:'));
        console.log(chalk.cyan('  • "How many artists are in the database?"'));
        console.log(chalk.cyan('  • "Show me some albums by The Beatles"'));
        console.log(chalk.cyan('  • "What are the top selling tracks?"'));
        console.log(chalk.cyan('  • "Find customers from Brazil"'));
        console.log(chalk.cyan('  • "List all music genres available"'));
        console.log(chalk.cyan('  • "Who are the highest paying customers?"'));
        console.log(chalk.cyan('  • "Show me rock albums from the 1980s"'));

        console.log(chalk.magenta.bold('\n🌐 External Data Questions (requires your approval):'));
        console.log(chalk.cyan('  • "What is my IP address?"'));
        console.log(chalk.cyan('  • "What time is it right now?"'));
        console.log(chalk.cyan('  • "Show me today\'s date"'));
        console.log(chalk.cyan('  • "Get current weather information"'));
        console.log(chalk.cyan('  • "What is the current system information?"'));
        console.log(chalk.gray('    ⚠️  The agent will ask for your permission before running any external commands'));
        
        console.log(chalk.magenta.bold('\n📄 Economics Document Questions:'));
        console.log(chalk.cyan('  • "Tell me about Adam Smith"'));
        console.log(chalk.cyan('  • "What is Keynesian economics?"'));
        console.log(chalk.cyan('  • "Explain the invisible hand theory"'));
        console.log(chalk.cyan('  • "Who wrote Das Kapital?"'));
        console.log(chalk.cyan('  • "What are the main economic schools of thought?"'));
        console.log(chalk.cyan('  • "Explain supply and demand theory"'));

        console.log(chalk.magenta.bold('\n💬 General Conversation:'));
        console.log(chalk.cyan('  • "Hello, how are you today?"'));
        console.log(chalk.cyan('  • "What can you help me with?"'));
        console.log(chalk.cyan('  • "What tables are available in the database?"'));
        console.log(chalk.cyan('  • "Thank you for your assistance"\n'));
        
    }

    shutdown() {
        if (this.isRunning) {
            console.log(chalk.yellow('\\n👋 Thank you for using the Multi-Source AI Agent!'));
            console.log(chalk.gray('Shutting down...'));
            
            // Clean shutdown - new tools don't require explicit closing
            this.isRunning = false;
        }
        
        if (this.rl) {
            this.rl.close();
        }
        
        process.exit(0);
    }
}
