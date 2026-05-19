import { useState, useEffect } from "react";
import { eventsApi } from "../../api";
import { Badge } from "../ui/Badge";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EditDrawer } from "../ui/EditDrawer";
import { Icon } from "../ui/Icons";
import { EventForm } from "./EventForm";

function fmt(v) {
  return v
    ? new Date(v).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

const SPORT_EMOJI = {
  run: "🏃",
  walk: "🚶",
  bike: "🚴",
  hike: "🥾",
  swim: "🏊",
  triathlon: "🏅",
  fitnesstrail: "⚡",
  climbing: "🧗",
  volleyball: "🏐",
  basketball: "🏀",
  soccer: "⚽",
  badminton: "🏸",
  tennis: "🎾",
  golf: "⛳",
  other: "🏆",
};

/**
 * Hook: fetch real participant count for a single event.
 * Uses limit=1 — we only need meta.total, not the actual list.
 */
function useParticipantCount(eventId) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    eventsApi
      .getParticipants(eventId, { limit: 1 })
      .then((res) => {
        if (cancelled) return;
        // API returns { data: [...], meta: { total } } or just an array
        const total =
          res?.meta?.total ??
          res?.total ??
          (Array.isArray(res) ? res.length : null);
        setCount(total);
      })
      .catch(() => setCount(null));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return count;
}

/* ── single row ───────────────────────────────── */
function EventRow({ ev, onRefresh }) {
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const count = useParticipantCount(ev.id);

  const handleDelete = async () => {
    try {
      await eventsApi.delete(ev.id);
    } catch {
    } finally {
      setConfirm(false);
      onRefresh();
    }
  };

  return (
    <>
      <tr>
        {/* Event title + description */}
        <td>
          <div className="cell-primary">{ev.title}</div>
          {ev.body && (
            <div className="cell-muted">
              {ev.body.length > 80 ? ev.body.slice(0, 80) + "…" : ev.body}
            </div>
          )}
        </td>

        {/* Start time */}
        <td style={{ whiteSpace: "nowrap", fontSize: "var(--text-xs)" }}>
          {fmt(ev.start_time)}
        </td>

        {/* Sport type */}
        <td>
          {ev.type && (
            <Badge variant="neutral">
              {SPORT_EMOJI[ev.type] ?? ""} {ev.type}
            </Badge>
          )}
        </td>

        {/* Distance */}
        <td
          style={{
            fontSize: "var(--text-sm)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {ev.distance_m ? `${(ev.distance_m / 1000).toFixed(1)} km` : "—"}
        </td>

        {/* Participants — real count from API */}
        <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
          {count === null ? (
            <span
              style={{
                color: "var(--color-text-faint)",
                fontSize: "var(--text-xs)",
              }}
            >
              …
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "var(--text-sm)",
              }}
            >
              <Icon name="users" size={12} />
              {count}
            </span>
          )}
        </td>

        {/* Actions */}
        <td>
          <div
            style={{
              display: "flex",
              gap: "var(--space-1)",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${ev.title}`}
              title="Edit event"
            >
              <Icon name="edit" size={13} />
            </button>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => setConfirm(true)}
              aria-label={`Delete ${ev.title}`}
              title="Delete event"
            >
              <Icon name="trash" size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* Edit drawer */}
      <EditDrawer
        open={editing}
        onClose={() => setEditing(false)}
        title={`Edit — ${ev.title}`}
      >
        <EventForm
          initial={ev}
          onCreated={() => {
            setEditing(false);
            onRefresh();
          }}
          editMode
        />
      </EditDrawer>

      {/* Delete confirm */}
      {confirm && (
        <ConfirmDialog
          title="Delete event"
          message={`"${ev.title}" will be permanently deleted.`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirm(false)}
        />
      )}
    </>
  );
}

/* ── table ────────────────────────────────────── */
export function EventsTable({ items, onRefresh }) {
  if (!items.length) {
    return (
      <div className="card">
        <div className="empty-state">
          <Icon name="calendar" size={32} />
          <h3>No events scheduled</h3>
          <p>Create your first event using the form.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Starts</th>
            <th>Type</th>
            <th>Distance</th>
            <th style={{ textAlign: "center" }}>Participants</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((ev) => (
            <EventRow key={ev.id} ev={ev} onRefresh={onRefresh} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
