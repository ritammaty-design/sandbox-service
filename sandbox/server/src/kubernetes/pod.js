import { k8sCoreV1Api } from "./config.js";

const namespace = "default";

function sandboxLabels(sandboxId) {
    return {
        app: "sandbox-instance",
        sandboxId
    };
}

export async function createPod(sandboxId) {
    const podName = `sandbox-pod-${sandboxId}`;

    const podManifest = createSandboxPodManifest(sandboxId, podName);

    await k8sCoreV1Api.createNamespacedPod({
        namespace,
        body: podManifest
    });

    return podName;
}

export function createSandboxPodManifest(sandboxId, podName = `sandbox-pod-${sandboxId}`) {
    return {
        metadata: {
            name: podName,
            labels: sandboxLabels(sandboxId)
        },
        spec: {
            volumes: [
                {
                    name: "workspace-volume",
                    emptyDir: {}
                }
            ],
            initContainers: [
                {
                    name: "copy-template",
                    image: "template:latest",
                    imagePullPolicy: "Never",
                    command: [
                        "sh",
                        "-c",
                        "mkdir -p /workspace/src && \
cp -r /app/src/. /workspace/src/ && \
mkdir -p /workspace/public && \
cp -r /app/public/. /workspace/public/ 2>/dev/null || true"
                    ],
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                }
            ],
            containers: [
                {
                    name: "sandbox-preview",
                    image: "template:latest",
                    imagePullPolicy: "Never",
                    workingDir: "/app",
                    command: ["npm"],
                    args: ["run", "dev", "--", "--host", "0.0.0.0"],
                    env: [
                        {
                            name: "VITE_BASE",
                            value: `/preview/${sandboxId}/`
                        },
                        {
                            name: "CHOKIDAR_USEPOLLING",
                            value: "true"
                        },
                        {
                            name: "CHOKIDAR_INTERVAL",
                            value: "100"
                        }
                    ],
                    ports: [
                        {
                            containerPort: 5173,
                            name: "preview-http"
                        }
                    ],
                    resources: {
                        limits: {
                            memory: "256Mi",
                            cpu: "250m"
                        },
                        requests: {
                            memory: "128Mi",
                            cpu: "100m"
                        }
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/app/src",
                            subPath: "src"
                        },
                        {
                            name: "workspace-volume",
                            mountPath: "/app/public",
                            subPath: "public"
                        }
                    ]
                },
                {
                    name: "agent",
                    image: "agent:latest",
                    imagePullPolicy: "Never",
                    workingDir: "/workspace",
                    command: ["node"],
                    args: ["/app/server.js"],
                    env: [
                        {
                            name: "WORKSPACE_DIR",
                            value: "/workspace"
                        }
                    ],
                    ports: [
                        {
                            containerPort: 3000,
                            name: "agent-http"
                        }
                    ],
                    resources: {
                        limits: {
                            memory: "256Mi",
                            cpu: "250m"
                        },
                        requests: {
                            memory: "128Mi",
                            cpu: "100m"
                        }
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                }
            ]
        }
    };
}

export async function waitForPodReady(podName, timeoutMs = 120000) {
    const startedAt = Date.now();

    while (true) {
        const pod = await k8sCoreV1Api.readNamespacedPodStatus({
            name: podName,
            namespace
        });

        if (pod.status?.phase === "Failed") {
            throw new Error(`Sandbox pod ${podName} failed to start`);
        }

        const failedInitContainer = pod.status?.initContainerStatuses?.find(status => (
            status.state?.terminated && status.state.terminated.exitCode !== 0
        ));

        if (failedInitContainer) {
            throw new Error(`Init container ${failedInitContainer.name} failed for ${podName}`);
        }

        const readyCondition = pod.status?.conditions?.find(
            condition => condition.type === "Ready"
        );

        if (readyCondition?.status === "True") {
            break;
        }

        if (Date.now() - startedAt > timeoutMs) {
            throw new Error(`Timed out waiting for sandbox pod ${podName} to become ready`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
