# AEGIS // VULTR

**Enterprise Future-of-Work Operations Hub & Containment-First Autonomous Sandbox Platform on Vultr**

> *"An agent that only chats is a demo; an agent that executes safely across real business operations is a product."*

AEGIS // VULTR unifies **Enterprise Future-of-Work Operations** with **Cryptographically Verified Isolated Sandbox Execution** on standard CPU-only **Vultr Cloud Compute VMs** and **Vultr Serverless Inference** (`https://api.vultrinference.com/v1`):

### Enterprise Future-of-Work Modules
1. **Sales Operations & CRM (`Sales Ops & CRM`)** — Visits live prospect domains inside an SSRF-guarded Headless Chromium sandbox, extracts real product/enterprise signals from the DOM, runs a deterministic Python ICP scoring model (`0-100`), updates CRM pipeline stages, and queues personalized executive outreach for approval.
2. **Finance & Accounting (`Finance & AP`)** — Stages Accounts Payable invoices, Purchase Orders, and Master Vendor bank records inside an isolated Python workspace to run 3-way matching, flag duplicate invoices, catch PO overbilling, detect vendor IBAN tampering (`BANK_IBAN_MISMATCH`), render CFO SVG/HTML audit packs, and route payment holds.
3. **Customer Support (`Customer Support`)** — Isolates untrusted customer webhook payloads, billing pro-ration logs, and SAML assertions inside a sandbox to reproduce root causes in Python—auto-resolving deterministic tier-2 tickets and escalating financial credits or security changes to human review.
4. **Human-in-the-Loop Escalation Inbox (`Approvals`)** — Outbound outreach, vendor payment holds/disputes, and SLA credit sign-offs wait for explicit human approval, backed by clickable **Ed25519 hash-chained sandbox execution receipts**.
5. **Sandbox Studio & Containment Lab (`Sandbox Studio`)** — Full 3-pane mission control console with live SSE event streaming, real-time Chromium viewport screenshots, `/workspace` SVG/HTML/CSV artifact explorer, Ed25519 signature verifier, and a **4-Vector Live Red-Team Containment Self-Test**.

---

## Defense-in-Depth Containment Architecture

| Layer | Security Control | Enforcement Mechanism |
|---|---|---|
| **Credential Airgap** | Zero API keys inside sandboxes | `VULTR_INFERENCE_API_KEY`, `VULTR_API_KEY`, and RPC secrets stay in Control Plane memory |
| **Pre-Dispatch Policy Gate** | Path, fork-bomb, scheme & domain allowlist checks | `PolicyEngine` evaluates every tool call (`ALLOW` / `BLOCK`) before HMAC-SHA256 RPC dispatch |
| **Cloud Metadata SSRF Shield** | Blocks `169.254.169.254`, `metadata.vultr.com`, & RFC1918 LAN | Enforced in Policy Gate, Playwright `context.route`, CPython `sys.addaudithook`, and Vultr `iptables DOCKER-USER` |
| **Container / Kernel Isolation** | Ephemeral unprivileged execution on Vultr Linux VMs | `--cap-drop=ALL --security-opt=no-new-privileges --read-only --pids-limit=128 --memory=512m` + optional `--runtime=runsc` (gVisor) |
| **Verifiable Output** | Tamper-evident execution proof | Ed25519 signature over canonical receipt JSON + SHA-256 hash chain |

---

## Local Quickstart

```bash
# 1. Install workspace dependencies
npm install

# 2. (Optional) Configure Vultr Serverless Inference / Cloud Compute API keys
cp .env.example .env

# 3. Launch Sandbox Worker (4100) + Control Plane (4000) + Web Application (5173)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Vultr VM Backend & Public HTTPS Demo Deployment (CPU-Only — No GPU Required)

1. Provision an Ubuntu 24.04 Cloud Compute instance on Vultr (e.g., `vc2-2c-4gb`):
   ```bash
   VULTR_API_KEY=your_key npm run provision:vultr -- create --region=ewr --plan=vc2-2c-4gb
   ```
   *(Or create one in the Vultr Customer Portal / from the in-app **Vultr Cloud** drawer.)*

2. SSH into your Vultr VM, clone your repository, and run the one-command deployment script (sets up Docker, `169.254.169.254` SSRF firewall, Control Plane + Sandbox Worker, and automatic `https://<VULTR_IP>.nip.io` TLS via Caddy):
   ```bash
   sudo bash deploy/vultr/deploy-vultr-vm.sh
   ```
