import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";

const app = express();

app.use(morgan("dev"));

app.get("/api/status/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/status/readyz", (req, res) => {
  res.status(200).json({ status: "ready" });
});

app.use("/preview/:sandboxId", (req, res, next) => {

  const sandboxId = req.params.sandboxId;

  const target = `http://sandbox-service-${sandboxId}:80`;

  return createProxyMiddleware({
    target,

    changeOrigin: true,

    ws: true,

    pathRewrite: {
      [`^/preview/${sandboxId}`]: ""
    },

    logLevel: "debug",

    onError(err, req, res) {
      console.error("Proxy Error:", err.message);
    }

  })(req, res, next);
});

export default app;