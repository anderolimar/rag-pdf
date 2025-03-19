import { embeddingPDF, answerQuestion } from "./service.js"
import { uploadDirectory } from "./constants.js"
import multer from 'multer';
import express from 'express';
import path from 'path';
const __dirname = path.resolve();
const app = express();

app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
       cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
       cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Retrieve the uploaded file from the request body
    const uploadedFile = req.file;
    let resp = await embeddingPDF(uploadedFile)
    res.status(resp.statusCode).json(resp)
});

// Upload route
app.post("/question", async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: 'No body' });
    }

    const {question, fileName } = req.body 

    if (!question) {
        return res.status(400).json({ error: 'No question' });
    }

    const answer = await answerQuestion(question, fileName);
   
    res.status(200).json(answer)
}); 

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle all other routes with a fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});


export { app }
