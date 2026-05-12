import RoomList from "./RoomList.jsx";
import UserList from "./UserList.jsx";

function Sidebar({ rooms, activeRoom, users, isConnected, username, onRoomSelect, onSignOut }) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-900/90 p-5 md:flex md:flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950">
            W
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Wavechat</h1>
            <p className="text-xs text-slate-400">Discord-lite rooms</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Signed in</p>
            <p className="font-semibold text-slate-100">{username}</p>
          </div>
          <span
            className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`}
            title={isConnected ? "Connected" : "Connecting"}
          />
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-3 w-full rounded-2xl border border-slate-800 px-4 py-2 text-sm font-medium text-slate-400 transition hover:border-rose-400/50 hover:bg-rose-400/10 hover:text-rose-200"
        >
          Sign out
        </button>
      </div>

      <RoomList rooms={rooms} activeRoom={activeRoom} onRoomSelect={onRoomSelect} />
      <UserList users={users} activeRoom={activeRoom} />
    </aside>
  );
}

export default Sidebar;
