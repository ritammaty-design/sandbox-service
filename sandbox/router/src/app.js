import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const previewProxies = new Map();
const sandboxIdPattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

app.use(morgan("dev"));

app.get("/api/status/healthz", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/api/status/readyz", (req, res) => {
    res.status(200).json({ status: "ready" });
});

function isValidSandboxId(sandboxId) {
    return sandboxId.length <= 63 && sandboxIdPattern.test(sandboxId);
}

function getPreviewProxy(sandboxId) {
    if (!previewProxies.has(sandboxId)) {
        const target = `http://sandbox-service-${sandboxId}/preview/${sandboxId}`;

        previewProxies.set(sandboxId, createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
            pathRewrite: {
                [`^/preview/${sandboxId}`]: ""
            },
            on: {
                error(error, req, res) {
                    console.error("preview proxy error:", error.message);

                    if (res?.writeHead && !res.headersSent) {
                        res.writeHead(502, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            error: "preview proxy error",
                            message: error.message
                        }));
                    }
                }
            }
        }));
    }

    return previewProxies.get(sandboxId);
}

app.use("/preview/:sandboxId", (req, res, next) => {
    const { sandboxId } = req.params;

    if (!isValidSandboxId(sandboxId)) {
        return res.status(400).json({ error: "Invalid sandbox id" });
    }

    if (req.originalUrl === `/preview/${sandboxId}`) {
        return res.redirect(308, `/preview/${sandboxId}/`);
    }

    return getPreviewProxy(sandboxId)(req, res, next);
});

export default app;
