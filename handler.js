import serverless from "serverless-http";
import { app } from "./function.js"

export const handler = serverless(app);
