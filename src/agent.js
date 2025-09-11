import { ChatGroq } from '@langchain/groq';
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { DatabaseTool } from './tools/database-tool.js';
import { FileTool } from './tools/file-tool.js';
import { TerminalTool } from './tools/terminal-tool.js';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import chalk from 'chalk';

export class MultiSourceAgent {
    constructor() {
        this.llm = null;
        this.tools = [];
        this.toolNode = null;
        this.graph = null;
        this.conversationHistory = [];
    }

    async initialize() {
        console.log(chalk.blue('🔧 Initializing Multi-Source AI Agent...'));

        // Initialize LLM
        this.llm = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: process.env.MODEL_NAME || 'llama-3.3-70b-versatile',
            temperature: parseFloat(process.env.TEMPERATURE || '0.3'),
            maxTokens: parseInt(process.env.MAX_TOKENS || '10000'),
        });

        console.log(chalk.gray('  🛠️  Initializing tools...'));
        
        // Initialize tools
        const databaseTool = new DatabaseTool();
        const fileTool = new FileTool();
        const terminalTool = new TerminalTool();

        // Initialize each tool
        const toolsToInit = [
            { name: 'database', tool: databaseTool },
            { name: 'file', tool: fileTool },
            { name: 'terminal', tool: terminalTool }
        ];

        for (const { name, tool } of toolsToInit) {
            try {
                await tool.initialize();
                this.tools.push(tool);
                console.log(chalk.green(`  ✅ ${name} tool ready`));
            } catch (error) {
                console.warn(chalk.yellow(`  ⚠️  ${name} tool failed to initialize: ${error.message}`));
            }
        }

        // Bind tools to LLM
        this.llm = this.llm.bindTools(this.tools);
        
        // Create tool node
        this.toolNode = new ToolNode(this.tools);

        // Build the agent graph
        this.buildGraph();

        console.log(chalk.green('✅ Agent initialized successfully!\\n'));
    }

    buildGraph() {
        console.log(chalk.blue('🏗️  Building agent workflow graph...'));
        
        // Define the graph state
        const workflow = new StateGraph(MessagesAnnotation);

        // Define the function that determines whether to continue or not
        const shouldContinue = (state) => {
            const messages = state.messages;
            const lastMessage = messages[messages.length - 1];
            
            // If the LLM makes a tool call, then we route to the "tools" node
            if (lastMessage.tool_calls?.length > 0) {
                return "tools";
            }
            // Otherwise, we stop (this is the normal case)  
            return END;
        };

        // Define the function that calls the model
        const callModel = async (state) => {
            console.log(chalk.blue('🧠 LLM is thinking and deciding which tools to use...'));
            
            const messages = state.messages;
            const response = await this.llm.invoke(messages);
            
            // Log tool calls if any
            if (response.tool_calls?.length > 0) {
                console.log(chalk.blue(`🔧 LLM decided to use ${response.tool_calls.length} tool(s):`));
                for (const toolCall of response.tool_calls) {
                    console.log(chalk.cyan(`  - ${toolCall.name}: ${JSON.stringify(toolCall.args)}`));
                }
            }
            
            return { messages: [response] };
        };

        // Define the two nodes we will cycle between
        workflow.addNode("agent", callModel);
        workflow.addNode("tools", this.toolNode);

        // Set the entrypoint as `agent`
        // This means that this node is the first one called
        workflow.addEdge(START, "agent");

        // We now add a conditional edge
        workflow.addConditionalEdges(
            // First, we define the start node. We use `agent`.
            // This means these are the edges taken after the `agent` node is called.
            "agent",
            // Next, we pass in the function that will determine which node is called next.
            shouldContinue
        );

        // We now add a normal edge from `tools` to `agent`.
        // This means that after `tools` is called, `agent` node is called next.
        workflow.addEdge("tools", "agent");

        // Finally, we compile it!
        this.graph = workflow.compile();
        
        console.log(chalk.green('✅ Agent workflow graph built successfully!'));
    }

    async processMessage(userInput) {
        console.log(chalk.blue('🚀 Processing user message with AI agent...'));
        
        try {
            // Add system message to guide the LLM's tool usage decisions
            const systemMessage = new HumanMessage(`You are an intelligent AI agent with access to multiple tools. 
            
Your tools:
1. database_query - Use for questions about music (artists, albums, songs, music data)
2. file_search - Use for questions about economics, economic theory, economists, economic books
3. execute_command - Use for current/external information (weather, time, news, system info)

Analyze the user's question and decide which tool(s) to use, if any. If no tools are needed, respond directly.

User question: ${userInput}`);

            // Create the initial state with the conversation history + new message
            const initialState = {
                messages: [...this.conversationHistory, systemMessage]
            };

            console.log(chalk.blue('🔄 Running agent workflow...'));
            
            // Run the graph
            const finalState = await this.graph.invoke(initialState);
            
            // Get the final response
            const messages = finalState.messages;
            const lastMessage = messages[messages.length - 1];
            
            // Update conversation history
            this.conversationHistory.push(new HumanMessage(userInput));
            this.conversationHistory.push(lastMessage);
            
            console.log(chalk.green('✅ Agent workflow completed!'));
            
            return lastMessage.content;
            
        } catch (error) {
            console.error(chalk.red('❌ Agent processing error:'), error.message);
            console.error(error.stack);
            return `I'm sorry, I encountered an error while processing your request: ${error.message}`;
        }
    }

    // Helper method to get conversation history
    getConversationHistory() {
        return this.conversationHistory;
    }

    // Helper method to clear conversation history
    clearConversationHistory() {
        this.conversationHistory = [];
        console.log(chalk.blue('🗑️  Conversation history cleared'));
    }

    // Cleanup method
    async cleanup() {
        console.log(chalk.blue('🧹 Cleaning up agent resources...'));
        
        // Close database connections if any tools have them
        for (const tool of this.tools) {
            if (tool.close && typeof tool.close === 'function') {
                try {
                    await tool.close();
                } catch (error) {
                    console.warn(chalk.yellow(`Warning: Error closing tool ${tool.name}: ${error.message}`));
                }
            }
        }
        
        console.log(chalk.green('✅ Agent cleanup completed'));
    }
}
