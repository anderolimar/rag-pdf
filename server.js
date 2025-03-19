import { app } from "./app.js"
import dotenv from "dotenv";
const PORT = process.env.PORT || 5000;

dotenv.config();

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
