import { useState } from "react";
import { newsApi } from "../../api";
import { Alert } from "../ui/Alert";
import { Icon } from "../ui/Icons";

/**
 * NewsEditForm — used inside EditDrawer.
 * Receives the full news item as `item`, calls PUT /news/:id on save.
 */
export function NewsEditForm({ item, onSaved }) {
  const [form, setForm] = useState({
    title: item.title ?? "",
    body: item.body ?? "",
  });
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
      await newsApi.update(item.id, {
        title: form.title.trim(),
        body: form.body.trim(),
      });
      setSuccess("Article updated.");
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ display: "grid", gap: "var(--space-4)" }}
    >
      <Alert variant="error" message={error} onDismiss={() => setError("")} />
      <Alert
        variant="success"
        message={success}
        onDismiss={() => setSuccess("")}
      />

      <div className="form-field">
        <label className="form-label" htmlFor="edit-news-title">
          Title
        </label>
        <input
          id="edit-news-title"
          name="title"
          className="form-input"
          value={form.title}
          onChange={set}
          required
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="edit-news-body">
          Body
        </label>
        <textarea
          id="edit-news-body"
          name="body"
          className="form-textarea"
          rows={10}
          value={form.body}
          onChange={set}
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <Icon name="check" size={15} />
          {loading ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
