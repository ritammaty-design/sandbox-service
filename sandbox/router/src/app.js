import express from "express";
import { createProxyMiddleware } from 'http-proxy-middleware'
const app = express();
/**
 * @type middleware that will extract the sandboxId from the URL
 */

app.use((req, res, next) => {
    const host = req.headers.host
    const sandboxId = host.split('.')[0]
    const target = `http://sandbox-service-${sandboxId}`

    return createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: true
    })(req, res, next)

})
export default app