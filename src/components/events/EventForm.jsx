import { useState } from "react";
import { eventsApi } from "../../api";
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

const EMPTY = {
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

export function EventForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await eventsApi.create({
        title: form.title.trim(),
        body: form.body.trim(),
        start_time: new Date(form.start_time).toISOString(),
        type: form.type || undefined,
        strava_url: form.strava_url.trim() || undefined,
        end_time: form.end_time
          ? new Date(form.end_time).toISOString()
          : undefined,
        distance_m: form.distance_m ? Number(form.distance_m) : undefined,
        start_location_id: form.start_location_id
          ? Number(form.start_location_id)
          : undefined,
        end_location_id: form.end_location_id
          ? Number(form.end_location_id)
          : undefined,
      });
      setForm(EMPTY);
      setSuccess("Event created.");
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const labelFor = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="card">
      <div
        className="section-header"
        style={{ marginBottom: "var(--space-4)" }}
      >
        <div>
          <p className="kicker">Create</p>
          <h2>New event</h2>
        </div>
      </div>

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
          <label className="form-label" htmlFor="ev-title">
            Title
          </label>
          <input
            id="ev-title"
            name="title"
            className="form-input"
            placeholder="Campus 10K"
            value={form.title}
            onChange={set}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="ev-body">
            Description
          </label>
          <textarea
            id="ev-body"
            name="body"
            className="form-textarea"
            placeholder="Event details, route, what to bring…"
            rows={5}
            value={form.body}
            onChange={set}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="ev-type">
            Sport type
          </label>
          <select
            id="ev-type"
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
            <label className="form-label" htmlFor="ev-start">
              Start time
            </label>
            <input
              id="ev-start"
              name="start_time"
              type="datetime-local"
              className="form-input"
              value={form.start_time}
              onChange={set}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="ev-end">
              End time <span className="optional">(optional)</span>
            </label>
            <input
              id="ev-end"
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
            <label className="form-label" htmlFor="ev-dist">
              Distance (m) <span className="optional">(optional)</span>
            </label>
            <input
              id="ev-dist"
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
            <label className="form-label" htmlFor="ev-strava">
              Strava URL <span className="optional">(optional)</span>
            </label>
            <input
              id="ev-strava"
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
            <label className="form-label" htmlFor="ev-sloc">
              Start location ID <span className="optional">(optional)</span>
            </label>
            <input
              id="ev-sloc"
              name="start_location_id"
              type="number"
              min="1"
              className="form-input"
              placeholder="1"
              value={form.start_location_id}
              onChange={set}
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="ev-eloc">
              End location ID <span className="optional">(optional)</span>
            </label>
            <input
              id="ev-eloc"
              name="end_location_id"
              type="number"
              min="1"
              className="form-input"
              placeholder="2"
              value={form.end_location_id}
              onChange={set}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Icon name="plus" size={15} />
            {loading ? "Creating…" : "Create event"}
          </button>
        </div>
      </form>
    </div>
  );
}
