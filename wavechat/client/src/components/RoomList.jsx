function RoomList({ rooms, activeRoom, onRoomSelect }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Rooms
      </h2>
      <div className="space-y-2">
        {rooms.map((room) => {
          const isActive = room === activeRoom;

          return (
            <button
              key={room}
              type="button"
              onClick={() => onRoomSelect(room)}
              className={`w-full rounded-2xl px-4 py-3 text-left font-medium transition ${
                isActive
                  ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/40"
                  : "bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              # {room}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default RoomList;
