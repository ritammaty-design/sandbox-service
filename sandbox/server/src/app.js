import express from 'express'
import morgan from 'morgan'
import { createPod, waitForPodReady } from './kubernetes/pod.js'
import { createService } from './kubernetes/service.js'
import { v7 as uuid } from 'uuid'

const app = express()

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/sandbox/health', (req, res) => {
    res.status(200).json({
        message: 'Sandbox API is healthy',
        status: 'ok'
    });
});

app.post('/api/sandbox/start', async (req, res) => {
  const sandboxId = uuid()

  await createPod(sandboxId)
  await createService(sandboxId)
  await waitForPodReady(sandboxId)

  const previewBaseUrl = process.env.PREVIEW_BASE_URL || 'http://localhost:3000'

  return res.status(200).json({
    message: 'Sandbox started',
    sandboxId,
    previewUrl: `${previewBaseUrl}/preview/${sandboxId}`
  })
})
export default app;

