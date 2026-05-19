import { k8sCoreV1Api } from "./config.js";

const namespace = "default";

function sandboxLabels(sandboxId) {
    return {
        app: "sandbox-instance",
        sandboxId
    };
}

function createServiceManifest({ name, sandboxId, ports }) {
    return {
        metadata: {
            name,
            labels: sandboxLabels(sandboxId)
        },
        spec: {
            selector: sandboxLabels(sandboxId),
            ports,
            type: "ClusterIP"
        }
    };
}

export async function createPreviewService(sandboxId) {
    const serviceManifest = createServiceManifest({
        name: `sandbox-service-${sandboxId}`,
        sandboxId,
        ports: [
            {
                port: 80,
                targetPort: 5173,
                protocol: "TCP",
                name: "preview-http"
            }
        ]
    });

    return k8sCoreV1Api.createNamespacedService({
        namespace,
        body: serviceManifest
    });
}

export async function createAgentService(sandboxId) {
    const serviceManifest = createServiceManifest({
        name: `agent-service-${sandboxId}`,
        sandboxId,
        ports: [
            {
                port: 3000,
                targetPort: 3000,
                protocol: "TCP",
                name: "agent-http"
            }
        ]
    });

    return k8sCoreV1Api.createNamespacedService({
        namespace,
        body: serviceManifest
    });
}

export async function createSandboxServices(sandboxId) {
    const [previewService, agentService] = await Promise.all([
        createPreviewService(sandboxId),
        createAgentService(sandboxId)
    ]);

    return {
        previewService,
        agentService
    };
}
