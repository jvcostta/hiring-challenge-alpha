import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import readline from 'readline';

const execAsync = promisify(exec);

export class BashDataSource {
    constructor() {
        this.rl = null;
    }

    async initialize() {
        console.log(chalk.gray('    🖥️  Bash execution environment ready'));
        
        // Create readline interface for user approval
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async execute(userQuestion) {
        console.log(chalk.blue('🔍 Analyzing question for external data needs...'));
        
        const command = await this.generateCommand(userQuestion);
        
        if (!command) {
            return 'I could not determine an appropriate command to get external data for your question. Please try asking for current information, web data, or system information.';
        }
        
        // Ask for user approval
        const approved = await this.askUserApproval(command);
        
        if (!approved) {
            return 'Command execution was cancelled by user.';
        }
        
        console.log(chalk.blue(`🚀 Executing: ${command}`));
        
        try {
            const { stdout, stderr } = await execAsync(command, { 
                timeout: 30000, // 30 second timeout
                maxBuffer: 1024 * 1024 // 1MB buffer
            });
            
            if (stderr) {
                console.warn(chalk.yellow('Command stderr:'), stderr);
            }
            
            return this.formatCommandOutput(stdout, command, userQuestion);
        } catch (error) {
            console.error(chalk.red('Command execution error:'), error.message);
            return `Command execution failed: ${error.message}`;
        }
    }

    async generateCommand(question) {
        const lowerQuestion = question.toLowerCase();
        
        // Weather-related commands
        if (lowerQuestion.includes('weather')) {
            // Using a free weather API
            return 'curl -s "https://wttr.in/?format=3"';
        }
        
        // Current time/date
        if (lowerQuestion.includes('time') || lowerQuestion.includes('date')) {
            return process.platform === 'win32' ? 'date /t && time /t' : 'date';
        }
        
        // System information
        if (lowerQuestion.includes('system') || lowerQuestion.includes('computer')) {
            return process.platform === 'win32' ? 'systeminfo | findstr /B /C:"OS Name" /C:"Total Physical Memory"' : 'uname -a && free -h';
        }
        
        // Network information
        if (lowerQuestion.includes('ip') || lowerQuestion.includes('network')) {
            return 'curl -s "https://ipinfo.io/json"';
        }
        
        // News or current events (using a simple RSS feed)
        if (lowerQuestion.includes('news') || lowerQuestion.includes('current')) {
            return 'curl -s "https://feeds.bbci.co.uk/news/rss.xml" | head -50';
        }
        
        // Exchange rates
        if (lowerQuestion.includes('exchange') || lowerQuestion.includes('currency') || lowerQuestion.includes('dollar') || lowerQuestion.includes('euro')) {
            return 'curl -s "https://api.exchangerate-api.com/v4/latest/USD"';
        }
        
        // Simple web search (using DuckDuckGo instant answer API)
        if (lowerQuestion.includes('search') || lowerQuestion.includes('what is') || lowerQuestion.includes('who is')) {
            const searchTerm = this.extractSearchTerm(question);
            if (searchTerm) {
                return `curl -s "https://api.duckduckgo.com/instant_answer?q=${encodeURIComponent(searchTerm)}&format=json"`;
            }
        }
        
        // Directory listing
        if (lowerQuestion.includes('files') || lowerQuestion.includes('directory') || lowerQuestion.includes('folder')) {
            return process.platform === 'win32' ? 'dir' : 'ls -la';
        }
        
        return null;
    }

    extractSearchTerm(question) {
        // Try to extract the search term from questions like "What is X?" or "Who is Y?"
        const patterns = [
            /what is (.*?)\\?$/i,
            /who is (.*?)\\?$/i,
            /tell me about (.*?)\\?$/i,
            /search for (.*?)\\?$/i
        ];
        
        for (const pattern of patterns) {
            const match = question.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return null;
    }

    async askUserApproval(command) {
        return new Promise((resolve) => {
            console.log(chalk.yellow(`\\n⚠️  The agent wants to execute the following command:`));
            console.log(chalk.cyan(`   ${command}`));
            console.log(chalk.yellow(`\\n⚠️  This will make external requests and run system commands.`));
            
            this.rl.question(chalk.blue('Do you approve this command? (y/N): '), (answer) => {
                const approved = answer.toLowerCase().startsWith('y');
                if (approved) {
                    console.log(chalk.green('✅ Command approved by user'));
                } else {
                    console.log(chalk.red('❌ Command denied by user'));
                }
                resolve(approved);
            });
        });
    }

    formatCommandOutput(output, command, originalQuestion) {
        if (!output || output.trim() === '') {
            return 'The command executed successfully but returned no output.';
        }
        
        let response = `External data retrieved:\\n\\n`;
        
        // Format based on command type
        if (command.includes('wttr.in')) {
            response += `🌤️ **Weather Information:**\\n${output.trim()}`;
        } else if (command.includes('date')) {
            response += `📅 **Current Date/Time:**\\n${output.trim()}`;
        } else if (command.includes('systeminfo') || command.includes('uname')) {
            response += `💻 **System Information:**\\n${output.trim()}`;
        } else if (command.includes('ipinfo.io')) {
            try {
                const ipData = JSON.parse(output);
                response += `🌐 **Network Information:**\\n`;
                response += `IP: ${ipData.ip}\\n`;
                response += `Location: ${ipData.city}, ${ipData.region}, ${ipData.country}\\n`;
                response += `ISP: ${ipData.org}`;
            } catch {
                response += `🌐 **Network Information:**\\n${output.trim()}`;
            }
        } else if (command.includes('exchangerate-api')) {
            try {
                const rates = JSON.parse(output);
                response += `💱 **Exchange Rates (Base: ${rates.base}):**\\n`;
                const currencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
                for (const currency of currencies) {
                    if (rates.rates[currency]) {
                        response += `${currency}: ${rates.rates[currency]}\\n`;
                    }
                }
            } catch {
                response += `💱 **Exchange Rate Data:**\\n${output.trim()}`;
            }
        } else if (command.includes('duckduckgo')) {
            try {
                const searchData = JSON.parse(output);
                if (searchData.Abstract) {
                    response += `🔍 **Search Result:**\\n${searchData.Abstract}`;
                } else {
                    response += `🔍 **Search completed but no direct answer found.**`;
                }
            } catch {
                response += `🔍 **Search Data:**\\n${output.trim()}`;
            }
        } else if (command.includes('rss.xml') || command.includes('news')) {
            // Simple RSS parsing
            const headlines = output.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
            if (headlines && headlines.length > 1) {
                response += `📰 **Latest News Headlines:**\\n`;
                headlines.slice(1, 6).forEach((headline, index) => {
                    const title = headline.replace(/<title><!\[CDATA\[|\]\]><\/title>/g, '');
                    response += `${index + 1}. ${title}\\n`;
                });
            } else {
                response += `📰 **News Data:**\\n${output.substring(0, 500)}...`;
            }
        } else {
            // Generic output formatting
            const truncatedOutput = output.length > 1000 ? output.substring(0, 1000) + '...' : output;
            response += `🔧 **Command Output:**\\n${truncatedOutput}`;
        }
        
        return response;
    }

    close() {
        if (this.rl) {
            this.rl.close();
        }
    }
}
