function TypingIndicator({ typingUsers }) {
  if (typingUsers.length === 0) {
    return <div className="mb-2 h-5 text-sm text-slate-500" />;
  }

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.slice(0, 2).join(", ")} are typing...`;

  return <p className="mb-2 h-5 text-sm text-cyan-300">{label}</p>;
}

export default TypingIndicator;
