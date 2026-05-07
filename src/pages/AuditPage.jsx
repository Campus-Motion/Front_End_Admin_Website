import { useEffect, useState, useMemo } from "react";
import { adminApi } from "../api";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { Alert } from "../components/ui/Alert";
import { Icon } from "../components/ui/Icons";
import "./AuditPage.css";

/* ── helpers ─────────────────────────────────── */
function listFrom(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function toIso(v) {
  return v ? new Date(v).toISOString() : undefined;
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Normalise a log row: API may return camelCase or snake_case */
function normalise(log) {
  return {
    id: log.id,
    user_id: log.user_id,
    username: log.username,
    action: log.action,
    target_table: log.target_table ?? log.targettable,
    target_id: log.target_id ?? log.targetid,
    outcome: log.outcome,
    old_value: log.old_value ?? log.oldvalue ?? null,
    new_value: log.new_value ?? log.newvalue ?? null,
    ip_address: log.ip_address ?? log.ipaddress,
    user_agent: log.user_agent ?? log.useragent,
    http_method: log.http_method ?? log.httpmethod,
    endpoint: log.endpoint,
    performed_at: log.performed_at ?? log.performedat,
  };
}

/* HTTP method colour */
const METHOD_VARIANT = {
  GET: "neutral",
  POST: "published",
  PUT: "primary",
  PATCH: "primary",
  DELETE: "danger",
};

/* Outcome badge */
function OutcomeBadge({ outcome }) {
  const v = outcome === "success" ? "published" : "danger";
  return <Badge variant={v}>{outcome ?? "—"}</Badge>;
}

/* Compact JSON diff viewer */
function DiffCell({ label, value }) {
  const [open, setOpen] = useState(false);
  if (!value)
    return <span style={{ color: "var(--color-text-faint)" }}>—</span>;
  const pretty = JSON.stringify(value, null, 2);
  return (
    <div>
      <button className="diff-toggle" onClick={() => setOpen((o) => !o)}>
        <Icon name={open ? "eye-off" : "eye"} size={12} />
        {open ? "hide" : "view"}
      </button>
      {open && <pre className="diff-pre">{pretty}</pre>}
    </div>
  );
}

/* ── main component ───────────────────────────── */
const EMPTY_FILTERS = { user_id: "", after: "", before: "", search: "" };

export function AuditPage({ onCountChange }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [pending, setPending] = useState(EMPTY_FILTERS);
  const [expanded, setExpanded] = useState(null); // log.id with expanded user-agent

  const load = async (f = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: 100 };
      if (f.user_id) params.user_id = Number(f.user_id);
      if (f.after) params.after = toIso(f.after);
      if (f.before) params.before = toIso(f.before);
      const res = await adminApi.getAuditLogs(params);
      const list = listFrom(res)
        .map(normalise)
        .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at));
      setLogs(list);
      onCountChange?.(list.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (e) =>
    setPending((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setFilters(pending);
    load(pending);
  };

  const handleReset = () => {
    setPending(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    load(EMPTY_FILTERS);
  };

  /* client-side text filter across all relevant fields */
  const visible = useMemo(() => {
    const q = pending.search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) =>
      [
        log.username,
        String(log.user_id ?? ""),
        log.action,
        log.target_table,
        String(log.target_id ?? ""),
        log.outcome,
        log.endpoint,
        log.http_method,
        log.ip_address,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q)),
    );
  }, [logs, pending.search]);

  /* summary counts */
  const successCount = logs.filter((l) => l.outcome === "success").length;
  const failCount = logs.length - successCount;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Audit logs</h1>
        <p className="page-subtitle">
          {logs.length} entries · {successCount} success · {failCount} failed
        </p>
      </div>

      {/* ── Filters ───────────────────────────── */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div
          className="section-header"
          style={{ marginBottom: "var(--space-4)" }}
        >
          <div>
            <p className="kicker">Filter</p>
            <h2>Search logs</h2>
          </div>
        </div>

        <Alert variant="error" message={error} onDismiss={() => setError("")} />

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "var(--space-4)",
            marginTop: error ? "var(--space-4)" : 0,
          }}
        >
          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="aud-uid">
                User ID <span className="optional">(optional)</span>
              </label>
              <input
                id="aud-uid"
                name="user_id"
                type="number"
                min="1"
                className="form-input"
                placeholder="3"
                value={pending.user_id}
                onChange={set}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="aud-after">
                After <span className="optional">(optional)</span>
              </label>
              <input
                id="aud-after"
                name="after"
                type="datetime-local"
                className="form-input"
                value={pending.after}
                onChange={set}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="aud-before">
                Before <span className="optional">(optional)</span>
              </label>
              <input
                id="aud-before"
                name="before"
                type="datetime-local"
                className="form-input"
                value={pending.before}
                onChange={set}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="aud-search">
                Local search
              </label>
              <input
                id="aud-search"
                name="search"
                className="form-input"
                placeholder="action, table, endpoint, IP, username…"
                value={pending.search}
                onChange={set}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Icon name="filter" size={15} />
              {loading ? "Loading…" : "Apply filters"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* ── Table ─────────────────────────────── */}
      <div className="section-header">
        <div>
          <p className="kicker">Review</p>
          <h2>Audit activity</h2>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-faint)",
            }}
          >
            {visible.length} row{visible.length !== 1 ? "s" : ""}
          </span>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => load(filters)}
            aria-label="Refresh"
          >
            <Icon name="refresh" size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "var(--space-12)",
          }}
        >
          <Spinner />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Target</th>
                <th>Method · Endpoint</th>
                <th>Outcome</th>
                <th>Before</th>
                <th>After</th>
                <th>IP · Agent</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((log) => (
                <tr
                  key={log.id}
                  className={log.outcome !== "success" ? "row-failed" : ""}
                >
                  {/* Time */}
                  <td className="audit-time">{fmtDate(log.performed_at)}</td>

                  {/* User */}
                  <td>
                    <div className="cell-primary">
                      {log.username ??
                        (log.user_id ? `#${log.user_id}` : "System")}
                    </div>
                    {log.user_id && log.username && (
                      <div className="cell-muted">id {log.user_id}</div>
                    )}
                  </td>

                  {/* Action */}
                  <td>
                    <Badge variant="neutral">{log.action}</Badge>
                  </td>

                  {/* Target table + id */}
                  <td>
                    {log.target_table ? (
                      <>
                        <div className="cell-primary">{log.target_table}</div>
                        {log.target_id != null && (
                          <div className="cell-muted">id {log.target_id}</div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "var(--color-text-faint)" }}>
                        —
                      </span>
                    )}
                  </td>

                  {/* HTTP method + endpoint */}
                  <td className="audit-endpoint">
                    {log.http_method && (
                      <Badge
                        variant={METHOD_VARIANT[log.http_method] ?? "neutral"}
                      >
                        {log.http_method}
                      </Badge>
                    )}
                    {log.endpoint && (
                      <span className="audit-path">{log.endpoint}</span>
                    )}
                  </td>

                  {/* Outcome */}
                  <td>
                    <OutcomeBadge outcome={log.outcome} />
                  </td>

                  {/* old_value */}
                  <td>
                    <DiffCell label="Before" value={log.old_value} />
                  </td>

                  {/* new_value */}
                  <td>
                    <DiffCell label="After" value={log.new_value} />
                  </td>

                  {/* IP + user agent */}
                  <td>
                    <div className="cell-primary audit-ip">
                      {log.ip_address ?? "—"}
                    </div>
                    {log.user_agent && (
                      <button
                        className="audit-agent-toggle"
                        onClick={() =>
                          setExpanded(expanded === log.id ? null : log.id)
                        }
                        title={log.user_agent}
                      >
                        {expanded === log.id ? "hide agent" : "show agent"}
                      </button>
                    )}
                    {expanded === log.id && (
                      <div className="audit-agent">{log.user_agent}</div>
                    )}
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={9} className="audit-empty">
                    No audit rows match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
