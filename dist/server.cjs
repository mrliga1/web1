var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_parser = require("@babel/parser");
var import_traverse = __toESM(require("@babel/traverse"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
import_dotenv.default.config();
if (!process.env.SMTP_USER && import_fs.default.existsSync(".env.example")) {
  const envConfig = import_dotenv.default.parse(import_fs.default.readFileSync(".env.example"));
  for (const k in envConfig) {
    if (!process.env[k]) {
      process.env[k] = envConfig[k];
    }
  }
}
function cleanEnvVar(val) {
  if (!val) return "";
  let s = val.trim();
  while (s.startsWith('"') && s.endsWith('"') || s.startsWith("'") && s.endsWith("'")) {
    s = s.slice(1, -1).trim();
  }
  return s;
}
function getEnv(key) {
  if (import_fs.default.existsSync(".env.example")) {
    const envConfig = import_dotenv.default.parse(import_fs.default.readFileSync(".env.example"));
    if (envConfig[key]) {
      return cleanEnvVar(envConfig[key]);
    }
  }
  return cleanEnvVar(process.env[key]);
}
function getDecodedGithubToken() {
  let githubToken = getEnv("GITHUB_TOKEN");
  if (githubToken.startsWith("base64:")) {
    const base64Part = githubToken.slice(7);
    if (base64Part.startsWith("ghp_") || base64Part.startsWith("github_pat_")) {
      return base64Part;
    }
    try {
      return Buffer.from(base64Part, "base64").toString("utf8").trim();
    } catch (e) {
      console.error("[Token Decode Error] Failed to decode base64 GITHUB_TOKEN:", e);
    }
  }
  return githubToken;
}
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
function initFirebaseAdmin() {
  if (import_firebase_admin.default.apps?.length > 0) return;
  const saBase64 = getEnv("FIREBASE_SERVICE_ACCOUNT_BASE64");
  if (saBase64) {
    try {
      const sa = JSON.parse(Buffer.from(saBase64, "base64").toString("utf8"));
      import_firebase_admin.default.initializeApp({
        credential: import_firebase_admin.default.credential.cert(sa)
      });
      console.log("[Firebase Admin] Initialized successfully.");
    } catch (e) {
      console.error("[Firebase Admin] Initialize failed:", e.message);
    }
  }
}
initFirebaseAdmin();
app.post("/api/firebase-admin-config", (req, res) => {
  try {
    const { serviceAccountJson } = req.body;
    if (!serviceAccountJson) return res.status(400).json({ error: "Missing serviceAccountJson" });
    let parsedParams;
    try {
      parsedParams = JSON.parse(serviceAccountJson);
      if (!parsedParams.project_id || !parsedParams.private_key) {
        throw new Error("Invalid JSON structure");
      }
    } catch (err) {
      return res.status(400).json({ error: "N\u1ED9i dung JSON kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c thi\u1EBFu project_id/private_key." });
    }
    const base64SA = Buffer.from(serviceAccountJson).toString("base64");
    let envContent = "";
    const envPath = import_path.default.join(process.cwd(), ".env");
    if (import_fs.default.existsSync(envPath)) {
      envContent = import_fs.default.readFileSync(envPath, "utf8");
    }
    const lines = envContent.split("\n");
    const newLines = lines.filter((line) => !line.trim().startsWith("FIREBASE_SERVICE_ACCOUNT_BASE64="));
    newLines.push(`FIREBASE_SERVICE_ACCOUNT_BASE64="${base64SA}"`);
    import_fs.default.writeFileSync(envPath, newLines.filter(Boolean).join("\n") + "\n");
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = base64SA;
    initFirebaseAdmin();
    return res.json({ success: true, message: "\u0110\xE3 l\u01B0u c\u1EA5u h\xECnh Firebase Admin th\xE0nh c\xF4ng!" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/firebase-admin-status", (req, res) => {
  const sa = getEnv("FIREBASE_SERVICE_ACCOUNT_BASE64");
  res.json({ configured: !!sa && (import_firebase_admin.default.apps?.length || 0) > 0 });
});
app.delete("/api/users/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!import_firebase_admin.default.apps?.length) {
      return res.status(403).json({ error: "Ch\u01B0a c\u1EA5u h\xECnh Firebase Admin SDK. Vui l\xF2ng th\xEAm Kh\xF3a Service Account." });
    }
    try {
      await import_firebase_admin.default.auth().deleteUser(uid);
    } catch (e) {
      if (e.code === "auth/user-not-found" || String(e).includes("no user record")) {
        return res.json({ success: true, message: "Ng\u01B0\u1EDDi d\xF9ng kh\xF4ng t\u1ED3n t\u1EA1i trong Auth (\u0111\xE3 b\u1ECB x\xF3a tr\u01B0\u1EDBc \u0111\xF3)" });
      }
      throw e;
    }
    return res.json({ success: true, message: "\u0110\xE3 x\xF3a ng\u01B0\u1EDDi d\xF9ng kh\u1ECFi Auth" });
  } catch (err) {
    const errorMsg = err?.message || String(err);
    console.error("L\u1ED7i khi x\xF3a ng\u01B0\u1EDDi d\xF9ng:", err);
    return res.status(500).json({ error: errorMsg, code: err?.code });
  }
});
var uploadsDir = import_path.default.join(process.cwd(), "public", "uploads");
if (!import_fs.default.existsSync(uploadsDir)) {
  import_fs.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", import_express.default.static(uploadsDir));
app.post("/api/upload", async (req, res) => {
  try {
    const { name, base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "Missing base64 audio/image content." });
    }
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let base64Data = base64;
    let fileExtension = "png";
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      base64Data = matches[2];
      fileExtension = mimeType.split("/")[1] || "png";
    }
    const originalRefName = name ? import_path.default.parse(name).name : "img";
    const sanitisedFilename = originalRefName.replace(/[^a-zA-Z0-9-_]/g, "");
    const finalFilename = `${sanitisedFilename}-${Date.now()}.${fileExtension}`;
    const targetFilePath = import_path.default.join(uploadsDir, finalFilename);
    const binaryData = Buffer.from(base64Data, "base64");
    import_fs.default.writeFileSync(targetFilePath, binaryData);
    const uploadedRelativeUrl = `/uploads/${finalFilename}`;
    let isRemoteSynced = false;
    let fallbackCommitError = "";
    let githubToken = getDecodedGithubToken();
    let githubOwner = getEnv("GITHUB_OWNER");
    let githubRepo = getEnv("GITHUB_REPO");
    let githubBranch = getEnv("GITHUB_BRANCH") || "main";
    if (githubOwner.startsWith("ghp_") || githubOwner.startsWith("github_pat_")) {
      const cacheVal = githubOwner;
      githubOwner = githubToken;
      githubToken = cacheVal;
    }
    if (githubToken && githubOwner && githubRepo) {
      try {
        const targetRepoContentsUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/public/uploads/${finalFilename}`;
        const authHeaderValue = githubToken.startsWith("ghp_") || githubToken.startsWith("github_pat_") ? `token ${githubToken}` : `Bearer ${githubToken}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1e4);
        const syncResponse = await fetch(targetRepoContentsUrl, {
          method: "PUT",
          headers: {
            "Authorization": authHeaderValue,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Greenia-Homes-Uploader"
          },
          body: JSON.stringify({
            message: `Ch\xE8n \u1EA3nh \u0111\u1EA1i di\u1EC7n ${finalFilename} t\u1EF1 \u0111\u1ED9ng t\u1EEB Admin Dashboard`,
            content: base64Data,
            branch: githubBranch
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (syncResponse.ok) {
          isRemoteSynced = true;
          console.log(`[GitHub Sync] \u0110\u1ED3ng b\u1ED9 th\xE0nh c\xF4ng \u1EA3nh ${finalFilename} l\xEAn GitHub.`);
        } else {
          const jsonErrorResponse = await syncResponse.json().catch(() => ({}));
          fallbackCommitError = jsonErrorResponse.message || syncResponse.statusText;
          if (syncResponse.status === 401 || syncResponse.status === 403) {
            console.log(`[Local Saved SUCCESS] \u1EA2nh \u0111\xE3 \u0111\u01B0\u1EE3c l\u01B0u th\xE0nh c\xF4ng tr\xEAn m\xE1y ch\u1EE7 c\u1EE5c b\u1ED9 (${uploadedRelativeUrl}). M\xE1ch nh\u1ECF: T\xEDnh n\u0103ng sao l\u01B0u GitHub ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5p quy\u1EC1n ho\u1EB7c sai Token (M\xE3 401/403: ${fallbackCommitError}).`);
          } else {
            console.log(`[Local Saved SUCCESS] \u0110\xE3 l\u01B0u \u1EA3nh c\u1EE5c b\u1ED9. \u0110\u1ED3ng b\u1ED9 \u0111\xE1m m\xE2y t\u1EA1m d\u1EEBng: ${fallbackCommitError}`);
          }
        }
      } catch (githubFetchError) {
        fallbackCommitError = githubFetchError.message || String(githubFetchError);
        console.log("[Local Saved SUCCESS] \u0110\xE3 l\u01B0u \u1EA3nh c\u1EE5c b\u1ED9. L\u1ED7i k\u1EBFt n\u1ED1i \u0111\xE1m m\xE2y sync:", fallbackCommitError);
      }
    }
    const returnedUrl = isRemoteSynced ? `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/${githubBranch}/public/uploads/${finalFilename}` : uploadedRelativeUrl;
    return res.json({
      success: true,
      url: returnedUrl,
      filename: finalFilename,
      githubSynced: isRemoteSynced,
      githubError: fallbackCommitError || void 0
    });
  } catch (error) {
    console.error("File Upload handler crashed with:", error);
    return res.status(500).json({ error: error.message || "Crashed on server during processing." });
  }
});
app.get("/api/fs/files", (req, res) => {
  try {
    const srcDir = import_path.default.join(process.cwd(), "src");
    const getAllFiles = (dirPath, arrayOfFiles) => {
      const files = import_fs.default.readdirSync(dirPath);
      files.forEach((file) => {
        if (import_fs.default.statSync(import_path.default.join(dirPath, file)).isDirectory()) {
          arrayOfFiles = getAllFiles(import_path.default.join(dirPath, file), arrayOfFiles);
        } else {
          if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".css") || file.endsWith(".json")) {
            arrayOfFiles.push(import_path.default.join(dirPath, file).replace(process.cwd(), "").replace(/\\/g, "/"));
          }
        }
      });
      return arrayOfFiles;
    };
    let allFiles = getAllFiles(srcDir, []);
    ["/App.tsx", "/index.css", "/tailwind.config.mjs"].forEach((f) => {
      if (import_fs.default.existsSync(import_path.default.join(process.cwd(), f.replace("/", "")))) {
        if (!allFiles.includes(f)) allFiles.push(f);
      }
    });
    return res.json({ success: true, files: allFiles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/fs/read", (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: "Missing filePath" });
    const safePath = import_path.default.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const absolutePath = import_path.default.join(process.cwd(), safePath);
    if (!import_fs.default.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    const content = import_fs.default.readFileSync(absolutePath, "utf8");
    return res.json({ success: true, content });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/fs/modify-element", (req, res) => {
  try {
    const { filePath, line, action, newText, oldText } = req.body;
    if (!filePath || !line || !action) return res.status(400).json({ error: "Missing parameters" });
    let safePath = typeof filePath === "string" ? filePath : "";
    const cwd = process.cwd();
    if (safePath.startsWith(cwd)) safePath = "/" + import_path.default.relative(cwd, safePath).replace(/\\/g, "/");
    safePath = import_path.default.normalize(safePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const absolutePath = import_path.default.join(cwd, safePath);
    if (!import_fs.default.existsSync(absolutePath)) return res.status(404).json({ error: "File not found" });
    let code = import_fs.default.readFileSync(absolutePath, "utf8");
    const ast = (0, import_parser.parse)(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"]
    });
    let targetNode = null;
    (0, import_traverse.default)(ast, {
      JSXElement(path2) {
        if (path2.node.loc && path2.node.loc.start.line === parseInt(line)) {
          targetNode = path2.node;
        }
      },
      JSXOpeningElement(path2) {
        if (path2.node.loc && path2.node.loc.start.line === parseInt(line)) {
          if (!targetNode) {
            targetNode = path2.parent;
          }
        }
      }
    });
    if (!targetNode) {
      if (action === "update" && oldText) {
        const lines = code.split("\n");
        const lIdx = parseInt(line) - 1;
        lines[lIdx] = lines[lIdx].replace(oldText, newText);
        code = lines.join("\n");
        import_fs.default.writeFileSync(absolutePath, code, "utf8");
        return res.json({ success: true, message: "Updated via fallback", newContent: code });
      }
      return res.status(404).json({ error: "Element not found at line " + line });
    }
    if (action === "delete") {
      const start = targetNode.start;
      const end = targetNode.end;
      code = code.slice(0, start) + code.slice(end);
    } else if (action === "update" && oldText && newText !== void 0) {
      const start = targetNode.start;
      const end = targetNode.end;
      let nodeCode = code.slice(start, end);
      nodeCode = nodeCode.replace(oldText, newText);
      code = code.slice(0, start) + nodeCode + code.slice(end);
    }
    import_fs.default.writeFileSync(absolutePath, code, "utf8");
    return res.json({ success: true, message: "Modified successfully", newContent: code });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/fs/write", (req, res) => {
  try {
    const { filePath, content } = req.body;
    if (!filePath || content === void 0) return res.status(400).json({ error: "Missing parameters" });
    const safePath = import_path.default.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const absolutePath = import_path.default.join(process.cwd(), safePath);
    if (!import_fs.default.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    import_fs.default.writeFileSync(absolutePath, content, "utf8");
    return res.json({ success: true, message: "Saved successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/fs/search", (req, res) => {
  try {
    const { classes, text, tag, exactFile, exactLine } = req.body;
    if (exactFile) {
      let relativePath = exactFile;
      const cwd = process.cwd();
      if (exactFile.startsWith(cwd)) {
        relativePath = "/" + import_path.default.relative(cwd, exactFile).replace(/\\/g, "/");
      } else if (!exactFile.startsWith("/")) {
        relativePath = "/" + exactFile.replace(/\\/g, "/");
      }
      return res.json({ success: true, matches: [{ file: relativePath, line: exactLine, score: 100 }] });
    }
    const srcDir = import_path.default.join(process.cwd(), "src");
    let matches = [];
    const searchFiles = (dirPath) => {
      const files = import_fs.default.readdirSync(dirPath);
      files.forEach((file) => {
        const fullPath = import_path.default.join(dirPath, file);
        if (import_fs.default.statSync(fullPath).isDirectory()) {
          searchFiles(fullPath);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".css")) {
          const relativePath = "/" + import_path.default.relative(process.cwd(), fullPath).replace(/\\/g, "/");
          const lines = import_fs.default.readFileSync(fullPath, "utf8").split("\n");
          lines.forEach((lineStr, lineIdx) => {
            let score = 0;
            if (classes && classes.length > 0) {
              const classTokens = classes.split(" ");
              let matchedTokens = 0;
              classTokens.forEach((token) => {
                if (lineStr.includes(token)) matchedTokens++;
              });
              if (matchedTokens > 0) {
                score += matchedTokens / classTokens.length * 10;
              }
            }
            if (text && text.length > 0) {
              const snippet = text.length > 20 ? text.substring(0, 20) : text;
              if (lineStr.includes(snippet)) {
                score += 15;
              }
            }
            if (tag && lineStr.includes(`<${tag}`)) {
              score += 2;
            }
            if (score > 5) {
              matches.push({ file: relativePath, line: lineIdx + 1, score });
            }
          });
        }
      });
    };
    searchFiles(srcDir);
    ["/App.tsx", "/index.css"].forEach((f) => {
      const full = import_path.default.join(process.cwd(), f.replace("/", ""));
      if (import_fs.default.existsSync(full)) {
      }
    });
    matches.sort((a, b) => b.score - a.score);
    return res.json({ success: true, matches: matches.slice(0, 5) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.get("/api/github-status", async (req, res) => {
  try {
    const githubToken = getDecodedGithubToken();
    const githubOwner = getEnv("GITHUB_OWNER");
    const githubRepo = getEnv("GITHUB_REPO");
    const githubBranch = getEnv("GITHUB_BRANCH") || "main";
    if (!githubToken || !githubOwner || !githubRepo) {
      return res.json({
        configured: false,
        status: "THI\u1EBEU C\u1EA4U H\xCCNH",
        details: "Ch\u01B0a c\u1EA5u h\xECnh \u0111\u1EA7y \u0111\u1EE7 bi\u1EBFn m\xF4i tr\u01B0\u1EDDng GITHUB_TOKEN, GITHUB_OWNER, ho\u1EB7c GITHUB_REPO."
      });
    }
    const authHeaderValue = githubToken.startsWith("ghp_") || githubToken.startsWith("github_pat_") ? `token ${githubToken}` : `Bearer ${githubToken}`;
    const repoUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}`;
    const response = await fetch(repoUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeaderValue,
        "Accept": "application/vnd.github+json",
        "User-Agent": "Greenia-Homes-Uploader"
      }
    });
    if (response.ok) {
      const repoData = await response.json().catch(() => ({}));
      return res.json({
        configured: true,
        status: "HO\u1EA0T \u0110\u1ED8NG",
        owner: githubOwner,
        repo: githubRepo,
        branch: githubBranch,
        isPrivate: repoData.private,
        permissions: repoData.permissions || { admin: false, push: false, pull: true },
        message: "K\u1EBFt n\u1ED1i th\xE0nh c\xF4ng! Token c\xF3 quy\u1EC1n truy c\u1EADp v\xE0o Repo n\xE0y."
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || response.statusText;
      return res.json({
        configured: true,
        status: "L\u1ED6I K\u1EBET N\u1ED0I (401/403/444)",
        owner: githubOwner,
        repo: githubRepo,
        branch: githubBranch,
        statusCode: response.status,
        error: errorMessage,
        message: `L\u1ED7i t\u1EEB GitHub (M\xE3 ${response.status}): ${errorMessage}`
      });
    }
  } catch (err) {
    return res.status(500).json({
      configured: true,
      status: "L\u1ED6I H\u1EC6 TH\u1ED0NG",
      error: err.message || String(err),
      message: "L\u1ED7i trong l\xFAc ki\u1EC3m tra k\u1EBFt n\u1ED1i c\u1EE5c b\u1ED9."
    });
  }
});
app.post("/api/github-config", (req, res) => {
  try {
    const { token, owner, repo, branch } = req.body;
    if (!token || !owner || !repo) {
      return res.status(400).json({ error: "Thi\u1EBFu th\xF4ng tin c\u1EA5u h\xECnh (token, owner ho\u1EB7c repo)." });
    }
    const cleanedToken = token.trim();
    const finalBranch = (branch || "main").trim();
    const finalOwner = owner.trim();
    const finalRepo = repo.trim();
    const base64Token = `base64:${Buffer.from(cleanedToken).toString("base64")}`;
    let envContent = "";
    const envPath = import_path.default.join(process.cwd(), ".env");
    if (import_fs.default.existsSync(envPath)) {
      envContent = import_fs.default.readFileSync(envPath, "utf8");
    }
    const lines = envContent.split("\n");
    const updatedKeys = /* @__PURE__ */ new Set(["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO", "GITHUB_BRANCH"]);
    const newLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return true;
      const firstEqual = trimmed.indexOf("=");
      if (firstEqual === -1) return true;
      const key = trimmed.slice(0, firstEqual).trim();
      return !updatedKeys.has(key);
    });
    newLines.push(`GITHUB_TOKEN="${base64Token}"`);
    newLines.push(`GITHUB_OWNER="${finalOwner}"`);
    newLines.push(`GITHUB_REPO="${finalRepo}"`);
    newLines.push(`GITHUB_BRANCH="${finalBranch}"`);
    import_fs.default.writeFileSync(envPath, newLines.filter(Boolean).join("\n") + "\n");
    process.env.GITHUB_TOKEN = base64Token;
    process.env.GITHUB_OWNER = finalOwner;
    process.env.GITHUB_REPO = finalRepo;
    process.env.GITHUB_BRANCH = finalBranch;
    console.log("[GitHub Config] C\u1EADp nh\u1EADt th\xE0nh c\xF4ng c\u1EA5u h\xECnh GitHub v\xE0o .env (Token \u1EDF d\u1EA1ng Base64 \u1EA9n danh).");
    return res.json({
      success: true,
      message: "L\u01B0u c\u1EA5u h\xECnh GitHub th\xE0nh c\xF4ng! Token \u0111\xE3 \u0111\u01B0\u1EE3c m\xE3 h\xF3a Base64 tr\u01B0\u1EDBc khi l\u01B0u n\xEAn kh\xF4ng s\u1EE3 b\u1ECB GitHub thu h\u1ED3i."
    });
  } catch (error) {
    console.error("Error saving GitHub configuration:", error);
    return res.status(500).json({ error: error.message || "L\u1ED7i trong l\xFAc ghi c\u1EA5u h\xECnh." });
  }
});
app.get("/api/blocked-ips", (req, res) => {
  try {
    let ips = [];
    if (import_fs.default.existsSync("blocked-ips.json")) {
      ips = JSON.parse(import_fs.default.readFileSync("blocked-ips.json", "utf8"));
    }
    res.json({ success: true, ips });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/blocked-ips", import_express.default.json(), (req, res) => {
  try {
    const { ips } = req.body;
    if (!Array.isArray(ips)) {
      return res.status(400).json({ success: false, error: "Invalid data format" });
    }
    import_fs.default.writeFileSync("blocked-ips.json", JSON.stringify(ips, null, 2), "utf8");
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/send-email", async (req, res) => {
  let smtpUser = "";
  let smtpPass = "";
  try {
    let { to, subject, html } = req.body;
    let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Kh\xF4ng x\xE1c \u0111\u1ECBnh";
    if (Array.isArray(clientIp)) {
      clientIp = clientIp[0];
    } else if (typeof clientIp === "string" && clientIp.includes(",")) {
      clientIp = clientIp.split(",")[0].trim();
    }
    const resolvedIp = clientIp;
    let blockedIps = [];
    if (import_fs.default.existsSync("blocked-ips.json")) {
      try {
        blockedIps = JSON.parse(import_fs.default.readFileSync("blocked-ips.json", "utf8"));
      } catch (e) {
      }
    }
    let blockedIpsStr = process.env.BLOCKED_IPS || "";
    if (!blockedIpsStr && import_fs.default.existsSync(".env.example")) {
      const envConfig = import_dotenv.default.parse(import_fs.default.readFileSync(".env.example"));
      if (envConfig.BLOCKED_IPS) blockedIpsStr = envConfig.BLOCKED_IPS;
    }
    if (blockedIpsStr) {
      const envIps = blockedIpsStr.split(",").map((ip) => ip.trim()).filter((ip) => ip.length > 0);
      blockedIps = [.../* @__PURE__ */ new Set([...blockedIps, ...envIps])];
    }
    if (blockedIps.includes(resolvedIp)) {
      console.warn(`[BLOCKED IP] Ch\u1EB7n y\xEAu c\u1EA7u g\u1EEDi email t\u1EEB IP: ${resolvedIp}`);
      return res.json({ success: true, message: "\u0110\xE3 g\u1EEDi li\xEAn h\u1EC7 (Blocked IP)" });
    }
    if (html && typeof html === "string") {
      html = html.replace("{{CLIENT_IP}}", resolvedIp);
    }
    smtpUser = process.env.SMTP_USER ? cleanEnvVar(process.env.SMTP_USER) : "";
    smtpPass = process.env.SMTP_PASS ? cleanEnvVar(process.env.SMTP_PASS).replace(/\s+/g, "") : "";
    if ((!smtpUser || !smtpPass) && import_fs.default.existsSync(".env.example")) {
      const envConfig = import_dotenv.default.parse(import_fs.default.readFileSync(".env.example"));
      if (!smtpUser && envConfig.SMTP_USER) smtpUser = cleanEnvVar(envConfig.SMTP_USER);
      if (!smtpPass && envConfig.SMTP_PASS) smtpPass = cleanEnvVar(envConfig.SMTP_PASS).replace(/\s+/g, "");
    }
    console.log("--- DEBUG SMTP_USER:", smtpUser);
    console.log("--- DEBUG SMTP_PASS length:", smtpPass ? smtpPass.length : 0);
    if (!smtpUser || !smtpPass) {
      console.log("============= [EMAIL NO-SMTP LOG] =============");
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY (HTML):
${html}`);
      console.log("===============================================");
      console.log("GHI CH\xDA: Email \u0111\xE3 \u0111\u01B0\u1EE3c xu\u1EA5t ra Console v\xEC b\u1EA1n ch\u01B0a thi\u1EBFt l\u1EADp SMTP_USER v\xE0 SMTP_PASS trong file .env");
      return res.json({ success: true, simulated: true, message: "Email \u0111\xE3 \u0111\u01B0\u1EE3c log v\xE0o console do ch\u01B0a c\u1EA5u h\xECnh SMTP" });
    }
    const transporter = import_nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        // e.g. thuankdbds@gmail.com
        pass: smtpPass
        // 16-character App password, NOT your main password
      }
    });
    await transporter.sendMail({
      from: `"Greenia Admin CRM" <${smtpUser}>`,
      to,
      subject,
      html
    });
    return res.json({ success: true, message: "\u0110\xE3 g\u1EEDi email th\xE0nh c\xF4ng!" });
  } catch (error) {
    if (error.message && error.message.includes("Invalid login")) {
      console.log("============= [EMAIL NO-SMTP LOG (AUTH FAILED)] =============");
      console.log(`SUBJECT: ${req.body.subject}`);
      console.log(`L\u1ED6I: M\u1EADt kh\u1EA9u \u1EE9ng d\u1EE5ng (App Password) ho\u1EB7c Email kh\xF4ng h\u1EE3p l\u1EC7/ch\xEDnh x\xE1c.`);
      console.log("Vui l\xF2ng t\u1EA1o App Password trong Google Account -> Security -> 2-Step Verification.");
      console.log("=============================================================");
      return res.json({
        success: true,
        simulated: true,
        message: `L\u1ED7i \u0111\u0103ng nh\u1EADp SMTP th\u1EF1c t\u1EBF: \u0110ang d\xF9ng "${smtpUser}" (m\u1EADt kh\u1EA9u d\xE0i ${smtpPass ? smtpPass.length : 0} k\xFD t\u1EF1). L\u01AFU \xDD: Ph\u1EA3i d\xF9ng "M\u1EADt kh\u1EA9u \u1EE8ng d\u1EE5ng" (16 k\xFD t\u1EF1), KH\xD4NG d\xF9ng m\u1EADt kh\u1EA9u ch\xEDnh.`
      });
    }
    console.error("L\u1ED7i khi x\u1EED l\xFD email:", error.message || error);
    return res.status(500).json({ error: error.message });
  }
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  const distPath = import_path.default.join(process.cwd(), "dist");
  let vite;
  if (!isProd) {
    vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "custom"
    });
    app.use(vite.middlewares);
  } else {
    app.use(import_express.default.static(distPath, { index: false }));
  }
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /admin\nSitemap: https://greeniahomes.vn/sitemap.xml");
  });
  app.get("/sitemap.xml", async (req, res) => {
    try {
      let urls = [];
      const baseUrl = "https://greeniahomes.vn";
      urls.push(`  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
  </url>`);
      urls.push(`  <url>
    <loc>${baseUrl}/tin-tuc</loc>
    <priority>0.8</priority>
  </url>`);
      if (import_firebase_admin.default.apps && import_firebase_admin.default.apps.length > 0) {
        const db = import_firebase_admin.default.firestore();
        const newsSnap = await db.collection("news").get();
        newsSnap.forEach((doc) => {
          urls.push(`  <url>
    <loc>${baseUrl}/news/${doc.id}</loc>
    <priority>0.7</priority>
  </url>`);
        });
        const projSnap = await db.collection("projects").get();
        projSnap.forEach((doc) => {
          urls.push(`  <url>
    <loc>${baseUrl}/project/${doc.id}</loc>
    <priority>0.8</priority>
  </url>`);
        });
        const prodSnap = await db.collection("products").get();
        prodSnap.forEach((doc) => {
          urls.push(`  <url>
    <loc>${baseUrl}/product/${doc.id}</loc>
    <priority>0.8</priority>
  </url>`);
        });
      }
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
      res.type("application/xml");
      res.send(sitemap);
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  });
  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/") || req.path.includes(".") && !req.path.includes("index.html")) {
      return next();
    }
    try {
      let indexHtml = "";
      if (!isProd) {
        indexHtml = import_fs.default.readFileSync(import_path.default.join(process.cwd(), "index.html"), "utf8");
        indexHtml = await vite.transformIndexHtml(req.originalUrl, indexHtml);
      } else {
        const indexPath = import_path.default.join(distPath, "index.html");
        if (import_fs.default.existsSync(indexPath)) {
          indexHtml = import_fs.default.readFileSync(indexPath, "utf8");
        } else {
          return res.status(404).send("Not found");
        }
      }
      let title = "Greenia Homes - Ph\xE2n Ph\u1ED1i B\u0110S Cao C\u1EA5p";
      let desc = "Greenia Homes l\xE0 \u0111\u01A1n v\u1ECB chuy\xEAn Ph\xE2n ph\u1ED1i c\xE1c s\u1EA3n ph\u1EA9m B\u0110S cao c\u1EA5p t\u1EA1i Tp HCM v\xE0 c\xE1c khu v\u1EF1c kh\xE1c. Hotline: 0932 966 700.";
      let keywords = "b\u1EA5t \u0111\u1ED9ng s\u1EA3n, greenia homes, mua b\xE1n nh\xE0 \u0111\u1EA5t";
      let image = "https://raw.githubusercontent.com/thuanx2/GreenHome/main/public/uploads/thump2-1748805904033.jpg";
      let injectedDataScript = "";
      try {
        if (import_firebase_admin.default.apps && import_firebase_admin.default.apps.length > 0) {
          const db = import_firebase_admin.default.firestore();
          let match;
          if (req.path.startsWith("/project/")) {
            const pathPartClean = req.path.replace("/project/", "");
            const cleanParts = pathPartClean.split("-");
            let id = cleanParts[cleanParts.length - 1];
            if (cleanParts[0].length === 20 && /^[a-zA-Z0-9]+$/.test(cleanParts[0])) {
              id = cleanParts[0];
            }
            const docSnap = await db.collection("projects").doc(id).get();
            if (docSnap.exists) {
              const data = docSnap.data();
              title = data.seoTitle || data.title || title;
              desc = data.seoDesc || (data.description || desc).replace(/<[^>]+>/g, "").substring(0, 160);
              keywords = data.seoKey || keywords;
              image = data.imageUrl || data.thumbnailUrl || data.images && data.images[0] || image;
              injectedDataScript = `<script>window.__SERVER_DATA__ = ${JSON.stringify({ project: { id, ...data } })};</script>`;
            }
          } else if (req.path.startsWith("/product/")) {
            const pathPartClean = req.path.replace("/product/", "");
            const cleanParts = pathPartClean.split("-");
            let id = cleanParts[cleanParts.length - 1];
            if (cleanParts[0].length === 20 && /^[a-zA-Z0-9]+$/.test(cleanParts[0])) {
              id = cleanParts[0];
            }
            const docSnap = await db.collection("products").doc(id).get();
            if (docSnap.exists) {
              const data = docSnap.data();
              title = data.seoTitle || data.title || title;
              desc = data.seoDesc || (data.description || desc).replace(/<[^>]+>/g, "").substring(0, 160);
              keywords = data.seoKey || keywords;
              image = data.imageUrl || data.thumbnailUrl || data.images && data.images[0] || image;
              injectedDataScript = `<script>window.__SERVER_DATA__ = ${JSON.stringify({ product: { id, ...data } })};</script>`;
            }
          } else if (req.path.startsWith("/news/")) {
            const pathPartClean = req.path.replace("/news/", "");
            const cleanParts = pathPartClean.split("-");
            let id = cleanParts[cleanParts.length - 1];
            if (cleanParts[0].length === 20 && /^[a-zA-Z0-9]+$/.test(cleanParts[0])) {
              id = cleanParts[0];
            }
            const docSnap = await db.collection("news").doc(id).get();
            if (docSnap.exists) {
              const data = docSnap.data();
              title = data.seoTitle || data.title || title;
              desc = data.seoDesc || (data.content || desc).replace(/<[^>]+>/g, "").substring(0, 160);
              keywords = data.seoKey || keywords;
              image = data.imageUrl || data.thumbnailUrl || image;
              injectedDataScript = `<script>window.__SERVER_DATA__ = ${JSON.stringify({ news: { id, ...data } })};</script>`;
            }
          } else if (match = req.path.match(/^\/category-news\/(.+)/)) {
            const catName = decodeURIComponent(match[1]);
            const docSnap = await db.collection("news_categories").where("name", "==", catName).limit(1).get();
            if (!docSnap.empty) {
              const data = docSnap.docs[0].data();
              title = data.seoTitle || `Tin t\u1EE9c: ${catName} | Greenia Homes`;
              desc = data.seoDesc || desc;
              keywords = data.seoKey || keywords;
            } else {
              title = `Tin t\u1EE9c: ${catName} | Greenia Homes`;
            }
          } else if (match = req.path.match(/^\/category-product\/(.+)/)) {
            const catName = decodeURIComponent(match[1]);
            const docSnap = await db.collection("product_categories").where("name", "==", catName).limit(1).get();
            if (!docSnap.empty) {
              const data = docSnap.docs[0].data();
              title = data.seoTitle || `Danh m\u1EE5c B\u0110S: ${catName} | Greenia Homes`;
              desc = data.seoDesc || desc;
              keywords = data.seoKey || keywords;
            } else {
              title = `Danh m\u1EE5c B\u0110S: ${catName} | Greenia Homes`;
            }
          }
        }
      } catch (err) {
        console.error("OG Tag DB Fetch Error:", err);
      }
      const canonicalUrl = `https://greeniahomes.vn${req.path === "/" ? "" : req.path}`;
      const ogTags = `
        <title>${title.replace(/</g, "&lt;")}</title>
        <meta name="description" content="${desc.replace(/"/g, "&quot;")}" />
        <meta name="keywords" content="${keywords.replace(/"/g, "&quot;")}" />
        <meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />
        <meta property="og:description" content="${desc.replace(/"/g, "&quot;")}" />
        <meta property="og:image" content="${image}" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="${canonicalUrl}" />
      `;
      indexHtml = indexHtml.replace(/<title>.*?<\/title>/ig, "");
      indexHtml = indexHtml.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/ig, "");
      indexHtml = indexHtml.replace(/<meta\s+name=["']keywords["']\s+content=["'].*?["']\s*\/?>/ig, "");
      indexHtml = indexHtml.replace("</head>", ogTags + "\n" + injectedDataScript + "\n</head>");
      res.status(200).set({ "Content-Type": "text/html" }).send(indexHtml);
    } catch (e) {
      next(e);
    }
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Greenia Fullstack Server] active on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
