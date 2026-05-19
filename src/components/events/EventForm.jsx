import { useEffect, useState } from "react";
import { eventsApi, locationsApi } from "../../api";
import { Alert } from "../ui/Alert";
import { Icon } from "../ui/Icons";

const SPORT_TYPES = [
  "run",
  "walk",
  "bike",
  "hike",
  "swim",
  "triathlon",
  "fitnesstrail",
  "climbing",
  "volleyball",
  "basketball",
  "soccer",
  "badminton",
  "tennis",
  "golf",
  "other",
];

/** Convert an ISO datetime string to the value needed by datetime-local inputs */
function toLocalInput(iso) {
  if (!iso) return "";
  // "2026-05-10T09:00:00.000Z" → "2026-05-10T09:00" (browser local)
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromInitial(ev) {
  if (!ev)
    return {
      title: "",
      body: "",
      type: "",
      start_time: "",
      end_time: "",
      strava_url: "",
      distance_m: "",
      start_location_id: "",
      end_location_id: "",
    };
  return {
    title: ev.title ?? "",
    body: ev.body ?? "",
    type: ev.type ?? "",
    start_time: toLocalInput(ev.start_time),
    end_time: toLocalInput(ev.end_time),
    strava_url: ev.strava_url ?? "",
    distance_m: ev.distance_m != null ? String(ev.distance_m) : "",
    start_location_id:
      ev.start_location_id != null ? String(ev.start_location_id) : "",
    end_location_id:
      ev.end_location_id != null ? String(ev.end_location_id) : "",
  };
}

/**
 * EventForm
 *
 * Props:
 *   onCreated  fn       — called after successful create or update
 *   initial    object   — if provided, pre-fills the form (edit mode)
 *   editMode   boolean  — if true, uses PUT instead of POST
 */
export function EventForm({ onCreated, initial, editMode = false }) {
  const [form, setForm] = useState(() => fromInitial(initial));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadLocations = async () => {
      setLocationsLoading(true);
      try {
        const res = await locationsApi.getAll({ limit: 100 });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];
        if (!cancelled) setLocations(list);
      } catch {
        if (!cancelled) setLocations([]);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    };

    loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const buildPayload = () => ({
    title: form.title.trim(),
    body: form.body.trim() || undefined,
    start_time: new Date(form.start_time).toISOString(),
    type: form.type || undefined,
    strava_url: form.strava_url || undefined,
    end_time: form.end_time ? new Date(form.end_time).toISOString() : undefined,
    distance_m: form.distance_m ? Number(form.distance_m) : undefined,
    start_location_id: form.start_location_id
      ? Number(form.start_location_id)
      : undefined,
    end_location_id: form.end_location_id
      ? Number(form.end_location_id)
      : undefined,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (editMode && initial?.id) {
        await eventsApi.update(initial.id, buildPayload());
        setSuccess("Event updated.");
      } else {
        await eventsApi.create(buildPayload());
        setForm(fromInitial(null));
        setSuccess("Event created.");
      }
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={editMode ? "" : "card"}>
      {!editMode && (
        <div
          className="section-header"
          style={{ marginBottom: "var(--space-4)" }}
        >
          <div>
            <p className="kicker">Create</p>
            <h2>New event</h2>
          </div>
        </div>
      )}

      <Alert variant="error" message={error} onDismiss={() => setError("")} />
      <Alert
        variant="success"
        message={success}
        onDismiss={() => setSuccess("")}
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          display: "grid",
          gap: "var(--space-4)",
          marginTop: error || success ? "var(--space-4)" : 0,
        }}
      >
        <div className="form-field">
          <label className="form-label" htmlFor={`ev-title-${editMode}`}>
            Title
          </label>
          <input
            id={`ev-title-${editMode}`}
            name="title"
            className="form-input"
            placeholder="Campus 10K"
            value={form.title}
            onChange={set}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor={`ev-body-${editMode}`}>
            Description <span className="optional">(optional)</span>
          </label>
          <textarea
            id={`ev-body-${editMode}`}
            name="body"
            className="form-textarea"
            placeholder="Event details, route, what to bring…"
            rows={4}
            value={form.body}
            onChange={set}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor={`ev-type-${editMode}`}>
            Sport type
          </label>
          <select
            id={`ev-type-${editMode}`}
            name="type"
            className="form-select"
            value={form.type}
            onChange={set}
            required
          >
            <option value="" disabled>
              Select a sport…
            </option>
            {SPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor={`ev-start-${editMode}`}>
              Start time
            </label>
            <input
              id={`ev-start-${editMode}`}
              name="start_time"
              type="datetime-local"
              className="form-input"
              value={form.start_time}
              onChange={set}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor={`ev-end-${editMode}`}>
              End time <span className="optional">(optional)</span>
            </label>
            <input
              id={`ev-end-${editMode}`}
              name="end_time"
              type="datetime-local"
              className="form-input"
              value={form.end_time}
              onChange={set}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor={`ev-dist-${editMode}`}>
              Distance (m) <span className="optional">(optional)</span>
            </label>
            <input
              id={`ev-dist-${editMode}`}
              name="distance_m"
              type="number"
              min="0"
              className="form-input"
              placeholder="5000"
              value={form.distance_m}
              onChange={set}
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor={`ev-strava-${editMode}`}>
              Strava URL <span className="optional">(optional)</span>
            </label>
            <input
              id={`ev-strava-${editMode}`}
              name="strava_url"
              className="form-input"
              placeholder="https://strava.com/…"
              value={form.strava_url}
              onChange={set}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor={`ev-sloc-${editMode}`}>
              Start location <span className="optional">(optional)</span>
            </label>
            <select
              id={`ev-sloc-${editMode}`}
              name="startlocationid"
              className="form-select"
              value={form.startlocationid}
              onChange={set}
              disabled={locationsLoading}
            >
              <option value="">
                {locationsLoading
                  ? "Loading locations…"
                  : "Select a start location…"}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={String(loc.id)}>
                  {loc.label
                    ? `${loc.label} (#${loc.id})`
                    : `Location #${loc.id}`}{" "}
                  — {loc.latitude}, {loc.longitude}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`ev-eloc-${editMode}`}>
              End location <span className="optional">(optional)</span>
            </label>
            <select
              id={`ev-eloc-${editMode}`}
              name="endlocationid"
              className="form-select"
              value={form.endlocationid}
              onChange={set}
              disabled={locationsLoading}
            >
              <option value="">
                {locationsLoading
                  ? "Loading locations…"
                  : "Select an end location…"}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={String(loc.id)}>
                  {loc.label
                    ? `${loc.label} (#${loc.id})`
                    : `Location #${loc.id}`}{" "}
                  — {loc.latitude}, {loc.longitude}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Icon name={editMode ? "check" : "plus"} size={15} />
            {loading
              ? editMode
                ? "Saving…"
                : "Creating…"
              : editMode
                ? "Save changes"
                : "Create event"}
          </button>
        </div>
      </form>
    </div>
  );
}
