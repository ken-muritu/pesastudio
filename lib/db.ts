import Database from "better-sqlite3";
import path from "path";
import { createId } from "@paralleldrive/cuid2";

const DB_PATH =
  process.env.DATABASE_URL?.replace("file:", "") ??
  path.join(process.cwd(), "dev.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Project (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      apiKey        TEXT NOT NULL UNIQUE,
      localEndpoint TEXT,
      createdAt     INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_project_apiKey ON Project(apiKey);

    CREATE TABLE IF NOT EXISTS Callback (
      id                TEXT PRIMARY KEY,
      projectId         TEXT NOT NULL,
      payload           TEXT NOT NULL,
      mpesaReceipt      TEXT,
      resultCode        INTEGER,
      transactionType   TEXT DEFAULT 'unknown',
      amount            INTEGER,
      phoneNumber       TEXT,
      status            TEXT NOT NULL DEFAULT 'received',
      forwardedResponse TEXT,
      replayCount       INTEGER NOT NULL DEFAULT 0,
      receivedAt        INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
      forwardedAt       INTEGER,
      FOREIGN KEY (projectId) REFERENCES Project(id)
    );

    CREATE INDEX IF NOT EXISTS idx_callback_projectId ON Callback(projectId);
    CREATE INDEX IF NOT EXISTS idx_callback_resultCode ON Callback(resultCode);
    CREATE INDEX IF NOT EXISTS idx_callback_receivedAt ON Callback(receivedAt);
  `);

  const demoProject = db
    .prepare("SELECT id FROM Project WHERE apiKey = ?")
    .get("ps_demo_abc123");

  if (!demoProject) {
    db.prepare(
      "INSERT INTO Project (id, name, apiKey) VALUES (?, ?, ?)"
    ).run(createId(), "Demo Project", "ps_demo_abc123");
  }
}

export interface Project {
  id: string;
  name: string;
  apiKey: string;
  localEndpoint: string | null;
  createdAt: number;
}

export interface Callback {
  id: string;
  projectId: string;
  payload: string;
  mpesaReceipt: string | null;
  resultCode: number | null;
  transactionType: string;
  amount: number | null;
  phoneNumber: string | null;
  status: string;
  forwardedResponse: string | null;
  replayCount: number;
  receivedAt: number;
  forwardedAt: number | null;
}

export interface ParsedPayload {
  mpesaReceipt: string | null;
  resultCode: number | null;
  resultDesc: string | null;
  transactionType: string;
  amount: number | null;
  phoneNumber: string | null;
}

export function parseMpesaPayload(payload: unknown): ParsedPayload {
  const result: ParsedPayload = {
    mpesaReceipt: null,
    resultCode: null,
    resultDesc: null,
    transactionType: "unknown",
    amount: null,
    phoneNumber: null,
  };

  if (!payload || typeof payload !== "object") return result;

  const p = payload as Record<string, unknown>;

  if (
    p.Body &&
    typeof p.Body === "object" &&
    (p.Body as Record<string, unknown>).stkCallback
  ) {
    const stk = (p.Body as Record<string, unknown>)
      .stkCallback as Record<string, unknown>;
    result.transactionType = "stk_push";
    result.resultCode =
      typeof stk.ResultCode === "number" ? stk.ResultCode : null;
    result.resultDesc =
      typeof stk.ResultDesc === "string" ? stk.ResultDesc : null;

    const meta = stk.CallbackMetadata as
      | { Item: Array<{ Name: string; Value: unknown }> }
      | undefined;
    if (meta?.Item) {
      const find = (name: string) =>
        meta.Item.find((i) => i.Name === name)?.Value;
      result.mpesaReceipt = (find("MpesaReceiptNumber") as string) ?? null;
      result.amount =
        typeof find("Amount") === "number"
          ? (find("Amount") as number)
          : null;
      result.phoneNumber = find("PhoneNumber")?.toString() ?? null;
    }
  } else if (p.Result && typeof p.Result === "object") {
    const r = p.Result as Record<string, unknown>;
    result.transactionType = "b2c";
    result.resultCode =
      typeof r.ResultCode === "number" ? r.ResultCode : null;
    result.resultDesc =
      typeof r.ResultDesc === "string" ? r.ResultDesc : null;

    const params = (
      r.ResultParameters as
        | { ResultParameter: Array<{ Key: string; Value: unknown }> }
        | undefined
    )?.ResultParameter;
    if (params) {
      const findP = (key: string) =>
        params.find((p) => p.Key === key)?.Value;
      result.mpesaReceipt =
        (findP("TransactionReceipt") as string) ??
        (r.TransactionID as string) ??
        null;
      result.amount =
        typeof findP("TransactionAmount") === "number"
          ? (findP("TransactionAmount") as number)
          : null;
    }
  } else if (typeof p.TransID === "string") {
    result.transactionType = "c2b";
    result.mpesaReceipt = p.TransID;
    result.amount = p.TransAmount
      ? parseInt(p.TransAmount as string, 10)
      : null;
    result.phoneNumber = (p.MSISDN as string) ?? null;
    result.resultCode = 0;
  }

  return result;
}

export { createId };
