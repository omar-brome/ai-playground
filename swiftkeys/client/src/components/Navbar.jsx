import SettingsBar from "./SettingsBar.jsx";

function Navbar({ settings, onSettingsChange, username, onUsernameClick }) {
  return (
    <header className="mx-auto flex w-full max-w-[980px] flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold text-[#e2b714]">swiftkeys</h1>
          <p className="text-sm text-neutral-600">typing speed test</p>
        </div>
        <button
          type="button"
          onClick={onUsernameClick}
          className="rounded-2xl bg-[#1a1a1a] px-4 py-2 font-mono text-sm text-neutral-300 transition hover:text-[#e2b714]"
        >
          {username || "set username"}
        </button>
      </div>
      <SettingsBar settings={settings} onChange={onSettingsChange} />
    </header>
  );
}

export default Navbar;
