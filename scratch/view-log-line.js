const fs = require("fs");
const path = require("path");

const logPath = "C:\\Users\\Nikhil chandra\\.gemini\\antigravity\\brain\\b4f87c5f-950d-47d3-a4e0-e177d7561304\\.system_generated\\logs\\transcript.jsonl";
const content = fs.readFileSync(logPath, "utf8");
const lines = content.split("\n");

// Print line index 169 (170th line)
console.log(lines[169]);
process.exit(0);
