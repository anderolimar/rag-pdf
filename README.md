

# PDF RAG Chat Bot

This project provides a service to upload a PDF file and create a Retrieval-Augmented Generation (RAG) system. A chatbot is included to answer questions based on the PDF content.

## Features
- Upload a PDF file and process its content.
- Create a RAG pipeline for efficient information retrieval.
- Chatbot interface to interact with the extracted content.

## Requirements
Ensure you have the following dependencies installed:
- **Node.js** (v20)
- **NPM**
- **Serverless Framework**
- **Docker Compose**
- **Weaviate Database**
- **AWS Account**

## Environment Variables
Set up the following environment variables before running the project:

```plaintext
OPENAI_API_KEY=<your_openai_api_key>
WEAVIATE_SCHEME=<http_or_https>
WEAVIATE_HOST=<your_weaviate_host>
WEAVIATE_API_KEY=<your_weaviate_api_key>
AWS_SECRET_KEY=<your_aws_secret_key>
AWS_ACCESS_KEY=<your_aws_access_key>
```

## Installation
1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd <project-directory>
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up your environment variables as mentioned above.
4. Start the required services using Docker Compose:
   ```sh
   docker-compose up -d
   ```

2. Install dependencies:
   ```sh
   npm install
   ```
## Run Local
1.  Set up your environment variables as mentioned above (You can use .env file).

2. Run follow command:
   ```sh
   npm start
   ```


## Deploy AWS
1.  Set up your environment variables as mentioned above (You can use .env file).

2.  Deploy the serverless functions:
  ```sh
  npm install
  serverless deploy
  ```

3. After running deploy, you should see output similar to:

  ```
  Deploying "aws-node-express-api" to stage "dev" (us-east-1)

  ✔ Service deployed to stack aws-node-express-api-dev (96s)

  endpoint: ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
  functions:
    api: aws-node-express-api-dev-api (2.3 kB)
  ```

4. Access the chatbot via the provided endpoint.

5. Upload a PDF file and start querying its content.

## License
This project is licensed under the MIT License.

