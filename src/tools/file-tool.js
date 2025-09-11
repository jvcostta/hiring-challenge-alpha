import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// NOVOS IMPORTS ESSENCIAIS PARA RAG
import { MemoryVectorStore } from "@langchain/community/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai"; // Ou outro provedor de embeddings
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export class FileTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'file_content_retriever',
            description: `Busca e recupera seções de texto relevantes de documentos sobre economia. 
            Use esta ferramenta para encontrar o contexto necessário para responder perguntas sobre teorias econômicas, economistas e conceitos. 
            A entrada deve ser uma pergunta ou um conjunto de termos que descrevam o conceito que você está procurando.`,
            schema: z.object({
                query: z.string().describe("A pergunta ou os termos de busca para encontrar informações relevantes nos documentos."),
            }),
            func: async ({ query }) => {
                // A função agora é um simples recuperador
                if (!this.vectorStore) {
                    return "A ferramenta de arquivos ainda não foi inicializada. Por favor, aguarde.";
                }
                console.log(chalk.blue(`      🔍 Searching for documents semantically similar to: "${query}"`));
                
                // O Vector Store faz a busca por significado (similaridade)
                const results = await this.vectorStore.similaritySearch(query, 4); // Busca os 4 chunks mais relevantes
                
                if (results.length === 0) {
                    return "Nenhuma informação relevante foi encontrada nos documentos para esta consulta.";
                }

                // Retorna o conteúdo dos chunks encontrados para o LLM usar como contexto
                return this.formatResults(results);
            },
        });
        
        this.dataPath = path.join(process.cwd(), 'data', 'documents');
        /** @type {MemoryVectorStore | null} */
        this.vectorStore = null; // Onde nossa "memória" dos documentos ficará
    }

    // A inicialização agora também faz a INDEXAÇÃO
    async initialize() {
        if (!fs.existsSync(this.dataPath)) {
            throw new Error(`Diretório de documentos não encontrado: ${this.dataPath}`);
        }

        const txtFiles = fs.readdirSync(this.dataPath).filter(file => file.endsWith('.txt'));
        if (txtFiles.length === 0) {
            throw new Error('Nenhum documento de texto encontrado no diretório data/documents');
        }

        console.log(chalk.gray(`      📄 Indexing ${txtFiles.length} document(s)...`));
        const documents = [];
        for (const txtFile of txtFiles) {
            const filePath = path.join(this.dataPath, txtFile);
            const content = fs.readFileSync(filePath, 'utf-8');
            documents.push({
                pageContent: content,
                metadata: { source: txtFile },
            });
        }
        
        // 1. Dividir os documentos em pedaços (chunks)
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const chunks = await textSplitter.splitDocuments(documents);

        // 2. Criar os embeddings e armazenar no Vector Store em memória
        //    (Certifique-se que sua OPENAI_API_KEY está no .env)
        this.vectorStore = await MemoryVectorStore.fromDocuments(
            chunks,
            new OpenAIEmbeddings()
        );
        
        console.log(chalk.green(`      ✅ File tool indexed and ready!`));
    }

    // Função auxiliar para formatar os resultados
    formatResults(results) {
        let formattedString = "Contexto relevante encontrado nos documentos:\n\n";
        results.forEach((doc, index) => {
            formattedString += `--- Trecho ${index + 1} (Fonte: ${doc.metadata.source}) ---\n`;
            formattedString += doc.pageContent;
            formattedString += "\n\n";
        });
        return formattedString;
    }


}