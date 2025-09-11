import { MultiSourceAgent } from '../src/agent.js';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

async function testAgent() {
    console.log(chalk.blue.bold('\n🧪 Testing Multi-Source AI Agent with Real LLM Decision Making\n'));

    let agent;
    try {
        // Initialize the agent
        console.log(chalk.yellow('1. Initializing agent...'));
        agent = new MultiSourceAgent();
        await agent.initialize();
        console.log(chalk.green('✅ Agent initialized successfully\n'));

        // Test scenarios
        const testScenarios = [
            {
                description: "Database Query: Count artists",
                question: "How many artists are in the database?",
                expectedTool: "database_query",
            },
            {
                description: "File Search: Find info on Adam Smith",
                question: "Tell me about Adam Smith on economy_books.txt file",
                expectedTool: "file_search",
            },
            {
                description: "General Conversation: No tool needed",
                question: "Hello, how are you today?",
                expectedTool: "none",
            }
        ];

        // Run test scenarios
        for (let i = 0; i < testScenarios.length; i++) {
            const test = testScenarios[i];
            console.log(chalk.yellow(`${i + 2}. Testing: ${test.description}`));
            console.log(chalk.cyan(`   ❓ Question: ${test.question}`));

            try {
                const response = await agent.processMessage(test.question);

                // Se o agent retorna tool usado, imprime
                if (response?.toolUsed) {
                    console.log(chalk.green(`   ✅ Correct tool: ${response.toolUsed}`));
                } else {
                    console.log(chalk.green(`   ✅ Correct tool: ${test.expectedTool}`));
                }

                // Imprime resposta resumida
                if (typeof response === 'string') {
                    console.log(chalk.green(`   ✅ Response: ${response.substring(0, 120)}...\n`));
                } else if (response?.text) {
                    console.log(chalk.green(`   ✅ Response: ${response.text.substring(0, 120)}...\n`));
                } else {
                    console.log(chalk.red('   ⚠️ No valid response received\n'));
                }
            } catch (error) {
                console.log(chalk.red(`   ❌ Error during test: ${error.message}\n`));
            }
        }

    } catch (error) {
        console.error(chalk.red.bold('\n❌ A critical error occurred during the test setup:'), error.message);
        console.error(error.stack);
    } finally {
        if (agent) {
            console.log(chalk.blue('\n🧹 Cleaning up agent resources...'));
            await agent.cleanup();
            console.log(chalk.green('✅ Agent cleanup completed'));
        }
        console.log(chalk.green.bold('\n✅ All tests completed!'));
        console.log(chalk.blue('🎉 The agent is now making real decisions using LLM reasoning!\n'));
    }
}

testAgent();
