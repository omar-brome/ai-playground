import { useState } from "react";
import { motion } from "framer-motion";

function UsernameModal({ isOpen, onSave, onSkip }) {
  const [usernameInput, setUsernameInput] = useState("");

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const username = usernameInput.trim();

    if (username) {
      onSave(username.slice(0, 30));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[2rem] border border-neutral-800 bg-[#1a1a1a] p-6 shadow-2xl shadow-black/40"
      >
        <h2 className="font-mono text-2xl text-[#e2b714]">enter a username</h2>
        <p className="mt-2 text-neutral-500">You can test without one, but a username lets you save scores.</p>
        <input
          value={usernameInput}
          onChange={(event) => setUsernameInput(event.target.value)}
          className="mt-5 w-full rounded-2xl border border-neutral-800 bg-[#0f0f0f] px-4 py-3 font-mono text-neutral-100 outline-none focus:border-[#e2b714]"
          maxLength={30}
          placeholder="omar"
          autoFocus
        />
        <div className="mt-5 flex gap-3">
          <button type="submit" className="rounded-2xl bg-[#e2b714] px-4 py-3 font-semibold text-[#0f0f0f]">
            Save username
          </button>
          <button type="button" onClick={onSkip} className="rounded-2xl bg-[#111111] px-4 py-3 font-semibold text-neutral-400">
            Skip
          </button>
        </div>
      </motion.form>
    </div>
  );
}

export default UsernameModal;
