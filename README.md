# 🤖 Multi-Source AI Agent Challenge

A sophisticated AI agent that intelligently routes queries across multiple data sources including SQLite databases, text documents, and external bash commands.

## 🚀 Features

This advanced AI agent can:

- **Query SQLite databases** with natural language, converting to optimized SQL
- **Search through text documents** using semantic similarity  
- **Execute bash commands** safely with user approval for external data
- **Handle general conversation** with context awareness
- **Intelligent routing** using LangGraph for optimal data source selection

## 📦 Installation

1. **Clone and install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your API key
   ```

3. **Start the agent**:

   ```bash
   npm start
   ```

## 🔧 Configuration

Create a `.env` file with:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
MODEL_NAME=llama-3.3-70b-versatile
TEMPERATURE=0.1
MAX_TOKENS=2000
```

## 🎯 How to Use

Once the agent starts, you can ask questions that will be automatically routed to the appropriate data source. **For best results, be specific and mention table names in your queries.**

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

## 🧪 Testing Examples

### SQLite Database Tests

```bash
# Test basic queries
💬 You: List all artists
💬 You: Count all albums
💬 You: Show me track information
```

## 🛠️ Technology Stack

- **Node.js**: Runtime environment
- **LangChain**: LLM integration and chains
- **LangGraph**: Agent workflow orchestration  
- **SQLite3**: Database operations
- **Groq API**: Language model with llama-3.3-70b-versatile
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
