import express from "express";
import morgan from "morgan";
import fs from "node:fs/promises";
import path from "node:path";

const app = express();
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || "/workspace";
const WORKSPACE_ROOT = path.resolve(WORKSPACE_DIR);

app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

function resolveWorkspacePath(requestedPath = ".") {
    const rawPath = String(requestedPath || ".").replaceAll("\\", "/");
    const targetPath = path.isAbsolute(rawPath)
        ? path.normalize(rawPath)
        : path.resolve(WORKSPACE_ROOT, rawPath);
    const relativePath = path.relative(WORKSPACE_ROOT, targetPath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        const error = new Error("Path must stay inside /workspace");
        error.statusCode = 400;
        throw error;
    }

    return targetPath;
}

function toWorkspacePath(absolutePath) {
    const relativePath = path.relative(WORKSPACE_ROOT, absolutePath);

    if (!relativePath) {
        return ".";
    }

    return relativePath.split(path.sep).join("/");
}

function markMissingPath(error, message) {
    if (error?.code === "ENOENT") {
        error.statusCode = 404;
        error.message = message;
    }

    return error;
}

async function describeEntry(parentPath, entry) {
    const absolutePath = path.join(parentPath, entry.name);
    let stats;

    try {
        stats = await fs.stat(absolutePath);
    } catch (error) {
        if (error?.code === "ENOENT") {
            return null;
        }

        throw error;
    }

    return {
        name: entry.name,
        path: toWorkspacePath(absolutePath),
        type: entry.isDirectory() ? "directory" : "file",
        size: stats.size,
        updatedAt: stats.mtime.toISOString()
    };
}

function handleError(error, res) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
        error: error.message
    });
}

async function listFiles(requestedPath) {
    const directoryPath = resolveWorkspacePath(requestedPath);

    let entries;

    try {
        entries = await fs.readdir(directoryPath, { withFileTypes: true });
    } catch (error) {
        throw markMissingPath(error, "Directory not found");
    }

    const files = await Promise.all(entries.map(entry => describeEntry(directoryPath, entry)));

    return {
        path: toWorkspacePath(directoryPath),
        files: files.filter(Boolean)
    };
}

app.get("/", (req, res) => {
    return res.status(200).json({
        status: "ok",
        workspace: WORKSPACE_DIR
    });
});

app.get("/files", async (req, res) => {
    try {
        return res.status(200).json(await listFiles(req.query.path));
    } catch (error) {
        return handleError(error, res);
    }
});

app.get("/read", async (req, res) => {
    try {
        if (!req.query.path) {
            return res.status(400).json({ error: "Missing path query parameter" });
        }

        const filePath = resolveWorkspacePath(req.query.path);
        let content;

        try {
            content = await fs.readFile(filePath, "utf8");
        } catch (error) {
            throw markMissingPath(error, "File not found");
        }

        return res.status(200).json({
            path: toWorkspacePath(filePath),
            content
        });
    } catch (error) {
        return handleError(error, res);
    }
});

app.post("/write", async (req, res) => {
    try {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const { path: requestedPath, content = "" } = body;

        if (!requestedPath) {
            return res.status(400).json({ error: "Missing path in request body" });
        }

        const filePath = resolveWorkspacePath(requestedPath);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, String(content), "utf8");

        return res.status(200).json({
            message: "File written",
            path: toWorkspacePath(filePath)
        });
    } catch (error) {
        return handleError(error, res);
    }
});

app.post("/create", async (req, res) => {
    try {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const {
            path: requestedPath,
            type = "file",
            content = "",
            overwrite = false
        } = body;

        if (!requestedPath) {
            return res.status(400).json({ error: "Missing path in request body" });
        }

        if (!["file", "directory"].includes(type)) {
            return res.status(400).json({ error: "Type must be file or directory" });
        }

        const targetPath = resolveWorkspacePath(requestedPath);

        if (type === "directory") {
            await fs.mkdir(targetPath, { recursive: true });
        } else {
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
            await fs.writeFile(targetPath, String(content), {
                encoding: "utf8",
                flag: overwrite ? "w" : "wx"
            });
        }

        return res.status(201).json({
            message: `${type === "directory" ? "Directory" : "File"} created`,
            path: toWorkspacePath(targetPath)
        });
    } catch (error) {
        if (error.code === "EEXIST") {
            error.statusCode = 409;
            error.message = "Path already exists";
        }

        return handleError(error, res);
    }
});

app.get("/read-files", async (req, res) => {
    try {
        return res.status(200).json(await listFiles(req.query.path));
    } catch (error) {
        return handleError(error, res);
    }
});

export default app;
