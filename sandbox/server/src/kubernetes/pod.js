import { k8sCoreV1Api } from "./config.js";


export async function createPod(sandboxId) {

    //! pod manifest is the configuration of the pod to be created
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
                    // its for github codesapce in local will be changed
                    imagesPullPolicy: "Never",
                    image: "template:latest",
                    ports: [
                        // tcp for the github codesapce
                        { containerPort: 5173, name: ["http", "tcp", "https"] }
                    ],
                    resoures: {
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

    //! now create the pod 

    const res = await k8sCoreV1Api.createNamespacedPod({
        namespace: "default",
        body: podManifest
    });

    // now return the response
    return res;
}


