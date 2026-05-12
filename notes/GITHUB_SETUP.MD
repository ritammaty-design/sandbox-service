# Kubernetes + Docker + KIND Setup Guide

This guide explains how to setup:

- Docker
- KIND Cluster
- Kubernetes
- NGINX Ingress
- Backend Deployment
- Service
- Ingress
- Port Forwarding
- GitHub Codespaces Access

---

# Architecture

Request flow:

Browser
↓
GitHub Codespace Port
↓
kubectl port-forward
↓
Kubernetes Service
↓
Pod
↓
Express Server

---

# Project Structure

```text
sandbox-service/
│
├── sandbox/
│   ├── src/
│   │   └── app.js
│   │
│   ├── k8s/
│   │   ├── deployment.yml
│   │   ├── service.yml
│   │   └── ingress.yml
│   │
│   ├── dockerfile
│   ├── package.json
│   └── server.js
```

---

# 1. Install KIND

## Download KIND

```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
```

## Give Permission

```bash
chmod +x ./kind
```

## Move to System Path

```bash
sudo mv ./kind /usr/local/bin/kind
```

## Verify

```bash
kind version
```

---

# 2. Create Kubernetes Cluster

```bash
kind create cluster
```

Verify:

```bash
kubectl get nodes
```

Expected:

```text
STATUS = Ready
```

---

# 3. Install NGINX Ingress

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

Check:

```bash
kubectl get pods -n ingress-nginx
```

Wait until all pods become:

```text
Running
```

---

# 4. Backend Code

## src/app.js

```js
import express from "express";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/sandbox/health', (req, res) => {
    res.status(200).json({
        message: 'Sandbox API is healthy',
        status: 'ok'
    });
});

export default app;
```

---

# 5. server.js

```js
import app from "./src/app.js";

app.listen(3000, () => {
    console.log("Sandbox API server is running on port 3000");
});
```

---

# 6. package.json

```json
{
  "name": "sandbox",
  "version": "1.0.0",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^5.2.1",
    "morgan": "^1.10.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.14"
  }
}
```

---

# 7. Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm","run","dev"]
```

---

# 8. Kubernetes Deployment

## deployment.yml

```yaml
apiVersion: apps/v1
kind: Deployment

metadata:
  name: sandbox-deployment

spec:
  replicas: 1

  selector:
    matchLabels:
      app: sandbox

  template:
    metadata:
      labels:
        app: sandbox

    spec:
      containers:
      - name: main-sandbox-container
        image: sandbox:latest
        imagePullPolicy: Never

        ports:
        - containerPort: 3000

        livenessProbe:
          httpGet:
            path: /api/sandbox/health
            port: 3000
          initialDelaySeconds: 90
          timeoutSeconds: 10

        readinessProbe:
          httpGet:
            path: /api/sandbox/health
            port: 3000
          initialDelaySeconds: 30
          timeoutSeconds: 10
```

---

# 9. Kubernetes Service

## service.yml

```yaml
apiVersion: v1
kind: Service

metadata:
  name: sandbox-service

spec:
  selector:
    app: sandbox

  type: ClusterIP

  ports:
  - port: 80
    targetPort: 3000
```

---

# 10. Kubernetes Ingress

## ingress.yml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress

metadata:
  name: codespace-ingress

spec:
  ingressClassName: nginx

  rules:
  - http:
      paths:
      - path: /api/sandbox
        pathType: Prefix

        backend:
          service:
            name: sandbox-service
            port:
              number: 80
```

---

# 11. Build Docker Image

Inside sandbox folder:

```bash
docker build -t sandbox:latest -f dockerfile .
```

Check images:

```bash
docker images
```

---

# 12. Load Image into KIND

Very important:

```bash
kind load docker-image sandbox:latest
```

Without this step Kubernetes cannot use local image.

---

# 13. Apply Kubernetes Files

```bash
kubectl apply -f k8s/
```

---

# 14. Check Pods

```bash
kubectl get pods
```

Watch live:

```bash
kubectl get pods -w
```

Expected:

```text
1/1 Running
```

---

# 15. Check Logs

```bash
kubectl logs deployment/sandbox-deployment
```

Expected:

```text
Sandbox API server is running on port 3000
```

---

# 16. Port Forward

Very important for GitHub Codespaces.

```bash
kubectl port-forward service/sandbox-service 3000:80
```

Keep terminal open.

---

# 17. Open Browser

Open:

```text
https://YOUR_CODESPACE_NAME-3000.app.github.dev/api/sandbox/health
```

Expected:

```json
{
  "message": "Sandbox API is healthy",
  "status": "ok"
}
```

---

# Important Commands

## Check Nodes

```bash
kubectl get nodes
```

## Check Pods

```bash
kubectl get pods
```

## Check Services

```bash
kubectl get svc
```

## Check Ingress

```bash
kubectl get ingress
```

## Check Logs

```bash
kubectl logs deployment/sandbox-deployment
```

## Restart Deployment

```bash
kubectl rollout restart deployment sandbox-deployment
```

---

# If Code Changes

Do these steps again:

## Rebuild Docker Image

```bash
docker build -t sandbox:latest -f dockerfile .
```

## Reload into KIND

```bash
kind load docker-image sandbox:latest
```

## Restart Deployment

```bash
kubectl rollout restart deployment sandbox-deployment
```

---

# Common Errors

## ErrImagePull

Reason:

Kubernetes cannot find image.

Fix:

```bash
kind load docker-image sandbox:latest
```

---

## CrashLoopBackOff

Reason:

Container crashes continuously.

Debug:

```bash
kubectl logs POD_NAME
```

---

## Connection Refused

Reason:

Cluster deleted or stopped.

Fix:

```bash
kind create cluster
```

---

# Before Laptop Shutdown

Delete cluster to save RAM and CPU.

```bash
kind delete cluster
```

Next day create cluster again:

```bash
kind create cluster
```

---

# Final Understanding

Docker creates container images.

Kubernetes manages containers.

Deployment creates pods.

Service gives networking.

Ingress handles routing.

Port-forward exposes app in GitHub Codespaces.