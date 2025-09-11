# 🤖 Multi-Source AI Agent Challenge

A sophisticated AI agent that intelligently routes queries across multiple data sources including SQLite databases, text documents, and external bash commands.

## 🚀 Features

This advanced AI agent can:

- **Query SQLite databases** with natural language, converting to optimized SQL
- **Search through text documents** using semantic similarity  
- **Execute bash commands** safely with user approval for external data
- **Handle general conversation** with context awareness
- **Intelligent routing** using LangGraph for optimal data source selection

## 📦 Installation & Usage

Choose your preferred method to run the Multi-Source AI Agent:

### 🐳 Option 1: Docker (Recommended)

**Why Docker?** Consistent environment, easy setup, no dependency conflicts.

#### Prerequisites
- Install [Docker Desktop](https://docs.docker.com/get-docker/)
- Make sure Docker Desktop is running

#### Quick Start

**Windows PowerShell:**
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run automated setup
.\docker-setup.ps1
```

**Linux/Mac:**
```bash
# Make script executable and run
chmod +x docker-setup.sh
./docker-setup.sh
```

#### Manual Docker Setup

1. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Groq API key
   ```

2. **Build and start:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   ```bash
   # The agent will start automatically in the container
   # You can interact with it directly in the terminal
   ```

#### Docker Commands

```bash
# Start the agent
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Access container terminal
docker-compose exec multi-source-ai-agent sh

# Stop the agent
docker-compose down

# Run tests
docker-compose exec multi-source-ai-agent npm test
```

### 🔧 Option 2: Local Installation

**When to use:** If you prefer running directly on your machine or for development.

#### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

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

Create a `.env` file with:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
MODEL_NAME=openai/gpt-oss-120b
TEMPERATURE=0.1
MAX_TOKENS=2000
```

## 🎯 How to Access & Test the Application

### 🐳 Using Docker

After running `docker-compose up`, the agent starts automatically in the container terminal. You can interact with it directly.

**To access the running container:**
```bash
# If running in background, attach to the container
docker-compose exec multi-source-ai-agent sh

# Or view logs in real-time
docker-compose logs -f
```

### 🔧 Using Local Installation

After running `npm start`, the agent starts in your current terminal and you can interact with it directly.

### 💬 How to Interact

Once the agent starts (either Docker or local), you'll see:
```
💬 You: 
```

This is where you type your questions. The agent will automatically route your query to the appropriate data source.

**Available Commands:**
- `help` - Show available commands
- `examples` - Display example questions  
- `clear` - Clear the screen
- `quit` / `exit` / `bye` - Exit the application

### 🧪 Test Examples

**For best results, be specific and mention table names in your queries:**

### 🎵 Available Database Tables

The music database contains: `Artist`, `Album`, `Track`, `Customer`, `Employee`, `Invoice`, `InvoiceLine`, `Playlist`, `PlaylistTrack`, `Genre`, `MediaType`

### 📊 Music Database Queries

Query the music database with specific table references:

```text
💬 You: In the Invoice table, show me the top 10 highest sales
💬 You: From the Customer table, what is François Tremblay's email?
💬 You: From the Artist table, show me all musicians
💬 You: From the Playlist table, show all playlists
💬 You: In the Genre table, what music categories are available?
```

### 🌐 External Data (with user approval)

Execute bash commands to fetch external data:

```text
💬 You: What time is it?
💬 You: What's my IP address?
💬 You: Get current exchange rates
💬 You: What's the current weather?

⚠️ **Safety Note**: The agent will ask for your approval before executing any bash commands.
```

### 📄 Document Search

The agent searches through economics documents:

```text
💬 You: Tell me about Adam Smith
💬 You: Who wrote Das Kapital?
```



### 💬 General Conversation

Handle general queries:

```text
💬 You: Hello, how are you?
💬 You: What tables are available in the database?
💬 You: Thank you for your help
```

### 💡 Pro Tips for Better Results

- Always specify the table name: "From the Customer table..."
- Be specific about what you want to find
- Use proper names when searching for specific records
- Type `examples` in the chat for more sample questions



## 🧠 Architecture

The agent uses a sophisticated workflow built with LangGraph:

```text
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

## 🧪 Running Tests

### Docker Environment
```bash
docker-compose exec multi-source-ai-agent npm test
```

### Local Environment
```bash
npm test
```

## 🛠️ Technology Stack

- **Node.js**: Runtime environment
- **LangChain**: LLM integration and chains
- **LangGraph**: Agent workflow orchestration  
- **SQLite3**: Database operations
- **Groq API**: Language model with openai/gpt-oss-120b
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

---

**Made for Curling-AI: hiring-challenge-alpha** 🚀
