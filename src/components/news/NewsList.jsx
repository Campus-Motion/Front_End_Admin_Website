import { useState } from "react";
import { newsApi } from "../../api";
import { Badge } from "../ui/Badge";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EditDrawer } from "../ui/EditDrawer";
import { Icon } from "../ui/Icons";
import { PhotoUploader } from "./PhotoUploader";
import { NewsEditForm } from "./NewsEditForm";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const toAbsolute = (url) =>
  !url || url.startsWith("http") ? url : `${BASE_URL}${url}`;

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
  const [confirm, setConfirm] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [photoOpen, setPhotoOpen] = useState(null); // item.id
  const [editOpen, setEditOpen] = useState(null); // full item object
  const [photos, setPhotos] = useState({});

  const handleToggle = async (item) => {
    setToggling(item.id);
    try {
      await newsApi.update(item.id, { ispublished: !item.ispublished });
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

  return (
    <>
      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        {items.map((item) => {
          const currentPhoto = toAbsolute(
            photos[item.id] ?? item.photo_url ?? null,
          );
          const isPhotoOpen = photoOpen === item.id;

          return (
            <article key={item.id} className="news-card card">
              {/* Cover photo */}
              {currentPhoto && (
                <div className="news-card-cover">
                  <img src={currentPhoto} alt="" loading="lazy" />
                </div>
              )}

              {/* Header */}
              <div className="news-card-top">
                <div className="news-card-meta">
                  <Badge variant={item.ispublished ? "published" : "draft"}>
                    {item.ispublished ? "Published" : "Draft"}
                  </Badge>
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-faint)",
                    }}
                  >
                    {fmt(item.createdat)}
                  </span>
                </div>
                <h3 className="news-card-title">{item.title}</h3>
                <p className="news-card-body">{excerpt(item.body)}</p>
              </div>

              {/* Photo upload panel */}
              {isPhotoOpen && (
                <div className="news-card-photo-panel">
                  <PhotoUploader
                    articleId={item.id}
                    currentUrl={currentPhoto}
                    onUploaded={(url) => handleUploaded(item.id, url)}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="news-card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleToggle(item)}
                  disabled={toggling === item.id}
                >
                  <Icon name={item.ispublished ? "eyeOff" : "eye"} size={13} />
                  {item.ispublished ? "Unpublish" : "Publish"}
                </button>

                {/* Edit button → opens drawer */}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditOpen(item)}
                >
                  <Icon name="edit" size={13} />
                  Edit
                </button>

                {/* Photo button */}
                <button
                  className={`btn btn-sm ${isPhotoOpen ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setPhotoOpen(isPhotoOpen ? null : item.id)}
                  aria-expanded={isPhotoOpen}
                >
                  <Icon name="image" size={13} />
                  {currentPhoto
                    ? isPhotoOpen
                      ? "Close photo"
                      : "Photo"
                    : isPhotoOpen
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

      {/* News edit drawer */}
      <EditDrawer
        open={!!editOpen}
        onClose={() => setEditOpen(null)}
        title={editOpen ? `Edit — ${editOpen.title}` : "Edit article"}
      >
        {editOpen && (
          <NewsEditForm
            item={editOpen}
            onSaved={() => {
              setEditOpen(null);
              onRefresh();
            }}
          />
        )}
      </EditDrawer>

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
