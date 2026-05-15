import { k8sCoreV1Api } from "./config.js";

export async function createPod(sandboxId) {

    const podManifest = {
        metadata: {
            name: `sandbox-pod-${sandboxId}`,
            labels: {
                app: "sandbox",
                sandboxId: sandboxId
            }
        },

        spec: {
            containers: [
                {
                    name: "sandbox",

                    image: "template:latest",

                    imagePullPolicy: "Never",

                    ports: [
                        {
                            containerPort: 5173,
                            name: "http"
                        }
                    ],

                    resources: {
                        limits: {
                            cpu: "100m",
                            memory: "128Mi"
                        },

                        requests: {
                            cpu: "100m",
                            memory: "128Mi"
                        }
                    }
                }
            ]
        }
    };

    const response = await k8sCoreV1Api.createNamespacedPod({
        namespace: 'default',
        body: podManifest
    });

    return response;
}

export async function waitForPodReady(sandboxId, timeoutMs = 120000) {
    const podName = `sandbox-pod-${sandboxId}`
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
        const { body } = await k8sCoreV1Api.readNamespacedPodStatus(podName, 'default')
        const conditions = body.status?.conditions || []
        const ready = conditions.some((condition) => condition.type === 'Ready' && condition.status === 'True')

        if (ready) {
            return body
        }

        await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    throw new Error(`Sandbox pod ${podName} did not become ready within ${timeoutMs}ms`)
}
