const fs = require("fs");
const path = require("path");

const logPath = "C:\\Users\\Nikhil chandra\\.gemini\\antigravity\\brain\\b4f87c5f-950d-47d3-a4e0-e177d7561304\\.system_generated\\logs\\transcript.jsonl";

if (!fs.existsSync(logPath)) {
  console.log("Log file not found:", logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, "utf8");
const lines = content.split("\n");

console.log(`Searching ${lines.length} lines of logs...`);
lines.forEach((line, idx) => {
  if (!line) return;
  try {
    const obj = JSON.parse(line);
    const text = JSON.stringify(obj);
    if (text.includes('"collections"') || text.includes("collection_")) {
      console.log(`Line ${idx + 1}: type="${obj.type || ""}"`);
      // Print first 200 chars of content
      const printText = text.slice(0, 300);
      console.log("  Snippet:", printText);
    }
  } catch (err) {
    // Ignore invalid JSON lines
  }
});
process.exit(0);
