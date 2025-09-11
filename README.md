# 🤖 Multi-Source AI Agent Challenge

An **intelligent AI agent** that autonomously decides which data sources to query based on your questions. Using advanced LLM reasoning, it seamlessly accesses SQLite databases, text documents, and external commands without any hardcoded rules.

## 🚀 Key Features

This **truly autonomous AI agent** can:

- **🧠 LLM-Driven Decision Making**: The agent uses Large Language Model reasoning to decide which tools to use - no keyword routing or hardcoded rules
- **🗄️ Smart Database Queries**: Converts natural language to optimized SQL queries for music database exploration
- **📄 Document Intelligence**: Searches through economics literature using intelligent text analysis
- **💻 Terminal Command Execution**: Safely executes system commands with user approval for real-time external data
- **💬 Natural Conversation**: Handles general questions and provides contextual responses
- **🔧 True Tool Integration**: Built with LangChain Tools and LangGraph workflow for professional-grade AI agent architecture

## 🧠 What Makes This Agent Special

Unlike simple keyword-based chatbots, this agent uses **genuine AI reasoning**:

- **No Hardcoded Logic**: The LLM analyzes your question and decides autonomously which tool(s) to use
- **Context Understanding**: Understands the intent behind your questions, not just keywords
- **Multi-Step Reasoning**: Can combine information from multiple sources when needed
- **Learning from Examples**: The agent learns from the tool descriptions and database schema
- **Real Decision Making**: Each response is a result of actual AI analysis, not pre-programmed responses

## 📦 Installation & Usage

### 🐳 Option 1: Docker

**⚠️ Important Docker Note**: When running with Docker, you'll need to access the container's terminal to interact with the agent. If you have trouble accessing the Docker terminal, we recommend using the local installation instead.

#### Quick Start with Docker

1. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Groq API key
   ```

2. **Build and start:**
   ```bash
   docker-compose up --build
   ```

3. **Access the agent terminal:**
   ```bash
   # In another terminal, access the running container:
   docker-compose exec multi-source-ai-agent sh
   
   # Then inside the container, start the agent:
   npm start
   ```

#### If Docker Terminal Access Fails

If you can't access the Docker container terminal or prefer simpler setup, use the local installation method below.

### 🔧 Option 2: Local Installation (Recommended)

**Simpler and more reliable** - run directly on your machine:

#### Prerequisites
- Node.js 18+ installed
- npm package manager

#### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Groq API key
   ```

3. **Start the agent:**
   ```bash
   npm start
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## 🔧 Configuration

Create a `.env` file with your Groq API key:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
MODEL_NAME=llama-3.3-70b-versatile
TEMPERATURE=0.1
MAX_TOKENS=2000
```

## 🎯 How to Use the Agent

### � Starting a Conversation

Once the agent starts, you'll see:

```
💬 You: 
```

Simply type your questions naturally! The AI agent will automatically determine the best approach to answer you.

**Available Commands:**
- `help` - Show available commands
- `examples` - Display example questions  
- `clear` - Clear the screen
- `quit` / `exit` / `bye` - Exit the application

### 🧪 Example Interactions

The beauty of this agent is that you can ask questions naturally, and it will figure out what to do:

#### 🎵 Music Database Questions

The agent knows about these tables: `Artist`, `Album`, `Track`, `Customer`, `Employee`, `Invoice`, `InvoiceLine`, `Playlist`, `PlaylistTrack`, `Genre`, `MediaType`

```text
� You: How many artists are in the database?
💬 You: Show me some albums by The Beatles
💬 You: What are the top selling tracks?
💬 You: Find customers from Brazil
💬 You: List all music genres
```

#### 📄 Economics Document Questions

```text
💬 You: Tell me about Adam Smith
💬 You: What is Keynesian economics?
💬 You: Explain the invisible hand theory
💬 You: Who wrote Das Kapital?
```

#### 🌐 External Data Questions (with approval)

```text
💬 You: What's my IP address?
💬 You: What time is it?
💬 You: Get current weather information
💬 You: Show me today's date
```

**⚠️ Safety Note**: For external commands, the agent will ask for your approval before executing anything.

