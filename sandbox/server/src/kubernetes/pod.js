import { k8sCoreV1Api } from "./config.js";

export async function createPod(sandboxId) {

    const podName = `sandbox-pod-${sandboxId}`;

    const podManifest = {
        metadata: {
            name: podName,
            labels: {
                app: "sandbox",
                sandboxId
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
                    ]
                }
            ]
        }
    };

    await k8sCoreV1Api.createNamespacedPod({
        namespace: "default",
        body: podManifest
    });

    return podName;
}

export async function waitForPodReady(podName) {

    while (true) {

        const response = await k8sCoreV1Api.readNamespacedPodStatus({
            name: podName,
            namespace: "default"
        });

        const pod = response;

        const conditions = pod.status?.conditions || [];

        const readyCondition = conditions.find(
            condition => condition.type === "Ready"
        );

        if (readyCondition?.status === "True") {
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}