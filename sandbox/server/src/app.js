import express from 'express';
import morgan from 'morgan';

import { createPod, waitForPodReady } from './kubernetes/pod.js';
import { createSandboxServices } from './kubernetes/service.js';

import { v7 as uuid } from 'uuid';

const app = express();

app.use(morgan('dev'));

app.get('/api/sandbox/health', (req, res) => {
    res.json({
        status: 'ok'
    });
});

app.post('/api/sandbox/start', async (req, res) => {

    try {

        const sandboxId = uuid();

        const podName = await createPod(sandboxId);

        await createSandboxServices(sandboxId);

        await waitForPodReady(podName);

        return res.status(200).json({
            message: 'Sandbox started',
            sandboxId,
            podName,
            previewService: `sandbox-service-${sandboxId}`,
            agentService: `agent-service-${sandboxId}`,
            previewUrl: `/preview/${sandboxId}/`
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: error.message
        });
    }
});

export default app;
