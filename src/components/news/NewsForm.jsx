import { useState } from "react";
import { newsApi } from "../../api";
import { Icon } from "../ui/Icons";
import { Alert } from "../ui/Alert";

const EMPTY = { title: "", body: "" };

export function NewsForm({ onCreated }) {
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
      await newsApi.create({
        title: form.title.trim(),
        body: form.body.trim(),
        is_published: false,
      });
      setForm(EMPTY);
      setSuccess(
        "Draft created. You can now add a photo from the article list.",
      );
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div
        className="section-header"
        style={{ marginBottom: "var(--space-4)" }}
      >
        <div>
          <p className="kicker">Create</p>
          <h2>New article</h2>
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
          <label className="form-label" htmlFor="news-title">
            Title
          </label>
          <input
            id="news-title"
            name="title"
            className="form-input"
            placeholder="Campus trail update…"
            value={form.title}
            onChange={set}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="news-body">
            Body
          </label>
          <textarea
            id="news-body"
            name="body"
            className="form-textarea"
            placeholder="Write the content that users will see…"
            rows={8}
            value={form.body}
            onChange={set}
            required
          />
        </div>

        <div className="news-form-tip">
          <Icon name="eye" size={13} />
          Photos can be uploaded after saving the draft.
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Icon name="plus" size={15} />
            {loading ? "Saving…" : "Save as draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
