import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { WeaviateStore } from "@langchain/weaviate";
import { OpenAIEmbeddings } from "@langchain/openai";
import weaviatets, {  ApiKey } from 'weaviate-ts-client';
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate, MessagesPlaceholder} from "@langchain/core/prompts";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { uploadDirectory } from "./constants.js"

async function embeddingPDF(uploadedFile) {
    try {
        if (!uploadedFile) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing fileContent" }),
            };
        }

        const fileName = `${uploadedFile.originalname}`;
        const filePath = getFilePath(fileName);
        const indexName = getIndexName(fileName)

        console.log("PDF loading ...");
        const pdfLoader = new PDFLoader(filePath);
        const docs = await pdfLoader.load();
        console.log("PDF loading finish");

        console.log("Splitting PDF ...");
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const allSplits = await splitter.splitDocuments(docs);
        console.log(`Split PDF into ${allSplits.length} sub-documents.`);


        console.log("Conecting to weaviate ...");
        const weaviateTSClient = await getWeaviateTSClient();
        console.log("Conected to weaviate");

        await weaviateTSClient.schema
            .classDeleter()
            .withClassName(indexName)
            .do();

        console.log(`Adding documents in weaviate ...`);
        const vectorStore = getVectorStore(weaviateTSClient, indexName);
        await vectorStore.addDocuments(allSplits)
        console.log(`Adding documents in weaviate finish`);

        return {
            statusCode: 200,
            body: { message: "File uploaded successfully!", fileName },
        };

    } catch (error) {
        console.error("Error uploading file:", error);
        return {
            statusCode: 500,
            body: { message: "Error uploading file", error },
        };
    }
}

async function answerQuestion(question, fileName) {
    const filePath = getFilePath(fileName);

    console.log(`Getting ChatOpenAI ...`);
    const llm = new ChatOpenAI({
        model: process.env.CHATGPT_MODEL ?? "gpt-4o-mini",
        temperature: parseInt(process.env.CHATGPT_TEMPERATURE ?? "0")
    });
    console.log(`Getting ChatOpenAI finish`);

    const indexName = getIndexName(fileName)

    console.log(`Connecting to Weaviate ...`);
    const weaviateTSClient = await getWeaviateTSClient();
    console.log(`Connecting to Weaviate finish`);

    console.log(`Getting Retriever and invoke question...`);
    const retriever = getRetriever(weaviateTSClient, indexName, filePath)
    const docs = await retriever.invoke(question);
    console.log(`Getting Retriever and invoke question finish`);

    const SYSTEM_TEMPLATE = `Answer the user's questions based on the below context. 
    If the context doesn't contain any relevant information to the question, don't make something up and just say "I don't know":

    <context>
    {context}
    </context>
    `;

    console.log(`Creating ChatPromptTemplate and invoke question...`);
    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_TEMPLATE],
        new MessagesPlaceholder("messages"),
    ]);

    console.log(`Creating StuffDocumentsChain...`);
    const documentChain = await createStuffDocumentsChain({
        llm,
        prompt: questionAnsweringPrompt,
    });
    
    console.log(`Call documentChain.invoke ...`);
    const answer = await documentChain.invoke({
        messages: [new HumanMessage(question)],
        context: docs,
    });
    console.log(`Returning answer to the question.`);

    return {
        statusCode: 200,
        body: { answer },
    };
}

function getVectorStore(weaviateTSClient, indexName) {
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
    });

    const vectorStore = new WeaviateStore(embeddings, {
        client: weaviateTSClient,
        // Must start with a capital letter
        indexName: indexName,
        // Default value
        textKey: "text",
        // Any keys you intend to set as metadata
        metadataKeys: ["source"],
    });

    return vectorStore;
}

function getRetriever(weaviateTSClient, indexName, filePath) {
    const vectorStore = getVectorStore(weaviateTSClient, indexName)

    // const filter = {
    //     where: {
    //         operator: "Equal",
    //         path: ["source"],
    //         valueText: filePath
    //     },
    // };

    // const similaritySearchResults = await vectorStore.similaritySearch(
    //     "How git branch works?",
    //     2,
    //     filter
    // );

    const retriever = vectorStore.asRetriever({
        // Optional filter
        //filter: filter,
        k: 3,
    });
    // const similaritySearchResults = await retriever.invoke("git");

    return retriever;
}

async function getWeaviateTSClient() {
    const clientConfig = {
        scheme: process.env.WEAVIATE_SCHEME ?? "http",
        host: process.env.WEAVIATE_HOST ?? "localhost:8080",
    }

    if (process.env.WEAVIATE_API_KEY) {
        clientConfig.apiKey = new ApiKey(process.env.WEAVIATE_API_KEY)
    }

    const weaviateTSClient = await weaviatets.client(clientConfig);
    return weaviateTSClient;
}

function getIndexName(fileName) {
    return capitalizeFirstLetter(fileName.replace(/[^a-zA-Z]/g, ""))
}

function getFilePath(fileName) {
    return `${uploadDirectory}/${fileName}`;
}

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export {
    embeddingPDF,
    answerQuestion
}