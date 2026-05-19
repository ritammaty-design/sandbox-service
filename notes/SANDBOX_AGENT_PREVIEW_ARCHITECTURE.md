# FILE NAME

```txt
SANDBOX_AGENT_PREVIEW_ARCHITECTURE.md
```

# SANDBOX AGENT + PREVIEW ARCHITECTURE EXPLANATION

---

# WHY WE NEED POD + SERVICE

In Kubernetes:

```txt
Pod = actual running container
Service = stable networking layer
```

A pod IP changes frequently.

So if router directly connects to pod IP:

```txt
router -> pod-ip
```

then after pod restart everything breaks.

That is why Kubernetes Service exists.

Service gives:

```txt
stable DNS
stable networking
load balancing
service discovery
```

---

# WHAT HAPPENS WHEN /START IS CALLED

When frontend/backend calls:

```http
POST /api/sandbox/start
```

the server creates:

---

## 1. SANDBOX POD

Inside ONE pod:

```txt
sandbox-preview container
agent container
```

Both containers share:

```txt
/workspace
```

through:

```txt
emptyDir volume
```

---

# WHY TWO CONTAINERS INSIDE SAME POD

Because:

```txt
preview container
```

runs:

```txt
Vite React App
```

and:

```txt
agent container
```

runs:

```txt
Express API server
```

Both need same filesystem.

That is why:

```txt
shared volume
```

is used.

---

# POD ARCHITECTURE

```txt
+--------------------------------------------------+
|                  SANDBOX POD                     |
|                                                  |
|   +------------------+    +------------------+   |
|   | sandbox-preview  |    |      agent       |   |
|   |  vite dev server |    | express api      |   |
|   |     port 5173    |    |    port 3000     |   |
|   +------------------+    +------------------+   |
|               \              /                   |
|                \            /                    |
|                 \          /                     |
|               shared /workspace                 |
|                 emptyDir volume                 |
+--------------------------------------------------+
```

---

# WHY TWO SERVICES ARE CREATED

After pod creation:

two Kubernetes services are also created.

---

## PREVIEW SERVICE

```txt
sandbox-service-<sandboxId>
```

connects to:

```txt
port 5173
```

Used for:

```txt
React Preview UI
```

---

## AGENT SERVICE

```txt
agent-service-<sandboxId>
```

connects to:

```txt
port 3000
```

Used for:

```txt
/read
/write
/files
/create
```

API routes.

---

# SERVICE ARCHITECTURE

```txt
Browser
   ↓
Router Service
   ↓
sandbox-service-<id>
   ↓
sandbox-preview container
```

AND:

```txt
Browser/API
   ↓
agent-service-<id>
   ↓
agent container
```

---

# WHY PREVIEW WORKS BUT AGENT DOES NOT

Preview works because router proxies it.

Example:

```js
app.use('/preview/:sandboxId')
```

Router internally forwards request to:

```txt
sandbox-service-<id>
```

So browser can access preview publicly.

---

# WHY AGENT DOES NOT WORK DIRECTLY

Because:

agent service is INTERNAL ONLY.

Kubernetes DNS:

```txt
agent-service-xxxx
```

exists only INSIDE cluster.

NOT outside GitHub Codespaces.

So browser cannot directly call:

```txt
http://agent-service-xxxx
```

---

# WHY PORT-FORWARD WORKS

When running:

```bash
kubectl port-forward svc/agent-service-<id> 4000:3000
```

Kubernetes creates tunnel:

```txt
localhost:4000
        ↓
agent-service
        ↓
agent container
```

Now browser/curl can access it.

---

# WHY /FILES WORKS SOMETIMES BUT /READ FAILS

Because:

```txt
/files
```

lists directory only.

But:

```txt
/read
```

needs exact path.

If path wrong:

```txt
ENOENT
```

error happens.

---

# IMPORTANT PATH RULE

Correct:

```json
{
  "path":"src/App.jsx"
}
```

Wrong:

```json
{
  "path":"/workspace/src/App.jsx"
}
```

Because backend already adds:

```txt
/workspace
```

internally.

Otherwise path becomes:

```txt
/workspace/workspace/src/App.jsx
```

---

# WHY SHARED VOLUME IS IMPORTANT

Both containers must see same files.

That is why:

```txt
emptyDir volume
```

is mounted into both containers.

---

# FILE FLOW

```txt
Agent API
   ↓
/workspace/src/App.jsx
   ↓
Preview container mounted file
   ↓
Vite reloads UI
```

---

# WHY ONLY SOME FILES UPDATE IN PREVIEW

Preview container only mounts:

```txt
/app/src
/app/public
/app/index.html
/app/vite.config.js
```

If agent writes elsewhere:

```txt
/workspace/random
```

preview will never see it.

---

# WHY AGENT IS MICROSERVICE

Agent is separate because:

```txt
code editing
filesystem access
terminal logic
AI operations
```

should be isolated from preview UI.

This is proper microservice architecture.

---

# CURRENT ARCHITECTURE

```txt
+-------------------+
| Browser           |
+-------------------+
          |
          v
+-------------------+
| Router Service    |
+-------------------+
      |         |
      |         |
      v         v
+-----------+   +-----------+
| Preview   |   | Agent     |
| Service   |   | Service   |
+-----------+   +-----------+
      |               |
      v               v
+----------------------------------+
|         Sandbox Pod              |
|                                  |
|  sandbox-preview  +   agent      |
|                                  |
|       shared /workspace          |
+----------------------------------+
```

---

# WHY THIS DESIGN IS GOOD

Benefits:

```txt
isolated sandbox
scalable
safe
ephemeral
easy cleanup
microservice architecture
shared filesystem
independent services
```

---

# PRODUCTION IMPROVEMENT

Best next step:

Add router proxy for agent.

Example:

```js
app.use('/agent/:sandboxId')
```

Then browser can directly call:

```txt
/agent/<id>/files
/agent/<id>/read
```

without manual port-forward.

---

# FINAL UNDERSTANDING

Preview service:

```txt
PUBLIC
```

Agent service:

```txt
PRIVATE INTERNAL SERVICE
```

That is why:

```txt
preview works automatically
agent requires port-forward or proxy
```

This behavior is expected in Kubernetes microservice architecture.
