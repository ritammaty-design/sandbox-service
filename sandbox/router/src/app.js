import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware'
const app = express();

app.get('/api/status/healthz', (req, res) => {
    res.status(200).json({ status: 'ok' });
})

app.get('/api/status/readyz', (req, res) => {
    res.status(200).json({ status: 'ready' });
})


/**
 * @type middleware that will extract the sandboxId from the URL
 */

app.use('/preview/:sandboxId', (req, res, next) => {

    const sandboxId = req.params.sandboxId;

    const target = `http://sandbox-service-${sandboxId}`;

    return createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: true,
        pathRewrite: {
            [`^/preview/${sandboxId}`]: ''
        }
    })(req, res, next);

});
export default app