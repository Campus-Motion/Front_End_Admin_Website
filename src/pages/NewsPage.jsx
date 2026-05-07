import { useEffect, useState, useMemo } from "react";
import { newsApi } from "../api";
import { NewsForm } from "../components/news/NewsForm";
import { NewsList } from "../components/news/NewsList";
import { Spinner } from "../components/ui/Spinner";
import { Icon } from "../components/ui/Icons";
import "../components/news/NewsPage.css";

function listFrom(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export function NewsPage({ onCountChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | published | draft

  const load = async () => {
    setLoading(true);
    try {
      const res = await newsApi.getAll();
      const sorted = listFrom(res).sort(
        (a, b) => new Date(b.createdat) - new Date(a.createdat),
      );
      setItems(sorted);
      onCountChange?.(sorted.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (filter === "published") return items.filter((i) => i.is_published);
    if (filter === "draft") return items.filter((i) => !i.is_published);
    return items;
  }, [items, filter]);

  const published = items.filter((i) => i.is_published).length;
  const drafts = items.filter((i) => !i.is_published).length;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">News</h1>
        <p className="page-subtitle">
          {published} published · {drafts} draft{drafts !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="panel-2col">
        <NewsForm onCreated={load} />

        <section>
          <div className="section-header">
            <div>
              <p className="kicker">Manage</p>
              <h2>All articles</h2>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {["all", "published", "draft"].map((f) => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={load}
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
            <NewsList items={visible} onRefresh={load} />
          )}
        </section>
      </div>
    </>
  );
}
