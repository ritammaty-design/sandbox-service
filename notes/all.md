# GitHub Codespaces + Docker + Kind + Kubernetes Setup Guide

## 1. Open Codespace

Open your GitHub Codespace.

---

# 2. Install Docker

Check Docker:

```bash id="m1q8zt"
docker --version
```

If not installed:

```bash id="v7p3rk"
sudo apt update
sudo apt install docker.io -y
```

Start Docker:

```bash id="x2n5lf"
sudo service docker start
```

Check:

```bash id="r4m7qp"
docker ps
```

---

# 3. Install kubectl

Check:

```bash id="k8v1tm"
kubectl version --client
```

If not installed:

```bash id="f5q2wn"
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

---

# 4. Install Kind

Check:

```bash id="z9p4xm"
kind version
```

If not installed:

```bash id="c7r1vk"
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

---

# 5. Create Kubernetes Cluster

```bash id="t3m8ql"
kind create cluster
```

Check:

```bash id="u6n2pf"
kubectl cluster-info
```

---

# 6. Install NGINX Ingress

```bash id="j1w5rz"
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

Wait:

```bash id="h8q3vn"
kubectl get pods -n ingress-nginx -w
```

Wait until:

```txt id="y2p7mk"
Running
```

---

# 7. Backend Docker Build

Go backend folder:

```bash id="l4x8qt"
cd sandbox/server
```

Build image:

```bash id="n6m1rv"
docker build -t sandbox:latest .
```

Load into kind:

```bash id="p3v7zk"
kind load docker-image sandbox:latest
```

---

# 8. Frontend Docker Build

Go template folder:

```bash id="f9r2xm"
cd ../template
```

Build:

```bash id="d5k8wp"
docker build -t template:latest .
```

Load:

```bash id="g7n4ql"
kind load docker-image template:latest
```

---

# 9. Apply Kubernetes Files

Go project root:

```bash id="w1m6tz"
cd /workspaces/codespaces-blank/sandbox-service
```

Apply RBAC:

```bash id="x8p3vn"
kubectl apply -f k8s/rbac.yml
```

Apply k8s:

```bash id="r2q7lf"
kubectl apply -f k8s/
```

---

# 10. Watch Pods

```bash id="k5v9xm"
kubectl get pods -w
```

Wait until:

```txt id="m4n8rp"
1/1 Running
```

---

# 11. Start Port Forward

```bash id="u7q2wk"
kubectl port-forward service/sandbox-service 3000:80 --address 0.0.0.0
```

KEEP THIS TERMINAL OPEN.

---

# 12. Test Backend

New terminal:

```bash id="s3m6vp"
curl http://localhost:3000/api/sandbox/health
```

Expected:

```json id="j9r4xt"
{"message":"Sandbox API is healthy","status":"ok"}
```

---

# 13. Start Sandbox Dynamically

```bash id="f1q8zn"
curl -X POST http://localhost:3000/api/sandbox/start
```

---

# 14. Check Dynamic Pods

```bash id="v6m2rk"
kubectl get pods
```

---

# BEFORE CLOSING CODESPACE

# 1. Stop Port Forward

Press:

```txt id="p7k3wl"
CTRL + C
```

---

# 2. Delete Dynamic Sandbox Pods

```bash id="z2v9qm"
kubectl delete pod -l app=sandbox
```

OR delete specific pods.

---

# 3. Delete Dynamic Services

```bash id="m8r1xp"
kubectl delete svc -l app=sandbox
```

---

# 4. Optional — Delete Cluster

If you want clean restart next day:

```bash id="n3q7vk"
kind delete cluster
```

---

# 5. Commit Important Code

```bash id="w5m2lf"
git add .
git commit -m "progress update"
git push
```

---

# NEXT DAY QUICK START

If cluster still exists:

```bash id="c8r4zn"
kubectl get nodes
```

Then directly:

```bash id="q1m7xp"
kubectl apply -f k8s/
kubectl port-forward service/sandbox-service 3000:80 --address 0.0.0.0
```

No need to reinstall everything.
