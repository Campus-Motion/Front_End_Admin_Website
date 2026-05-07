import { useState } from "react";
import { newsApi } from "../../api";
import { Badge } from "../ui/Badge";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Icon } from "../ui/Icons";
import { PhotoUploader } from "./PhotoUploader";

function fmt(v) {
  return v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
}
function excerpt(s, max = 160) {
  return s && s.length > max ? s.slice(0, max) + "…" : (s ?? "");
}

export function NewsList({ items, onRefresh }) {
  const [confirm, setConfirm] = useState(null); // { id, title }
  const [toggling, setToggling] = useState(null); // item.id currently toggling
  const [expanded, setExpanded] = useState(null); // item.id with photo panel open
  // Track current photourl per-item so preview updates without a full refresh
  const [photos, setPhotos] = useState({});

  const handleToggle = async (item) => {
    setToggling(item.id);
    try {
      await newsApi.update(item.id, { is_published: !item.is_published });
    } catch {
    } finally {
      setToggling(null);
      onRefresh();
    }
  };

  const handleDelete = async () => {
    try {
      await newsApi.delete(confirm.id);
    } catch {
    } finally {
      setConfirm(null);
      onRefresh();
    }
  };

  const handleUploaded = (id, photo_url) => {
    setPhotos((p) => ({ ...p, [id]: photo_url }));
  };

  if (!items.length) {
    return (
      <div className="card">
        <div className="empty-state">
          <Icon name="newspaper" size={32} />
          <h3>No articles yet</h3>
          <p>Created drafts and published articles will appear here.</p>
        </div>
      </div>
    );
  }
  const BASE_URL = import.meta.env.VITE_API_URL;

  function toAbsolute(url) {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
  }

  return (
    <>
      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {items.map((item) => {
          const currentPhoto =
            toAbsolute(photos[item.id]) ?? toAbsolute(item.photo_url) ?? null;
          const isExpanded = expanded === item.id;

          return (
            <article key={item.id} className="news-card card">
              {/* ── cover photo thumbnail ── */}
              {currentPhoto && (
                <div className="news-card-cover">
                  <img src={currentPhoto} alt="" loading="lazy" />
                </div>
              )}

              {/* ── header ── */}
              <div className="news-card-top">
                <div className="news-card-meta">
                  <Badge variant={item.is_published ? "published" : "draft"}>
                    {item.is_published ? "Published" : "Draft"}
                  </Badge>
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-faint)",
                    }}
                  >
                    {fmt(item.created_at)}
                  </span>
                </div>
                <h3 className="news-card-title">{item.title}</h3>
                <p className="news-card-body">{excerpt(item.body)}</p>
              </div>

              {/* ── photo upload panel (collapsible) ── */}
              {isExpanded && (
                <div className="news-card-photo-panel">
                  <PhotoUploader
                    articleId={item.id}
                    currentUrl={currentPhoto}
                    onUploaded={(url) => handleUploaded(item.id, url)}
                  />
                </div>
              )}

              {/* ── actions ── */}
              <div className="news-card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleToggle(item)}
                  disabled={toggling === item.id}
                >
                  <Icon
                    name={item.is_published ? "eye-off" : "eye"}
                    size={13}
                  />
                  {item.is_published ? "Unpublish" : "Publish"}
                </button>

                <button
                  className={`btn btn-sm ${isExpanded ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                  aria-expanded={isExpanded}
                  aria-label="Toggle photo upload"
                >
                  <Icon name="edit" size={13} />
                  {currentPhoto
                    ? isExpanded
                      ? "Close photo"
                      : "Change photo"
                    : isExpanded
                      ? "Close"
                      : "Add photo"}
                </button>

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirm({ id: item.id, title: item.title })}
                  style={{ marginLeft: "auto" }}
                >
                  <Icon name="trash" size={13} />
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Delete article"
          message={`"${confirm.title}" will be permanently deleted.`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
