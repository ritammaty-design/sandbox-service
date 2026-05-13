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
        namespace: "default",
        body: podManifest
    });

    return response;
}