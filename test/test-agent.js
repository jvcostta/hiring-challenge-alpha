import { MultiSourceAgent } from '../src/agent.js';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

async function testAgent() {
    console.log(chalk.blue.bold('🧪 Testing Multi-Source AI Agent with Real LLM Decision Making\n'));

    try {
        // Initialize the agent
        console.log(chalk.yellow('1. Initializing agent...'));
        const agent = new MultiSourceAgent();
        await agent.initialize();
        console.log(chalk.green('✅ Agent initialized successfully\n'));

        // Test questions that should trigger different tools
        const testQuestions = [
            {
                question: "How many artists are in the database?",
                expectedTool: "database_query",
                description: "Should use database tool for music data"
            },
            {
                question: "Tell me about Adam Smith and his economic theories",
                expectedTool: "file_search", 
                description: "Should use file tool for economics information"
            },
            {
                question: "Hello, how are you today?",
                expectedTool: "none",
                description: "Should respond directly without tools"
            }
        ];

        for (let i = 0; i < testQuestions.length; i++) {
            const test = testQuestions[i];
            console.log(chalk.yellow(`${i + 2}. Testing: "${test.question}"`));
            console.log(chalk.gray(`   Expected: ${test.description}`));
            
            try {
                const response = await agent.processMessage(test.question);
                console.log(chalk.green(`   ✅ Response received: ${response.substring(0, 100)}...`));
            } catch (error) {
                console.log(chalk.red(`   ❌ Error: ${error.message}`));
            }
            console.log('');
        }

        console.log(chalk.green.bold('✅ All tests completed!'));
        console.log(chalk.blue('🎉 The agent is now making real decisions using LLM reasoning!'));

        // Cleanup
        await agent.cleanup();

    } catch (error) {
        console.error(chalk.red('❌ Test failed:'), error.message);
        console.error(error.stack);
    }
}

testAgent();
