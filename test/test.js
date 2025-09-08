import { MultiSourceAgent } from '../src/agent.js';
import chalk from 'chalk';

async function runTests() {
    console.log(chalk.blue.bold('🧪 Running Multi-Source AI Agent Tests\\n'));

    try {
        // Initialize the agent
        console.log(chalk.yellow('1. Initializing agent...'));
        const agent = new MultiSourceAgent();
        await agent.initialize();
        console.log(chalk.green('✅ Agent initialized successfully\\n'));

        // Test SQLite queries
        console.log(chalk.yellow('2. Testing SQLite queries...'));
        const sqliteTests = [
            'List all artists',
            'How many songs are there?',
            'Show me some albums'
        ];

        for (const test of sqliteTests) {
            console.log(chalk.cyan(`   Testing: "${test}"`));
            try {
                const response = await agent.processMessage(test);
                console.log(chalk.gray(`   Response: ${response.substring(0, 100)}...\\n`));
            } catch (error) {
                console.log(chalk.red(`   Error: ${error.message}\\n`));
            }
        }

        // Test document searches
        console.log(chalk.yellow('3. Testing document searches...'));
        const documentTests = [
            'Tell me about Adam Smith',
            'What is the invisible hand?',
            'Explain Keynesian economics'
        ];

        for (const test of documentTests) {
            console.log(chalk.cyan(`   Testing: "${test}"`));
            try {
                const response = await agent.processMessage(test);
                console.log(chalk.gray(`   Response: ${response.substring(0, 100)}...\\n`));
            } catch (error) {
                console.log(chalk.red(`   Error: ${error.message}\\n`));
            }
        }

        // Test general conversation
        console.log(chalk.yellow('4. Testing general conversation...'));
        const generalTests = [
            'Hello, how are you?',
            'What can you do?',
            'Thank you'
        ];

        for (const test of generalTests) {
            console.log(chalk.cyan(`   Testing: "${test}"`));
            try {
                const response = await agent.processMessage(test);
                console.log(chalk.gray(`   Response: ${response.substring(0, 100)}...\\n`));
            } catch (error) {
                console.log(chalk.red(`   Error: ${error.message}\\n`));
            }
        }

        console.log(chalk.green.bold('✅ All tests completed!'));

    } catch (error) {
        console.error(chalk.red('❌ Test failed:'), error.message);
        console.error(error.stack);
    }
}

runTests();
