import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

const executeTargetPath = "/app/packages/adapters/openclaw-gateway/src/server/execute.ts";
const registryTargetPath = "/app/server/src/adapters/registry.ts";
const registryDistTargetPath = "/app/server/dist/adapters/registry.js";

const structuredPayloadMarker = "PAPERCLIP_OPENCLAW_DISABLE_STRUCTURED_PAYLOAD";
const structuredPayloadNeedle = "  agentParams.paperclip = paperclipPayload;\n";
const structuredPayloadReplacement = `  const disableStructuredPaperclipPayload =
    parseBoolean(ctx.config.disableStructuredPaperclipPayload, false) ||
    parseBoolean(process.env.PAPERCLIP_OPENCLAW_DISABLE_STRUCTURED_PAYLOAD, false);
  if (!disableStructuredPaperclipPayload) {
    agentParams.paperclip = paperclipPayload;
  }\n`;

const runJwtMarker = "PAPERCLIP_OPENCLAW_USE_RUN_JWT";
const runJwtNeedle = `  const paperclipApiUrlOverride = resolvePaperclipApiUrlOverride(ctx.config.paperclipApiUrl);
  const paperclipEnv: Record<string, string> = {
    ...buildPaperclipEnv(ctx.agent),
    PAPERCLIP_RUN_ID: ctx.runId,
  };
`;
const runJwtReplacement = `  const paperclipApiUrlOverride = resolvePaperclipApiUrlOverride(ctx.config.paperclipApiUrl);
  const runAuthToken = nonEmpty(ctx.authToken);
  const paperclipEnv: Record<string, string> = {
    ...buildPaperclipEnv(ctx.agent),
    PAPERCLIP_RUN_ID: ctx.runId,
  };

  if (runAuthToken) {
    paperclipEnv.PAPERCLIP_API_KEY = runAuthToken;
  }
`;

const orderedKeysNeedle = `    "PAPERCLIP_RUN_ID",
    "PAPERCLIP_AGENT_ID",
    "PAPERCLIP_COMPANY_ID",
    "PAPERCLIP_API_URL",
`;
const orderedKeysReplacement = `    "PAPERCLIP_RUN_ID",
    "PAPERCLIP_AGENT_ID",
    "PAPERCLIP_COMPANY_ID",
    "PAPERCLIP_API_KEY",
    "PAPERCLIP_API_URL",
`;

const wakeTextNeedle = `  const issueIdHint = payload.taskId ?? payload.issueId ?? "";
  const apiBaseHint = paperclipEnv.PAPERCLIP_API_URL ?? "<set PAPERCLIP_API_URL>";

  const lines = [
    "Paperclip wake event for a cloud adapter.",
    "",
    "Run this procedure now. Do not guess undocumented endpoints and do not ask for additional heartbeat docs.",
    "",
    "Set these values in your run context:",
    ...envLines,
    \`PAPERCLIP_API_KEY=<token from \${claimedApiKeyPath}>\`,
    "",
    \`Load PAPERCLIP_API_KEY from \${claimedApiKeyPath} (the token you saved after claim-api-key).\`,
    "",
`;
const wakeTextReplacement = `  const issueIdHint = payload.taskId ?? payload.issueId ?? "";
  const apiBaseHint = paperclipEnv.PAPERCLIP_API_URL ?? "<set PAPERCLIP_API_URL>";
  const hasInjectedRunApiKey = nonEmpty(paperclipEnv.PAPERCLIP_API_KEY);

  const lines = [
    "Paperclip wake event for a cloud adapter.",
    "",
    "Run this procedure now. Do not guess undocumented endpoints and do not ask for additional heartbeat docs.",
    "",
    "Set these values in your run context:",
    ...envLines,
    ...(hasInjectedRunApiKey
      ? [
          "",
          "PAPERCLIP_API_KEY above is a run-scoped Paperclip token for this agent. Use it directly for this run.",
          "",
        ]
      : [
          \`PAPERCLIP_API_KEY=<token from \${claimedApiKeyPath}>\`,
          "",
          \`Load PAPERCLIP_API_KEY from \${claimedApiKeyPath} (the token you saved after claim-api-key).\`,
          "",
        ]),
`;