#### � General Conversation

```text
💬 You: Hello, how are you?
💬 You: What can you help me with?
💬 You: Thank you for your assistance
```

### 🤖 How the Agent Makes Decisions

This is what makes our agent special - **true AI reasoning**:

1. **Question Analysis**: The LLM analyzes your question to understand what you're asking for
2. **Tool Selection**: Based on the content, it autonomously decides which tool(s) to use:
   - Database queries → `database_query` tool
   - Economics questions → `file_search` tool  
   - External data → `execute_command` tool
   - General chat → Direct response
3. **Execution**: The agent executes the appropriate tool with generated parameters
4. **Response Synthesis**: It interprets the results and provides you with a natural language answer

**No keywords, no hardcoded rules - just intelligent AI reasoning!**



## 🧠 Architecture

The agent uses **LangGraph workflow orchestration** with **LangChain Tools** for professional-grade AI agent architecture:

```text
User Input → LLM Analysis → Tool Selection → Tool Execution → LLM Response → User
```

### Key Components

- **`MultiSourceAgent`**: Main autonomous agent using LangGraph StateGraph for decision-making workflow
- **`DatabaseTool`**: LangChain DynamicStructuredTool for SQL query generation and execution  
- **`FileTool`**: LangChain DynamicStructuredTool for document search and content retrieval
- **`TerminalTool`**: LangChain DynamicStructuredTool for secure system command execution
- **`ConversationInterface`**: Interactive terminal interface for user interaction

### 🔄 Agent Decision Flow

1. **User Input**: You ask a question in natural language
2. **LLM Analysis**: The Groq LLaMA 3.3 70B model analyzes your intent
3. **Autonomous Tool Selection**: The LLM decides which tool(s) to use based on understanding, not keywords
4. **Parameter Generation**: The LLM generates appropriate parameters for the selected tool(s)
5. **Tool Execution**: The chosen tool executes with the generated parameters
6. **Result Integration**: The LLM processes the tool output and formulates a natural response
7. **Response Delivery**: You receive a contextual, intelligent answer

## 🧪 Running Tests

### Local Environment

```bash
npm test
```

### Docker Environment

```bash
docker-compose exec multi-source-ai-agent npm test
```

## 🛠️ Technology Stack

- **Node.js 18+**: Runtime environment with ES modules
- **LangChain 0.3.x**: Professional LLM integration with structured tools
- **LangGraph 0.2.x**: State machine workflow orchestration for agent decision-making
- **Groq API**: High-performance LLM inference with LLaMA 3.3 70B Versatile
- **SQLite3**: Embedded database for music data storage
- **Zod**: Schema validation for tool parameters
- **Chalk**: Terminal colors and formatting

## 🔒 Security Features

- **User approval required** for all external command executions
- **Command safety validation** before execution
- **Timeout protection** (30 seconds) for external requests
- **Input sanitization** and parameter validation via Zod schemas
- **Error isolation** - failures in one tool don't crash the agent
- **No hardcoded credentials** - all secrets via environment variables

## 🚀 What Makes This Implementation Unique

### 🧠 True AI Agent Architecture

- **LLM-Driven Decisions**: No keyword matching or hardcoded rules - the agent uses genuine AI reasoning
- **Professional Tools**: Built with LangChain DynamicStructuredTools and Zod validation
- **State Machine Workflow**: LangGraph StateGraph manages complex decision flows
- **Autonomous Parameter Generation**: The LLM generates SQL queries, search terms, and commands independently

### 🔧 Production-Ready Features

- **Comprehensive Error Handling**: Graceful failure recovery with detailed logging
- **Resource Management**: Proper cleanup of database connections and system resources
- **Scalable Architecture**: Easy to add new tools or modify existing ones
- **Environment Flexibility**: Runs locally or in containers with consistent behavior

### 🎯 User Experience

- **Natural Conversation**: Ask questions however feels natural to you
- **Context Awareness**: The agent understands what you're looking for
- **Safety First**: External commands always require explicit user approval
- **Helpful Guidance**: Built-in help system and example interactions

---

**Created for Curling-AI: hiring-challenge-alpha** 🚀