import { k8sCoreV1Api } from "./config.js";

export async function createService(sandboxId) {

    const serviceManifest = {
        metadata: {
            name: `sandbox-service-${sandboxId}`,

            labels: {
                app: "sandbox-instance",
                sandboxId: sandboxId
            }
        },

        spec: {
            selector: {
                app: "sandbox-instance",
                sandboxId: sandboxId
            },

            ports: [
                {
                    port: 80,
                    targetPort: 80,
                    protocol: "TCP",
                    name: "http"
                }
            ],

            type: "ClusterIP"
        }
    };

    const response = await k8sCoreV1Api.createNamespacedService({
        namespace: "default",
        body: serviceManifest
    });

    return response;
}