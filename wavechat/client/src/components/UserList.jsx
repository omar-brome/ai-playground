function UserList({ users, activeRoom }) {
  return (
    <section className="min-h-0 flex-1">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Online
        </h2>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
          {users.length}
        </span>
      </div>

      <div className="mb-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-500">
        In #{activeRoom}
      </div>

      <div className="space-y-2 overflow-y-auto pr-1">
        {users.length === 0 ? (
          <p className="rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-500">
            No one else is here yet.
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-2xl bg-slate-950/60 px-3 py-2"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="truncate text-sm font-medium text-slate-200">{user.username}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default UserList;
