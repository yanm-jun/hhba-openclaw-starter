import { definePluginEntry } from "./node_modules/openclaw/dist/plugin-sdk/plugin-entry.js";

import { createHhbaApiClient } from "./hhba-client.js";

const schema = {
  string: (extra = {}) => ({ type: "string", ...extra }),
  number: (extra = {}) => ({ type: "number", ...extra }),
  boolean: (extra = {}) => ({ type: "boolean", ...extra }),
  array: (items, extra = {}) => ({ type: "array", items, ...extra }),
  record: (extra = {}) => ({
    type: "object",
    additionalProperties: { type: "number" },
    ...extra
  }),
  object: (properties, required = []) => ({
    type: "object",
    properties,
    required,
    additionalProperties: false
  })
};

function readPluginConfig(api) {
  const entryConfig = api?.config?.plugins?.entries?.["hhba-openclaw"]?.config || {};

  return {
    baseUrl: entryConfig.baseUrl || process.env.HHBA_BASE_URL || "http://127.0.0.1:3218",
    apiToken: entryConfig.apiToken || process.env.HHBA_API_TOKEN || "",
    defaultLimit: Number(entryConfig.defaultLimit || process.env.HHBA_DEFAULT_LIMIT || 5)
  };
}

function asToolText(title, payload) {
  return {
    content: [
      {
        type: "text",
        text: `${title}\n${JSON.stringify(payload, null, 2)}`
      }
    ]
  };
}

export default definePluginEntry({
  id: "hhba-openclaw",
  name: "HHBA OpenClaw Bridge",
  description: "Register HHBA task routing tools so OpenClaw agents can publish work to the HHBA network.",
  register(api) {
    const config = readPluginConfig(api);
    const client = createHhbaApiClient(config);

    api.registerTool(
      {
        name: "create_task",
        description: "Create a task in HHBA and get the strongest matching human executors back.",
        parameters: schema.object(
          {
            title: schema.string({ minLength: 1 }),
            objective: schema.string({ minLength: 1 }),
            budgetPerDay: schema.number({ minimum: 0 }),
            expectedDays: schema.number({ minimum: 1 }),
            priority: schema.string(),
            acceptanceCriteria: schema.array(schema.string()),
            requiredAbilities: schema.record(),
            sourceTaskId: schema.string(),
            maxCandidates: schema.number({ minimum: 1, maximum: 20 })
          },
          ["title", "objective"]
        ),
        async execute(_callId, params) {
          const result = await client.createTask({
            ...params,
            source: "openclaw",
            limit: params.maxCandidates || config.defaultLimit
          });
          return asToolText("HHBA task created", result);
        }
      },
      { optional: true }
    );

    api.registerTool(
      {
        name: "search_candidates",
        description: "Search HHBA candidates for an existing task or an ad-hoc task description.",
        parameters: {
          type: "object",
          properties: {
            taskId: schema.string(),
            task: schema.object({
              title: schema.string(),
              objective: schema.string(),
              budgetPerDay: schema.number({ minimum: 0 }),
              expectedDays: schema.number({ minimum: 1 }),
              requiredAbilities: schema.record()
            }),
            maxCandidates: schema.number({ minimum: 1, maximum: 20 })
          },
          additionalProperties: false
        },
        async execute(_callId, params) {
          const result = await client.searchCandidates({
            ...params,
            limit: params.maxCandidates || config.defaultLimit
          });
          return asToolText("HHBA candidate search", result);
        }
      },
      { optional: true }
    );

    api.registerTool(
      {
        name: "lock_candidate",
        description: "Lock the selected executor into an HHBA task.",
        parameters: schema.object(
          {
            taskId: schema.string({ minLength: 1 }),
            candidateId: schema.string({ minLength: 1 }),
            reserve: schema.boolean()
          },
          ["taskId", "candidateId"]
        ),
        async execute(_callId, params) {
          const result = await client.lockCandidate(params);
          return asToolText("HHBA candidate locked", result);
        }
      },
      { optional: true }
    );

    api.registerTool(
      {
        name: "submit_result",
        description: "Send delivery results back to HHBA so the network can update the performer score.",
        parameters: schema.object(
          {
            taskId: schema.string({ minLength: 1 }),
            qualityScore: schema.number({ minimum: 0, maximum: 100 }),
            outcome: schema.string(),
            summary: schema.string(),
            feedback: schema.string()
          },
          ["taskId"]
        ),
        async execute(_callId, params) {
          const result = await client.submitResult(params);
          return asToolText("HHBA task result submitted", result);
        }
      },
      { optional: true }
    );

    api.registerTool(
      {
        name: "update_score",
        description: "Manually adjust HHBA ability scores after review or a special project.",
        parameters: schema.object(
          {
            candidateId: schema.string({ minLength: 1 }),
            source: schema.string(),
            note: schema.string(),
            qualityScore: schema.number({ minimum: 0, maximum: 100 }),
            priorityTier: schema.string(),
            availabilityStatus: schema.string(),
            dimensions: schema.record()
          },
          ["candidateId"]
        ),
        async execute(_callId, params) {
          const result = await client.updateScore(params);
          return asToolText("HHBA score updated", result);
        }
      },
      { optional: true }
    );
  }
});
