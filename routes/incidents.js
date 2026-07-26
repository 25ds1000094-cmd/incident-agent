import express from "express";
import { planIncident } from "../services/planner.js";
import { saveRun, getRun } from "../services/storage.js";
import { createTrace, addSpan } from "../services/telemetry.js";
import { randomUUID } from "crypto";

const router = express.Router();

function makeId(prefix) {
  return prefix + "_" + randomUUID().replaceAll("-", "");
}

router.post("/", async (req, res) => {
  try {
    const body = req.body;

    if (!body || body.profile !== "ga5-incident-agent/v2") {
      return res.status(400).json({
        error: "unsupported profile"
      });
    }

    if (!body.runId || !body.incident) {
      return res.status(422).json({
        error: "invalid request"
      });
    }

    // Replay protection
    const existing = getRun(body.runId);

    if (existing) {
      return res.json(existing);
    }

    // Remove sensitive data before AI call
    const incidentForAI = {
      incidentId: body.incident.incidentId,
      title: body.incident.title,
      service: body.incident.service,
      severity: body.incident.severity,
      transcript: body.incident.transcript,
      allowedRootCauses: body.incident.allowedRootCauses
    };

    const diagnosis = await planIncident(incidentForAI);

    const trace = createTrace();

    addSpan(trace, "invoke_agent");
    addSpan(trace, "chat incident-plan");

    const tool =
      body.toolCatalog?.find(
        t => !body.policy?.effectTools?.includes(t.name)
      );

    const actionId = makeId("action");
    const callId = makeId("call");

    const dispatch = {
      actionId,
      callId,
      phase: "diagnostic",
      toolName: tool?.name || "query_metrics",
      arguments: {},
      evidence: diagnosis.evidence || [],
      attempt: 1,
      traceparent:
        "00-" +
        trace.traceId +
        "-" +
        makeId("span").slice(0, 16) +
        "-01"
    };

    const run = {
      runId: body.runId,
      status: "waiting",

      diagnosis,

      dispatches: [
        dispatch
      ],

      approvals: [],

      actionLog: [],

      receiptLog: [],

      otlp: {
        resourceSpans: [
          {
            scopeSpans: [
              {
                spans: trace.spans
              }
            ]
          }
        ]
      }
    };

    saveRun(body.runId, run);

    return res.json(run);

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: "internal error"
    });
  }
});


router.post("/:runId/receipts", (req, res) => {

  const run = getRun(req.params.runId);

  if (!run) {
    return res.status(404).json({
      error: "not found"
    });
  }

  run.receiptLog.push(req.body);

  run.dispatches = [];

  run.status = "completed";

  saveRun(req.params.runId, run);

  return res.json(run);

});


router.get("/:runId", (req, res) => {

  const run = getRun(req.params.runId);

  if (!run) {
    return res.status(404).json({
      error: "not found"
    });
  }

  return res.json(run);

});


export default router;
