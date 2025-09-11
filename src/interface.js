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
        console.log(chalk.green.bold('\\n🚀 Multi-Source AI Agent is ready!'));
        console.log(chalk.gray('I can help you by querying SQLite databases, searching documents, and fetching external data.'));
        console.log(chalk.yellow('📋 Available tables: Artist, Album, Track, Customer, Employee, Invoice, InvoiceLine, Playlist, PlaylistTrack, Genre, MediaType'));
        console.log(chalk.gray('Type "help" for commands, "examples" for sample questions, or "quit" to exit.'));
        console.log(chalk.cyan('💡 Pro tip: Be specific! Mention table names like "From the Customer table..." for better results.\\n'));
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
        console.log(chalk.yellow.bold('\\n💡 Example Questions (Be Specific with Table Names):'));

        console.log(chalk.magenta.bold('\\n🌐 External Data (requires approval):'));
        console.log(chalk.cyan('  • "What time is it?"'));
        console.log(chalk.cyan('  • "What\'s my IP address?"'));
        
        console.log(chalk.magenta.bold('\\n📊 Music Database Queries:'));
        console.log(chalk.cyan('  • "From the Artist table, show me all musicians"'));
        
        console.log(chalk.magenta.bold('\\n� Business Data Queries:'));
        console.log(chalk.cyan('  • "From the Customer table, what is François Tremblay\'s email?"'));
        
        console.log(chalk.magenta.bold('\\n� Advanced Music Queries:'));
        console.log(chalk.cyan('  • "From the Playlist table, show all playlists"'));
        
        console.log(chalk.magenta.bold('\\n📄 Document Search:'));
        console.log(chalk.cyan('  • "Explain Keynesian economics"'));

        console.log(chalk.magenta.bold('\\n💬 General Conversation:'));
        console.log(chalk.cyan('  • "Hello, how are you?"'));
        
        console.log(chalk.gray('\\n💡 Tip: Always specify the table name for better results!'));
        console.log();
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
