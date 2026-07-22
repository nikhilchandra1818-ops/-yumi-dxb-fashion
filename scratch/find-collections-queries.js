const fs = require("fs");
const path = require("path");

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        searchDir(fullPath);
      }
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes('getCollection<Collection>("collections"') || content.includes('getCollection("collections"')) {
        console.log("Match in:", fullPath);
      }
    }
  });
}

console.log("Searching for queries to 'collections' collection...");
searchDir(path.join(__dirname, ".."));
process.exit(0);
