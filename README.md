# Multi-Source AI Agent Challenge

## Challenge Overview

Welcome to the Multi-Source AI Agent Challenge! In this project, you'll build an intelligent agent using Node.js and modern LLM frameworks that can answer questions by leveraging multiple data sources including SQLite databases, document files, and web content via bash commands.

## ✅ Implementation Complete

This repository now contains a **fully functional multi-source AI agent** that meets all the challenge requirements!

### 🚀 Features Implemented

- ✅ **Multi-source data querying**: SQLite databases, text documents, and external data via bash commands
- ✅ **Intelligent routing**: Automatically determines which data source to use based on the question
- ✅ **Conversational interface**: Interactive terminal-based chat interface
- ✅ **User approval for bash commands**: Safety mechanism for external commands
- ✅ **Error handling**: Comprehensive error handling for all data sources
- ✅ **LangGraph workflow**: Uses LangGraph for agent orchestration
- ✅ **LangChain integration**: Leverages LangChain for LLM interactions

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- OpenAI API key (or other compatible LLM provider)

### 1. Clone and Install

```bash
git clone <repository-url>
cd hiring-challenge-alpha
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# Required: OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the Agent

```bash
# Start the interactive agent
npm start

# Or run in development mode with auto-restart
npm run dev

# Run tests
npm test
```

## 🎯 How to Use

Once the agent starts, you can ask questions that will be automatically routed to the appropriate data source:

### 📊 SQLite Database Queries
The agent can query the music database (`data/sqlite/music.db`):

```
💬 You: List all artists in the database
💬 You: How many albums are there?
💬 You: Show me songs by a specific artist
💬 You: What tracks are in the database?
```

### 📄 Document Search
The agent searches through economics books (`data/documents/economy_books.txt`):

```
💬 You: Tell me about Adam Smith
💬 You: What is the invisible hand theory?
💬 You: Explain Keynesian economics
💬 You: Who wrote Das Kapital?
```

### 🌐 External Data (with user approval)
The agent can execute bash commands to fetch external data:

```
💬 You: What's the current weather?
💬 You: What time is it?
💬 You: Get current exchange rates
💬 You: What's my IP address?
```

⚠️ **Safety Note**: The agent will ask for your approval before executing any bash commands.

### 💬 General Conversation
The agent can also handle general conversation:

```
💬 You: Hello, how are you?
💬 You: What can you do?
💬 You: Thank you for your help
```

## 🧠 Architecture

The agent uses a sophisticated workflow built with LangGraph:

```
User Input → Router → [SQLite|Document|Bash|Direct] → LLM Response → User
```

### Key Components

- **`MultiSourceAgent`**: Main agent orchestrator using LangGraph
- **`ToolRouter`**: Intelligent routing based on question analysis
- **`SqliteDataSource`**: Handles database queries with automatic SQL generation
- **`DocumentDataSource`**: Semantic search through text documents
- **`BashDataSource`**: Secure execution of system commands with user approval
- **`ConversationInterface`**: Interactive terminal interface

## 🎮 Available Commands

While chatting with the agent, you can use these commands:

- `help` - Show available commands
- `examples` - Display example questions
- `clear` - Clear the screen
- `quit` / `exit` / `bye` - Exit the application

## 🧪 Testing Examples

### SQLite Database Tests
```bash
# Test basic queries
💬 You: List all artists
💬 You: Count all albums
💬 You: Show me track information
```

### Document Search Tests
```bash
# Test economics knowledge
💬 You: What did Adam Smith contribute to economics?
💬 You: Explain the concept of comparative advantage
💬 You: Tell me about Marx's economic theory
```

### External Data Tests (requires approval)
```bash
# Test external data fetching
💬 You: What's the weather like?
💬 You: Get current time and date
💬 You: Show me exchange rates for USD
```

### Multi-source Integration Tests
```bash
# Questions that might use multiple sources
💬 You: Compare economic theories from the documents with current market data
💬 You: What music data do we have and what are current music trends?
```

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `MODEL_NAME`: LLM model to use (default: gpt-4o-mini)
- `TEMPERATURE`: Response creativity (default: 0.3)
- `MAX_TOKENS`: Maximum response length (default: 1000)

### Data Sources
- **SQLite**: Place `.db` files in `data/sqlite/`
- **Documents**: Place `.txt` files in `data/documents/`
- **External**: Commands are generated dynamically based on questions

## 🛠️ Technology Stack

- **Node.js**: Runtime environment
- **LangChain**: LLM integration and chains
- **LangGraph**: Agent workflow orchestration  
- **SQLite3**: Database operations
- **OpenAI GPT**: Language model (configurable)
- **Chalk**: Terminal colors and formatting

## 🔒 Security Features

- **User approval required** for all bash command executions
- **Command timeout** (30 seconds) for external requests
- **Input validation** and sanitization
- **Error isolation** - failures in one data source don't affect others

## 📊 Performance Features

- **Concurrent data source initialization**
- **Intelligent query caching** for documents
- **Optimized SQL query generation**
- **Streaming responses** for better UX

## 🚀 What Makes This Implementation Special

1. **True Multi-Source Intelligence**: Seamlessly integrates 3 different data types
2. **Smart Routing**: Uses LLM-powered routing with keyword fallbacks
3. **Safety First**: All external commands require explicit user approval
4. **Production Ready**: Comprehensive error handling and logging
5. **Extensible**: Easy to add new data sources or modify existing ones
6. **User Friendly**: Intuitive interface with helpful examples and commands

## 🎉 Ready to Use!

The agent is now ready to demonstrate its capabilities. Simply run `npm start` and start asking questions!

---

## Challenge Requirements

### Technology Stack
- Node.js
- [LangChain](https://js.langchain.com/docs/) - For LLM integration and chains
- [LangGraph](https://js.langchain.com/docs/langgraph/) - For agent workflow orchestration

### Core Features
Your AI agent must be able to:

1. **Answer questions using multiple data sources:**
   - **SQLite databases**: The agent should query `.db` files placed in the `data/sqlite` folder
   - **Document context**: The agent should extract information from `.txt` files in the `data/documents` folder
   - **External data**: The agent should be able to run bash commands (with user approval) to gather additional data (e.g., using `curl` to fetch web content)

2. **Implement a conversational interface** - either in the browser or terminal

3. **Provide intelligent routing** - decide which data source is most appropriate for each question and use the right tools accordingly

### Minimum Viable Product
Your solution must demonstrate:

- A functional agent that can respond to user questions
- Proper routing between different data sources
- A clear execution flow with user approval for bash commands
- Meaningful responses that integrate information from multiple sources when needed

## Submission Guidelines

1. Fork this repository
2. Implement your solution
3. Submit a pull request with your implementation
4. Include detailed instructions on how to run and test your solution
5. Your code must be 100% functional

## Evaluation Criteria

Your submission will be evaluated based on:

- **Functionality**: Does it work as expected? Can it correctly use all three data sources?
- **Code Quality**: Is the code well-organized, commented, and following best practices?
- **Error Handling**: How does the agent handle edge cases and errors?
- **User Experience**: Is the conversation with the agent natural and helpful?
- **Documentation**: Is the setup and usage well documented?

## Resources

- [LangChain JS Documentation](https://js.langchain.com/docs/)
- [LangGraph Documentation](https://js.langchain.com/docs/langgraph/)
- [SQLite in Node.js Guide](https://www.sqlitetutorial.net/sqlite-nodejs/)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Good luck with your implementation! We're excited to see your creative solutions to this challenge.
