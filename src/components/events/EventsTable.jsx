import { useState } from "react";
import { eventsApi } from "../../api";
import { Badge } from "../ui/Badge";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Icon } from "../ui/Icons";

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

export function EventsTable({ items, onRefresh }) {
  const [confirm, setConfirm] = useState(null);

  const handleDelete = async () => {
    try {
      await eventsApi.delete(confirm.id);
    } catch {
    } finally {
      setConfirm(null);
      onRefresh();
    }
  };

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
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Starts</th>
              <th>Type</th>
              <th>Distance</th>
              <th>Participants</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((ev) => (
              <tr key={ev.id}>
                <td>
                  <div className="cell-primary">{ev.title}</div>
                  {ev.body && (
                    <div className="cell-muted">
                      {ev.body.length > 80
                        ? ev.body.slice(0, 80) + "…"
                        : ev.body}
                    </div>
                  )}
                </td>
                <td
                  style={{ whiteSpace: "nowrap", fontSize: "var(--text-xs)" }}
                >
                  {fmt(ev.start_time)}
                </td>
                <td>
                  {ev.type && (
                    <Badge variant="neutral">
                      {SPORT_EMOJI[ev.type] ?? ""} {ev.type}
                    </Badge>
                  )}
                </td>
                <td style={{ fontSize: "var(--text-sm)" }}>
                  {ev.distance_m
                    ? `${(ev.distance_m / 1000).toFixed(1)} km`
                    : "—"}
                </td>
                <td style={{ fontSize: "var(--text-sm)", textAlign: "center" }}>
                  {ev.participantcount ?? 0}
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setConfirm({ id: ev.id, title: ev.title })}
                    aria-label={`Delete ${ev.title}`}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirm && (
        <ConfirmDialog
          title="Delete event"
          message={`"${confirm.title}" will be permanently deleted.`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
