#!/usr/bin/env node
/**
 * AEGIS // VULTR — CLI Provisioner for Vultr Cloud Compute Sandbox VMs
 * Usage:
 *   node deploy/vultr/provision-vultr.mjs list
 *   node deploy/vultr/provision-vultr.mjs create --region=ewr --plan=vc2-2c-4gb --label=aegis-vultr-node
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.trim().startsWith('#')) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (!process.env[k] && v) process.env[k] = v;
    }
  }
}

const apiKey = process.env.VULTR_API_KEY;
const cmd = process.argv[2] || 'help';

function argVal(flag, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${flag}=`));
  return hit ? hit.split('=')[1] : fallback;
}

async function main() {
  if (cmd === 'help' || !['list', 'create'].includes(cmd)) {
    console.log(`AEGIS // VULTR Infrastructure CLI
Commands:
  node deploy/vultr/provision-vultr.mjs list
  node deploy/vultr/provision-vultr.mjs create [--region=ewr] [--plan=vc2-2c-4gb] [--label=aegis-sandbox]`);
    return;
  }

  if (!apiKey) {
    console.error('Error: VULTR_API_KEY is not set in environment or .env');
    process.exit(1);
  }

  if (cmd === 'list') {
    const res = await fetch('https://api.vultr.com/v2/instances', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    console.table(
      (data.instances || []).map((i) => ({
        id: i.id,
        label: i.label,
        region: i.region,
        plan: i.plan,
        ip: i.main_ip,
        status: i.status,
      }))
    );
    return;
  }

  if (cmd === 'create') {
    const region = argVal('region', process.env.VULTR_DEFAULT_REGION || 'ewr');
    const plan = argVal('plan', process.env.VULTR_DEFAULT_PLAN || 'vc2-2c-4gb');
    const label = argVal('label', `aegis-vultr-${region}`);
    const cloudInit = fs.readFileSync(path.join(__dirname, 'cloud-init.yaml'), 'utf8');

    console.log(`Provisioning hardened Vultr Cloud Compute instance (${label} | ${region} | ${plan})...`);
    const res = await fetch('https://api.vultr.com/v2/instances', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        region,
        plan,
        os_id: 2136,
        label,
        hostname: label,
        tags: ['aegis-sandbox'],
        user_data: Buffer.from(cloudInit, 'utf8').toString('base64'),
      }),
    });
    const out = await res.json();
    if (!res.ok) {
      console.error('Provisioning error:', out);
      process.exit(1);
    }
    console.log('Created Vultr Sandbox Instance:', out.instance);
  }
}

void main();
