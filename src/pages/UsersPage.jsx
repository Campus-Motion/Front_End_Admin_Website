import { useEffect, useState } from "react";
import { adminApi } from "../api";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Alert } from "../components/ui/Alert";
import { Icon } from "../components/ui/Icons";

function listFrom(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

const ROLE_BADGE = { admin: "danger", moderator: "primary", user: "neutral" };
const ROLES = ["user", "moderator", "admin"];

function fmt(v) {
  return v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
}

export function UsersPage({ onCountChange, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [roleEdit, setRoleEdit] = useState(null); // { id, role }
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      const list = listFrom(res);
      setUsers(list);
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

  const handleRoleChange = async (id, role) => {
    setError("");
    try {
      await adminApi.updateRole(id, role);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteUser(confirm.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirm(null);
    }
  };

  const visible = search
    ? users.filter(
        (u) =>
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">{users.length} registered accounts</p>
      </div>

      <Alert variant="error" message={error} onDismiss={() => setError("")} />

      <div className="card" style={{ marginTop: error ? "var(--space-4)" : 0 }}>
        <div className="section-header">
          <div>
            <p className="kicker">Manage</p>
            <h2>All users</h2>
          </div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "var(--space-10)", minWidth: 200 }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "var(--space-3)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-faint)",
                }}
              >
                <Icon name="search" size={15} />
              </span>
            </div>
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
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Change role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-primary">{u.username}</div>
                      <div className="cell-muted">{u.email}</div>
                    </td>
                    <td>
                      <Badge variant={ROLE_BADGE[u.role] ?? "neutral"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {fmt(u.created_at)}
                    </td>
                    <td>
                      {u.id !== currentUser?.id && (
                        <select
                          className="form-select"
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                          style={{
                            fontSize: "var(--text-xs)",
                            minHeight: 32,
                            padding: "4px 32px 4px 10px",
                          }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {u.id !== currentUser?.id && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            setConfirm({ id: u.id, username: u.username })
                          }
                          aria-label={`Delete ${u.username}`}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                        padding: "var(--space-8)",
                      }}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Delete user"
          message={`@${confirm.username} and all their data will be permanently deleted.`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
