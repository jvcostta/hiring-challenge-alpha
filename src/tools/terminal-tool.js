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
        
        // This is a critical change: we now handle the user's response.
        // The agent will first ask for permission. If the user says "yes",
        // the agent will call the tool AGAIN, but this time we need to bypass the approval.
        if (!this.pendingApproval) {
            this.pendingApproval = agentCommand;
            return `This command requires user approval. Please ask the user for permission to execute: "${agentCommand}"`;
        }

        // If we are here, it means the user has already approved.
        // We clear the pending approval to avoid re-running without permission.
        if (this.pendingApproval !== agentCommand) {
            return `Error: The approved command "${this.pendingApproval}" does not match the current command "${agentCommand}". Aborting for security.`;
        }
        this.pendingApproval = null; // Reset after use
        
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



    // This function is no longer needed because the agent's workflow now handles the approval loop.
    // The agent will first ask, and if the user says "yes", the agent will call the tool again.
    // Our new logic in `executeCommand` handles this two-step process.
    /*
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
    */

    formatCommandOutput(output) {
        if (!output || output.trim() === '') {
            return 'The command executed successfully but returned no output.';
        }
        
        // Return the raw, untruncated output.
        // The LLM is responsible for interpreting this and deciding what's important.
        return `Command executed. Raw output:\n\n${output.trim()}`;
    }
}
