export type SupportedLlmProvider = 'vultr' | 'gemini' | 'openai';

export interface LlmToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LlmToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: LlmToolCall[];
  tool_call_id?: string;
}

export interface RuntimeLlmConfig {
  preferredProvider: 'auto' | SupportedLlmProvider | 'playbook';
  vultrInferenceApiKey?: string;
  vultrInferenceModel: string;
  vultrInferenceBaseUrl: string;
  geminiApiKey?: string;
  geminiModel: string;
  openaiApiKey?: string;
  openaiModel: string;
}

export class LlmClient {
  private config: RuntimeLlmConfig = {
    preferredProvider:
      (process.env.LLM_PROVIDER as RuntimeLlmConfig['preferredProvider']) || 'auto',
    vultrInferenceApiKey: process.env.VULTR_INFERENCE_API_KEY || '',
    vultrInferenceModel: process.env.VULTR_INFERENCE_MODEL || 'kimi-k2-instruct',
    vultrInferenceBaseUrl: (
      process.env.VULTR_INFERENCE_BASE_URL || 'https://api.vultrinference.com/v1'
    ).replace(/\/+$/, ''),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };

  updateConfig(partial: Partial<RuntimeLlmConfig>): void {
    if (partial.preferredProvider !== undefined) {
      this.config.preferredProvider = partial.preferredProvider;
    }
    if (partial.vultrInferenceApiKey !== undefined) {
      this.config.vultrInferenceApiKey = partial.vultrInferenceApiKey.trim();
    }
    if (partial.vultrInferenceModel) {
      this.config.vultrInferenceModel = partial.vultrInferenceModel.trim();
    }
    if (partial.geminiApiKey !== undefined) {
      this.config.geminiApiKey = partial.geminiApiKey.trim();
    }
    if (partial.geminiModel) {
      this.config.geminiModel = partial.geminiModel.trim();
    }
    if (partial.openaiApiKey !== undefined) {
      this.config.openaiApiKey = partial.openaiApiKey.trim();
    }
    if (partial.openaiModel) {
      this.config.openaiModel = partial.openaiModel.trim();
    }
  }

  getPublicStatus() {
    const active = this.resolveActiveEndpoint();
    return {
      preferredProvider: this.config.preferredProvider,
      activeMode: active ? active.provider : 'autonomous-playbook',
      activeModel: active ? active.model : 'aegis-deterministic-v1',
      vultrInferenceConfigured: Boolean(this.config.vultrInferenceApiKey),
      vultrInferenceModel: this.config.vultrInferenceModel,
      vultrInferenceBaseUrl: this.config.vultrInferenceBaseUrl,
      geminiConfigured: Boolean(this.config.geminiApiKey),
      geminiModel: this.config.geminiModel,
      openaiConfigured: Boolean(this.config.openaiApiKey),
      openaiModel: this.config.openaiModel,
    };
  }

  getVultrInferenceCredentials(): { apiKey?: string; baseUrl: string } {
    return {
      apiKey: this.config.vultrInferenceApiKey || undefined,
      baseUrl: this.config.vultrInferenceBaseUrl,
    };
  }

  resolveActiveEndpoint(): {
    provider: SupportedLlmProvider;
    baseUrl: string;
    apiKey: string;
    model: string;
  } | null {
    if (this.config.preferredProvider === 'playbook') {
      return null;
    }

    const candidates: Array<{
      provider: SupportedLlmProvider;
      baseUrl: string;
      apiKey?: string;
      model: string;
    }> = [
      {
        provider: 'vultr',
        baseUrl: this.config.vultrInferenceBaseUrl,
        apiKey: this.config.vultrInferenceApiKey,
        model: this.config.vultrInferenceModel,
      },
      {
        provider: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: this.config.geminiApiKey,
        model: this.config.geminiModel,
      },
      {
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: this.config.openaiApiKey,
        model: this.config.openaiModel,
      },
    ];

    if (this.config.preferredProvider !== 'auto') {
      const explicit = candidates.find((c) => c.provider === this.config.preferredProvider);
      if (explicit && explicit.apiKey) {
        return {
          provider: explicit.provider,
          baseUrl: explicit.baseUrl,
          apiKey: explicit.apiKey,
          model: explicit.model,
        };
      }
    }

    for (const c of candidates) {
      if (c.apiKey) {
        return {
          provider: c.provider,
          baseUrl: c.baseUrl,
          apiKey: c.apiKey,
          model: c.model,
        };
      }
    }
    return null;
  }

  async chatCompletion(opts: {
    messages: LlmMessage[];
    tools?: LlmToolDefinition[];
    temperature?: number;
  }): Promise<{
    provider: SupportedLlmProvider;
    model: string;
    content: string;
    toolCalls: LlmToolCall[];
  }> {
    const endpoint = this.resolveActiveEndpoint();
    if (!endpoint) {
      throw new Error('No external LLM API key configured');
    }

    const payload: Record<string, unknown> = {
      model: endpoint.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.2,
    };

    if (opts.tools && opts.tools.length > 0) {
      payload.tools = opts.tools;
      payload.tool_choice = 'auto';
    }

    const res = await fetch(`${endpoint.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${endpoint.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });

    const rawText = await res.text();
    if (!res.ok) {
      throw new Error(
        `${endpoint.provider.toUpperCase()} Inference error (${res.status}): ${rawText.slice(0, 300)}`
      );
    }

    const data = JSON.parse(rawText) as {
      model?: string;
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: LlmToolCall[];
        };
      }>;
    };

    const msg = data.choices?.[0]?.message;
    return {
      provider: endpoint.provider,
      model: data.model || endpoint.model,
      content: msg?.content || '',
      toolCalls: msg?.tool_calls || [],
    };
  }
}
