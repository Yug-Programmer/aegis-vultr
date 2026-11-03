import {
  createRpcHmacHeaders,
  type ArtifactMeta,
  type BrowserActionRequest,
  type BrowserActionResponse,
  type ExecCodeRequest,
  type ExecCodeResponse,
  type IsolationTier,
  type SandboxWorkerHealth,
} from '@aegis/shared';

export class SandboxClient {
  private workerUrl: string;
  private sharedSecret: string;

  constructor(workerUrl?: string, sharedSecret?: string) {
    this.workerUrl = (
      workerUrl ||
      process.env.SANDBOX_WORKER_URL ||
      'http://127.0.0.1:4100'
    ).replace(/\/+$/, '');
    this.sharedSecret =
      sharedSecret ||
      process.env.SANDBOX_SHARED_SECRET ||
      'aegis-vultr-dev-hmac-secret-change-in-prod';
  }

  configure(workerUrl: string, sharedSecret?: string): void {
    this.workerUrl = workerUrl.replace(/\/+$/, '');
    if (sharedSecret) {
      this.sharedSecret = sharedSecret;
    }
  }

  getWorkerUrl(): string {
    return this.workerUrl;
  }

  async getHealth(): Promise<SandboxWorkerHealth> {
    const res = await fetch(`${this.workerUrl}/v1/health`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      throw new Error(`Sandbox worker health failed with status ${res.status}`);
    }
    return (await res.json()) as SandboxWorkerHealth;
  }

  private async signedJsonRequest<T>(
    method: string,
    urlPath: string,
    body?: unknown,
    timeoutMs = 35000
  ): Promise<T> {
    const bodyStr = body !== undefined ? JSON.stringify(body) : '';
    const hmacHeaders = createRpcHmacHeaders(this.sharedSecret, method, urlPath, bodyStr);

    const headers: Record<string, string> = {
      ...hmacHeaders,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.workerUrl}${urlPath}`, {
      method,
      headers,
      body: body !== undefined ? bodyStr : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { error: text };
    }

    if (!res.ok) {
      const errMsg =
        typeof parsed === 'object' && parsed && 'error' in parsed
          ? String((parsed as { error: unknown }).error)
          : `RPC error ${res.status}`;
      throw new Error(errMsg);
    }

    return parsed as T;
  }

  async createSandbox(): Promise<{ sandboxId: string; isolationTier: IsolationTier }> {
    return await this.signedJsonRequest('POST', '/v1/sandboxes', {});
  }

  async destroySandbox(sandboxId: string): Promise<void> {
    await this.signedJsonRequest('DELETE', `/v1/sandboxes/${encodeURIComponent(sandboxId)}`);
  }

  async writeFile(
    sandboxId: string,
    payload: {
      relativePath: string;
      content: string;
      missionId: string;
      stepIndex: number;
      policyRuleId: string;
      prevReceiptHash: string;
    }
  ) {
    return await this.signedJsonRequest<{
      relativePath: string;
      sizeBytes: number;
      sha256: string;
      artifacts: ArtifactMeta[];
      receipt: ExecCodeResponse['receipt'];
    }>('POST', `/v1/sandboxes/${encodeURIComponent(sandboxId)}/files`, payload);
  }

  async listArtifacts(sandboxId: string): Promise<ArtifactMeta[]> {
    const res = await this.signedJsonRequest<{ artifacts: ArtifactMeta[] }>(
      'GET',
      `/v1/sandboxes/${encodeURIComponent(sandboxId)}/files`
    );
    return res.artifacts;
  }

  async readArtifactRaw(
    sandboxId: string,
    relativePath: string
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const urlPath = `/v1/sandboxes/${encodeURIComponent(sandboxId)}/files?path=${encodeURIComponent(relativePath)}`;
    const hmacHeaders = createRpcHmacHeaders(this.sharedSecret, 'GET', urlPath, '');
    const res = await fetch(`${this.workerUrl}${urlPath}`, {
      method: 'GET',
      headers: hmacHeaders,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Artifact fetch failed (${res.status}): ${errText}`);
    }
    const arrayBuf = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuf),
      mimeType: res.headers.get('content-type') || 'application/octet-stream',
    };
  }

  async execCode(sandboxId: string, req: ExecCodeRequest): Promise<ExecCodeResponse> {
    return await this.signedJsonRequest<ExecCodeResponse>(
      'POST',
      `/v1/sandboxes/${encodeURIComponent(sandboxId)}/exec`,
      req,
      (req.timeoutMs || 20000) + 8000
    );
  }

  async execBrowser(sandboxId: string, req: BrowserActionRequest): Promise<BrowserActionResponse> {
    return await this.signedJsonRequest<BrowserActionResponse>(
      'POST',
      `/v1/sandboxes/${encodeURIComponent(sandboxId)}/browser`,
      req,
      (req.timeoutMs || 20000) + 10000
    );
  }
}
