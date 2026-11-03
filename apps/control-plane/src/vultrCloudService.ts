export interface VultrInstanceSummary {
  id: string;
  label: string;
  region: string;
  plan: string;
  mainIp: string;
  status: string;
  powerStatus: string;
  os: string;
  vcpuCount: number;
  ramMb: number;
  tags: string[];
  dateCreated: string;
}

export class VultrCloudService {
  private vultrApiKey = process.env.VULTR_API_KEY || '';
  private defaultRegion = process.env.VULTR_DEFAULT_REGION || 'ewr';
  private defaultPlan = process.env.VULTR_DEFAULT_PLAN || 'vc2-2c-4gb';

  setApiKey(apiKey: string): void {
    this.vultrApiKey = apiKey.trim();
  }

  hasApiKey(): boolean {
    return Boolean(this.vultrApiKey);
  }

  getDefaults() {
    return {
      configured: Boolean(this.vultrApiKey),
      defaultRegion: this.defaultRegion,
      defaultPlan: this.defaultPlan,
    };
  }

  async listInferenceModels(
    inferenceApiKey?: string,
    baseUrl = 'https://api.vultrinference.com/v1'
  ): Promise<{ live: boolean; models: string[] }> {
    const defaultCatalog = [
      'kimi-k2-instruct',
      'deepseek-r1-distill-qwen-32b',
      'qwen2.5-coder-32b-instruct',
      'llama-3.3-70b-instruct-fp8',
    ];
    if (!inferenceApiKey) {
      return { live: false, models: defaultCatalog };
    }

    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/models`, {
        headers: {
          Authorization: `Bearer ${inferenceApiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        return { live: false, models: defaultCatalog };
      }
      const json = (await res.json()) as {
        data?: Array<{ id?: string }>;
      };
      const ids = (json.data || [])
        .map((m) => m.id)
        .filter((id): id is string => Boolean(id));
      return {
        live: ids.length > 0,
        models: ids.length > 0 ? ids : defaultCatalog,
      };
    } catch {
      return { live: false, models: defaultCatalog };
    }
  }

  async listInstances(): Promise<VultrInstanceSummary[]> {
    if (!this.vultrApiKey) {
      return [];
    }

    const res = await fetch('https://api.vultr.com/v2/instances', {
      headers: {
        Authorization: `Bearer ${this.vultrApiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vultr API v2 /instances returned ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      instances?: Array<{
        id: string;
        label: string;
        region: string;
        plan: string;
        main_ip: string;
        status: string;
        power_status: string;
        os: string;
        vcpu_count: number;
        ram: number;
        tags?: string[];
        date_created: string;
      }>;
    };

    return (json.instances || []).map((inst) => ({
      id: inst.id,
      label: inst.label,
      region: inst.region,
      plan: inst.plan,
      mainIp: inst.main_ip,
      status: inst.status,
      powerStatus: inst.power_status,
      os: inst.os,
      vcpuCount: inst.vcpu_count,
      ramMb: inst.ram,
      tags: inst.tags || [],
      dateCreated: inst.date_created,
    }));
  }

  generateSandboxCloudInit(opts: {
    sharedSecret: string;
    region: string;
    label: string;
    repoGitUrl?: string;
  }): string {
    const repoUrl = opts.repoGitUrl || 'https://github.com/your-org/aegis-vultr.git';
    return `#cloud-config
package_update: true
package_upgrade: true
packages:
  - ca-certificates
  - curl
  - gnupg
  - git
  - ufw
  - iptables-persistent
  - python3
  - python3-venv
  - chromium-browser

runcmd:
  # 1. Install Docker Engine + gVisor (runsc) sandbox runtime on Vultr Ubuntu 24.04
  - install -m 0755 -d /etc/apt/keyrings
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  - chmod a+r /etc/apt/keyrings/docker.gpg
  - echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable" > /etc/apt/sources.list.d/docker.list
  - curl -fsSL https://gvisor.dev/archive.key | gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
  - echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" > /etc/apt/sources.list.d/gvisor.list
  - apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io runsc
  - runsc install && systemctl reload docker

  # 2. Kernel-level Containment Firewall: Block container SSRF to Vultr Instance Metadata (169.254.169.254)
  - iptables -I DOCKER-USER -d 169.254.169.254/32 -j DROP
  - netfilter-persistent save

  # 3. Install Node.js 22 LTS & build unprivileged sandbox runner image
  - curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  - apt-get install -y nodejs
  - docker pull python:3.12-slim

  # 4. Configure UFW host firewall (SSH + HMAC-authenticated Sandbox Worker RPC port 4100)
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 22/tcp
  - ufw allow 4100/tcp
  - ufw --force enable

  # 5. Deploy AEGIS Sandbox Worker Daemon (Clone repo or run standalone stack)
  - git clone ${repoUrl} /opt/aegis-vultr || true
  - |
    cat <<EOF > /etc/systemd/system/aegis-sandbox-worker.service
    [Unit]
    Description=AEGIS Vultr Isolated Sandbox Worker Daemon
    After=network.target docker.service

    [Service]
    Type=simple
    WorkingDirectory=/opt/aegis-vultr
    Environment=NODE_ENV=production
    Environment=SANDBOX_WORKER_PORT=4100
    Environment=SANDBOX_DRIVER=docker
    Environment=SANDBOX_DOCKER_IMAGE=python:3.12-slim
    Environment=SANDBOX_METADATA_LABEL=${opts.label}
    Environment=VULTR_INSTANCE_REGION=${opts.region}
    Environment=SANDBOX_SHARED_SECRET=${opts.sharedSecret}
    ExecStart=/usr/bin/npm --workspace=@aegis/sandbox-worker run start
    Restart=always
    RestartSec=3

    [Install]
    WantedBy=multi-user.target
    EOF
  - systemctl daemon-reload
  - systemctl enable aegis-sandbox-worker.service
`;
  }

  async provisionSandboxNode(opts: {
    region?: string;
    plan?: string;
    label?: string;
    sharedSecret: string;
  }): Promise<{
    instance: VultrInstanceSummary;
    cloudInitPreview: string;
  }> {
    if (!this.vultrApiKey) {
      throw new Error(
        'VULTR_API_KEY is not configured. Add your Vultr API v2 key in .env or Infrastructure Settings.'
      );
    }

    const region = opts.region || this.defaultRegion;
    const plan = opts.plan || this.defaultPlan;
    const label = opts.label || `aegis-sandbox-${region}-${Date.now().toString(36).slice(-4)}`;

    const cloudInit = this.generateSandboxCloudInit({
      sharedSecret: opts.sharedSecret,
      region,
      label,
    });

    const userDataBase64 = Buffer.from(cloudInit, 'utf8').toString('base64');

    const res = await fetch('https://api.vultr.com/v2/instances', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.vultrApiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        region,
        plan,
        os_id: 2136, // Ubuntu 24.04 LTS x64
        label,
        hostname: label,
        tags: ['aegis-sandbox', 'containment-worker'],
        user_data: userDataBase64,
        backups: 'disabled',
      }),
      signal: AbortSignal.timeout(15000),
    });

    const raw = await res.text();
    if (!res.ok) {
      throw new Error(`Vultr instance provisioning failed (${res.status}): ${raw.slice(0, 260)}`);
    }

    const parsed = JSON.parse(raw) as {
      instance: {
        id: string;
        label: string;
        region: string;
        plan: string;
        main_ip: string;
        status: string;
        power_status: string;
        os: string;
        vcpu_count: number;
        ram: number;
        tags?: string[];
        date_created: string;
      };
    };

    const inst = parsed.instance;
    return {
      instance: {
        id: inst.id,
        label: inst.label,
        region: inst.region,
        plan: inst.plan,
        mainIp: inst.main_ip,
        status: inst.status,
        powerStatus: inst.power_status,
        os: inst.os,
        vcpuCount: inst.vcpu_count,
        ramMb: inst.ram,
        tags: inst.tags || [],
        dateCreated: inst.date_created,
      },
      cloudInitPreview: cloudInit,
    };
  }
}
