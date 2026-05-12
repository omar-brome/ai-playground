const timedOptions = [15, 30, 60, 120];
const wordOptions = [10, 25, 50, 100];

function SelectButton({ isActive, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm transition ${
        isActive ? "bg-[#e2b714] text-[#0f0f0f]" : "bg-[#1a1a1a] text-neutral-400 hover:text-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

function SettingsBar({ settings, onChange }) {
  const durations = settings.mode === "timed" ? timedOptions : wordOptions;

  function updateSetting(key, value) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  function updateMode(mode) {
    onChange((current) => ({
      ...current,
      mode,
      duration: mode === "timed" ? 60 : 25,
    }));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-neutral-800 bg-[#141414]/80 p-2">
      {["easy", "medium", "hard"].map((difficulty) => (
        <SelectButton
          key={difficulty}
          isActive={settings.difficulty === difficulty}
          onClick={() => updateSetting("difficulty", difficulty)}
        >
          {difficulty}
        </SelectButton>
      ))}

      <span className="mx-1 hidden h-6 w-px bg-neutral-800 sm:block" />

      {["timed", "words"].map((mode) => (
        <SelectButton key={mode} isActive={settings.mode === mode} onClick={() => updateMode(mode)}>
          {mode}
        </SelectButton>
      ))}

      <span className="mx-1 hidden h-6 w-px bg-neutral-800 sm:block" />

      {durations.map((duration) => (
        <SelectButton
          key={duration}
          isActive={settings.duration === duration}
          onClick={() => updateSetting("duration", duration)}
        >
          {duration}{settings.mode === "timed" ? "s" : "w"}
        </SelectButton>
      ))}

      <span className="mx-1 hidden h-6 w-px bg-neutral-800 sm:block" />

      <SelectButton isActive={settings.punctuation} onClick={() => updateSetting("punctuation", !settings.punctuation)}>
        punctuation
      </SelectButton>
      <SelectButton isActive={settings.numbers} onClick={() => updateSetting("numbers", !settings.numbers)}>
        numbers
      </SelectButton>
    </div>
  );
}

export default SettingsBar;