const registryMarker = "PAPERCLIP_OPENCLAW_ENABLE_RUN_JWT";
const registryNeedle = `const openclawGatewayAdapter: ServerAdapterModule = {
  type: "openclaw_gateway",
  execute: openclawGatewayExecute,
  testEnvironment: openclawGatewayTestEnvironment,
  models: openclawGatewayModels,
  supportsLocalAgentJwt: false,
  agentConfigurationDoc: openclawGatewayAgentConfigurationDoc,
};
`;
const registryDistNeedle = `const openclawGatewayAdapter = {
    type: "openclaw_gateway",
    execute: openclawGatewayExecute,
    testEnvironment: openclawGatewayTestEnvironment,
    models: openclawGatewayModels,
    supportsLocalAgentJwt: false,
    agentConfigurationDoc: openclawGatewayAgentConfigurationDoc,
};
`;
const registryDistReplacement = `const openclawGatewayAdapter = {
    type: "openclaw_gateway",
    execute: openclawGatewayExecute,
    testEnvironment: openclawGatewayTestEnvironment,
    models: openclawGatewayModels,
    supportsLocalAgentJwt: true, // ${registryMarker}
    agentConfigurationDoc: openclawGatewayAgentConfigurationDoc,
};
`;
const registryReplacement = `const openclawGatewayAdapter: ServerAdapterModule = {
  type: "openclaw_gateway",
  execute: openclawGatewayExecute,
  testEnvironment: openclawGatewayTestEnvironment,
  models: openclawGatewayModels,
  supportsLocalAgentJwt: true, // ${registryMarker}
  agentConfigurationDoc: openclawGatewayAgentConfigurationDoc,
};
`;

function replaceOnce(source, needle, replacement, errorMessage) {
  if (!source.includes(needle)) {
    throw new Error(errorMessage);
  }
  return source.replace(needle, replacement);
}

function patchOpenClawGatewayAdapter() {
  if (!existsSync(executeTargetPath)) {
    console.warn(`[pantheora] OpenClaw gateway adapter source not found: ${executeTargetPath}`);
    return;
  }

  let source = readFileSync(executeTargetPath, "utf8");
  let changed = false;

  if (!source.includes(structuredPayloadMarker)) {
    source = replaceOnce(
      source,
      structuredPayloadNeedle,
      structuredPayloadReplacement,
      "[pantheora] Could not find OpenClaw gateway payload assignment to patch.",
    );
    changed = true;
  }

  if (!source.includes(runJwtMarker)) {
    source = replaceOnce(
      source,
      runJwtNeedle,
      `${runJwtReplacement}  // ${runJwtMarker}\n`,
      "[pantheora] Could not find OpenClaw wake env block to patch.",
    );
    source = replaceOnce(
      source,
      orderedKeysNeedle,
      orderedKeysReplacement,
      "[pantheora] Could not find OpenClaw ordered env keys to patch.",
    );
    source = replaceOnce(
      source,
      wakeTextNeedle,
      wakeTextReplacement,
      "[pantheora] Could not find OpenClaw wake text API key instructions to patch.",
    );
    changed = true;
  }

  if (changed) {
    writeFileSync(executeTargetPath, source, "utf8");
    console.log("[pantheora] Applied OpenClaw gateway execute.ts compatibility patches.");
  } else {
    console.log("[pantheora] OpenClaw gateway execute.ts patches already applied.");
  }
}

function patchAdapterRegistry() {
  const targets = [
    {
      path: registryTargetPath,
      needle: registryNeedle,
      replacement: registryReplacement,
      label: "adapter registry source",
    },
    {
      path: registryDistTargetPath,
      needle: registryDistNeedle,
      replacement: registryDistReplacement,
      label: "adapter registry dist",
    },
  ];

  let changed = false;
  for (const target of targets) {
    if (!existsSync(target.path)) {
      console.warn(`[pantheora] ${target.label} not found: ${target.path}`);
      continue;
    }

    const source = readFileSync(target.path, "utf8");
    if (source.includes(registryMarker)) {
      console.log(`[pantheora] ${target.label} run JWT patch already applied.`);
      continue;
    }

    const patched = replaceOnce(
      source,
      target.needle,
      target.replacement,
      `[pantheora] Could not find openclaw_gateway entry in ${target.label}.`,
    );
    writeFileSync(target.path, patched, "utf8");
    changed = true;
  }

  if (changed) {
    console.log("[pantheora] Enabled run JWT support for openclaw_gateway adapter.");
  }
}

function forwardSignal(child, signal) {
  if (!child.killed) {
    child.kill(signal);
  }
}

patchOpenClawGatewayAdapter();
patchAdapterRegistry();

const child = spawn(
  "node",
  ["--import", "./server/node_modules/tsx/dist/loader.mjs", "server/dist/index.js"],
  {
    cwd: "/app",
    stdio: "inherit",
    env: process.env,
  },
);

process.on("SIGINT", () => forwardSignal(child, "SIGINT"));
process.on("SIGTERM", () => forwardSignal(child, "SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
