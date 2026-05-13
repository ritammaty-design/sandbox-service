import { k8sCoreV1Api } from "./config.js";


export async function createService(sandboxId) {
    const serviceManifest = {
        metadata: {
            name: `sandbox-service-${sandboxId}`,
            labels: {
                app: "sandbox",
                sandboxId: sandboxId
            }
        },
        spec: {
            selector: {
                app: "sandbox",
                sandboxId: sandboxId
            },
            ports: [
                {
                    port: 80,
                    targetPort: 5173,
                    protocol: "TCP",
                    name: "http"
                }
            ],
            // will cahnge in github codespace 
            type: "ClusterIP"


        }
    }
    // create the service
    const response = await k8sCoreV1Api.createNamespacedService({
        namespace: "default",
        body: serviceManifest
    });
    // return the response
    return response;
}