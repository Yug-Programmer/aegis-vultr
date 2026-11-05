# AEGIS // VULTR — Autonomous Future-of-Work Operations Hub

**Submission for Vultr Hackathon: Challenge 02 — Future of Work**

> *"An agent that only chats is a demo; an agent that executes safely across real business operations inside isolated sandboxes is a product."*

AEGIS // VULTR is a centralized, containment-first enterprise operations control plane running live on **Vultr Cloud Infrastructure** (`vc2-2c-4gb`, Delhi `del`, Ubuntu 24.04 LTS). It plans multi-step agentic workflows, dispatches them to isolated execution environments (Headless Chromium and Python sandboxes), and returns verifiable cryptographic Ed25519 execution receipts.

- **Live Public HTTPS Demo**: **[https://139.84.171.43.nip.io](https://139.84.171.43.nip.io)**
- **Direct HTTP Demo**: **[http://139.84.171.43](http://139.84.171.43)**
- **GitHub Repository**: **[https://github.com/Yug-Programmer/aegis-vultr](https://github.com/Yug-Programmer/aegis-vultr)**

---

## 🌟 The 5 Enterprise Future-of-Work Focus Areas (Full Interactive CRUD)

Unlike static demo dashboards, **every single module allows users to dynamically Create, Edit, Delete, and Execute workflows on their own custom data**. Users can also switch between a pre-seeded demo dataset and a 100% blank slate with 1-click dataset management.

| Department | Business Capabilities | Isolated Sandbox Execution | Output Artifacts |
|---|---|---|---|
| **1. Sales Operations** | Qualify leads, research prospects, update CRM, draft executive outreach | Headless Chromium navigates to user-specified domains, extracts DOM signals & security headers; Python model computes multi-factor ICP fit (0-100) | `lead_qualification_card.svg`, `crm_qualification.json`, `outreach_draft.md`, live screenshots |
| **2. Finance & Accounting** | 3-way match, reconcile transactions, flag overbilling, duplicate suppression, IBAN fraud detection | Python deterministic reconciliation engine checks billed amounts vs PO caps, detects duplicates, and catches vendor bank IBAN spoofing | `ap_reconciliation_audit.svg`, `reconciled_ledger.csv`, `cfo_exception_report.html`, payment hold sign-offs |
| **3. HR & Recruitment** | Screen candidates, score tech stack competency, analyze salary/seniority alignment, generate interview guides | Python NLP & keyword alignment model evaluates candidates against role benchmarks, computes match % and radar metrics | `candidate_evaluation_card.svg`, `candidate_evaluation.json`, `interview_guide.md`, interview invitations |
| **4. Customer Support** | Ingest tickets across systems, investigate issues in sandbox, auto-resolve tier-2 bugs, escalate financial/security risks | Python diagnostic engine reproduces byte-encoding mismatches (HMAC UTF-8 vs Latin-1), pro-rata SLA credits, SAML clock drifts, and API gateway timeouts | `incident_root_cause.svg`, `support_diagnosis.json`, `customer_response.md`, escalation approvals |
| **5. Procurement & Vendor Ops** | Monitor purchasing needs, compare multi-vendor RFP bids, optimize cost savings, track delivery SLAs | Python Multi-Criteria Decision Analysis (MCDA) model weights price (45%), delivery lead-time (25%), SLA % (20%), and reliability (10%) | `procurement_matrix.svg`, `procurement_decision.json`, `purchase_order_packet.md`, CFO PO approvals |

---

## 🛡️ Containment-First Architecture

AEGIS enforces strict security boundaries so autonomous agents can safely run arbitrary code and browse untrusted web pages without leaking host credentials or compromising infrastructure:

```
[ Web Browser Client ]
        │  HTTPS (TLS via Caddy)
        ▼
[ Centralized Control Plane (Port 4000) ]
  • Workflow Orchestration & Human Approval Gate
  • Vultr Serverless Inference Client (kimi-k2-instruct, qwen2.5-coder)
  • Persistent State Store (JSON / In-Memory)
  • Zero Cloud Credentials Passed Downward!
        │
        │  HMAC-SHA256 Signed RPC
        ▼
[ Isolated Sandbox Worker Daemon (Port 4100) ]
  • Unprivileged Docker Container (`--user 1000:1000`)
  • `--cap-drop=ALL --security-opt=no-new-privileges --read-only`
  • SSRF Firewall: Blocked `169.254.169.254`, `metadata.vultr.com`, RFC1918 LAN
  • Headless Chromium & Python 3.11 Runtime
  • Ed25519 Receipt Signer (`node:crypto` ed25519 keypair)
        │
        ▼
[ Cryptographic Execution Receipt Chain ]
  • Merkle-linked SHA-256 receipts with Ed25519 digital signatures
```

---

## 🚀 Live Vultr Infrastructure Deployment

- **Vultr Instance ID**: `1f449e68-c5e2-46c1-b74d-576febe0d51d`
- **Region**: Delhi, India (`del`)
- **Plan**: `vc2-2c-4gb` (2 vCPU, 4GB RAM, 80GB NVMe SSD, Ubuntu 24.04 LTS x64)
- **Public IP**: `139.84.171.43`
- **Automated TLS**: Caddy reverse proxy with Let's Encrypt certificates on `139.84.171.43.nip.io`

### Running Locally

```bash
# 1. Clone repository
git clone https://github.com/Yug-Programmer/aegis-vultr.git
cd aegis-vultr

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Start local development servers
npm run dev
```

### Deploying to any Vultr VM

```bash
# On your Vultr Ubuntu VM:
git clone https://github.com/Yug-Programmer/aegis-vultr.git /opt/aegis-vultr
cd /opt/aegis-vultr

# Run the automated deployment script:
sudo bash deploy/vultr/deploy-vultr-vm.sh
```

---

## 🏆 Submission Deliverables Checklist

- [x] **GitHub repository with setup and documentation**: [https://github.com/Yug-Programmer/aegis-vultr](https://github.com/Yug-Programmer/aegis-vultr)
- [x] **Vultr VM backend deployment**: Active on Vultr VM `139.84.171.43` (`vc2-2c-4gb`, Delhi `del`)
- [x] **Public demo URL**: [https://139.84.171.43.nip.io](https://139.84.171.43.nip.io)
- [x] **Clear architecture and use-case explanation**: Full documentation for all 5 enterprise focus areas
- [x] **Platform thinking rather than a one-off local demo**: Full interactive CRUD (add, edit, delete, clear, reset) with dynamic sandboxed execution
