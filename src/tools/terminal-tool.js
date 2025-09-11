import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export class TerminalTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'execute_command',
            description: `Execute system commands to fetch real-time external data and current information.
            Essential for getting live data that changes frequently or requires external APIs.
            
            Available capabilities:
            - Weather: Current weather conditions and forecasts
            - Time/Date: Current timestamp and timezone information  
            - Network: IP address, location, ISP information
            - System: Computer specifications and status
            - News: Latest headlines and current events
            - Finance: Currency exchange rates and market data
            - Web Search: Current information from the internet
            
            IMPORTANT: You are the agent responsible for ALL command logic.
            Analyze what type of external data the user needs and generate the appropriate system command.
            This tool will ask for user approval before executing commands for security.
            
            Command examples you can generate:
            - Weather: curl weather APIs
            - Time: date/time system commands  
            - Network: curl IP information APIs
            - News: curl RSS feeds or news APIs
            - Finance: curl exchange rate APIs`,
            schema: z.object({
                command: z.string().describe('The specific system command you want to execute to get the required external data'),
            }),
            func: async ({ command }) => {
                return await this.executeCommand(command);
            },
        });
        
        this.pendingApproval = null;
    }

    async initialize() {
        console.log(chalk.gray('    🖥️  Terminal tool ready'));
    }

    async executeCommand(agentCommand) {
        console.log(chalk.blue(`🔍 Agent wants to execute command: "${agentCommand}"`));
        
        // Validate the command for security
        if (!this.isCommandSafe(agentCommand)) {
            return 'Command rejected for security reasons. Only safe read-only commands for external data are allowed.';
        }
        
        // Ask for user approval
        const approved = await this.askUserApproval(agentCommand);
        
        if (!approved) {
            return 'Command execution was cancelled by user.';
        }
        
        console.log(chalk.blue(`🚀 Executing agent command: ${agentCommand}`));
        
        try {
            const { stdout, stderr } = await execAsync(agentCommand, { 
                timeout: 30000, // 30 second timeout
                maxBuffer: 1024 * 1024 // 1MB buffer
            });
            
            if (stderr) {
                console.warn(chalk.yellow('Command stderr:'), stderr);
            }
            
            return this.formatCommandOutput(stdout, agentCommand);
        } catch (error) {
            console.error(chalk.red('Command execution error:'), error.message);
            return `Command execution failed: ${error.message}. Try a different approach or command.`;
        }
    }

    isCommandSafe(command) {
        const cmd = command.toLowerCase().trim();
        
        // Allow safe read-only commands
        const safeCommands = [
            'curl', 'wget', 'date', 'time', 'echo', 'cat', 
            'ls', 'dir', 'pwd', 'whoami', 'uname', 'systeminfo',
            'head', 'tail', 'grep', 'find', 'which', 'where'
        ];
        
        // Allow safe APIs and websites
        const safeUrls = [
            'wttr.in', 'ipinfo.io', 'api.exchangerate-api.com',
            'feeds.bbci.co.uk', 'api.duckduckgo.com', 'httpbin.org'
        ];
        
        // Block dangerous commands
        const dangerousCommands = [
            'rm', 'del', 'rmdir', 'rd', 'format', 'fdisk',
            'kill', 'taskkill', 'shutdown', 'reboot', 'halt',
            'chmod', 'chown', 'su', 'sudo', 'passwd',
            'nc', 'netcat', 'telnet', 'ssh', 'ftp',
            'wget -O', 'curl -o', '>', '>>', '|', '&', ';'
        ];
        
        // Check for dangerous patterns
        for (const dangerous of dangerousCommands) {
            if (cmd.includes(dangerous.toLowerCase())) {
                return false;
            }
        }
        
        // Check if it starts with a safe command or contains safe URLs
        const startsWithSafe = safeCommands.some(safe => cmd.startsWith(safe));
        const containsSafeUrl = safeUrls.some(url => cmd.includes(url));
        
        return startsWithSafe || containsSafeUrl;
    }



    async askUserApproval(command) {
        return new Promise((resolve) => {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            console.log(chalk.yellow(`\n⚠️  The agent wants to execute the following command:`));
            console.log(chalk.cyan(`   ${command}`));
            console.log(chalk.yellow(`\n⚠️  This will make external requests and run system commands.`));
            
            rl.question(chalk.blue('Do you approve this command? (y/N): '), (answer) => {
                const approved = answer.toLowerCase().startsWith('y');
                if (approved) {
                    console.log(chalk.green('✅ Command approved by user'));
                } else {
                    console.log(chalk.red('❌ Command denied by user'));
                }
                rl.close();
                resolve(approved);
            });
        });
    }

    formatCommandOutput(output, command) {
        if (!output || output.trim() === '') {
            return 'The command executed successfully but returned no output.';
        }
        
        let response = `External data retrieved:\n\n`;
        
        // Smart formatting based on command patterns
        if (command.includes('wttr.in')) {
            response += `🌤️ **Weather Information:**\n${output.trim()}`;
        } else if (command.includes('date') || command.includes('time')) {
            response += `📅 **Current Date/Time:**\n${output.trim()}`;
        } else if (command.includes('systeminfo') || command.includes('uname')) {
            response += `💻 **System Information:**\n${output.trim()}`;
        } else if (command.includes('ipinfo.io')) {
            try {
                const ipData = JSON.parse(output);
                response += `🌐 **Network Information:**\n`;
                response += `IP: ${ipData.ip || 'N/A'}\n`;
                if (ipData.city) response += `Location: ${ipData.city}, ${ipData.region}, ${ipData.country}\n`;
                if (ipData.org) response += `ISP: ${ipData.org}`;
            } catch {
                response += `🌐 **Network Information:**\n${output.trim()}`;
            }
        } else if (command.includes('exchangerate-api') || command.includes('exchange')) {
            try {
                const rates = JSON.parse(output);
                response += `💱 **Exchange Rates:**\n`;
                if (rates.base) response += `Base Currency: ${rates.base}\n`;
                if (rates.rates) {
                    const topCurrencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
                    topCurrencies.forEach(currency => {
                        if (rates.rates[currency]) {
                            response += `${currency}: ${rates.rates[currency]}\n`;
                        }
                    });
                }
            } catch {
                response += `💱 **Exchange Rate Data:**\n${output.trim()}`;
            }
        } else if (command.includes('duckduckgo') || command.includes('search')) {
            try {
                const searchData = JSON.parse(output);
                response += `🔍 **Search Result:**\n`;
                response += searchData.Abstract || searchData.Answer || 'No direct answer found.';
            } catch {
                response += `🔍 **Search Data:**\n${output.trim()}`;
            }
        } else if (command.includes('rss') || command.includes('news') || command.includes('feeds')) {
            // Enhanced RSS parsing
            const headlines = output.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g) || 
                           output.match(/<title>(.*?)<\/title>/g);
            if (headlines && headlines.length > 1) {
                response += `📰 **Latest News:**\n`;
                headlines.slice(1, 6).forEach((headline, index) => {
                    const title = headline.replace(/<title>|<\/title>|<!\[CDATA\[|\]\]>/g, '');
                    response += `${index + 1}. ${title.trim()}\n`;
                });
            } else {
                response += `📰 **News Data:**\n${output.substring(0, 500)}${output.length > 500 ? '...' : ''}`;
            }
        } else {
            // Generic output with intelligent truncation
            const maxLength = 1000;
            let formattedOutput = output.trim();
            
            if (formattedOutput.length > maxLength) {
                formattedOutput = formattedOutput.substring(0, maxLength) + '\n... (output truncated)';
            }
            
            response += `🔧 **Command Output:**\n${formattedOutput}`;
        }
        
        return response;
    }
}
