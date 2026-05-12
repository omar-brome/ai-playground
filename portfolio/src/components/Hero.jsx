import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FiArrowDown, FiDownload, FiMail } from "react-icons/fi";

const titles = [
  "C++ Software Developer",
  "Qt & Linux Specialist",
  "Full-Stack Builder",
  "AI Tools Enthusiast",
];

function Hero() {
  const [titleIndex, setTitleIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentTitle = titles[titleIndex];
    const isWordComplete = !isDeleting && visibleText === currentTitle;
    const isWordDeleted = isDeleting && visibleText === "";
    const delay = isWordComplete ? 1400 : isDeleting ? 45 : 75;

    const timeoutId = window.setTimeout(() => {
      if (isWordComplete) {
        setIsDeleting(true);
        return;
      }

      if (isWordDeleted) {
        setIsDeleting(false);
        setTitleIndex((current) => (current + 1) % titles.length);
        return;
      }

      setVisibleText((current) =>
        isDeleting ? currentTitle.slice(0, current.length - 1) : currentTitle.slice(0, current.length + 1),
      );
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [isDeleting, titleIndex, visibleText]);

  return (
    <section id="hero" className="relative flex min-h-screen items-center overflow-hidden px-4 pt-20">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -28, 20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 30, 0], y: [0, 24, -18, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[10%] top-[16%] h-80 w-80 rounded-full bg-cyan-400/16 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto w-[min(1120px,100%)]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl"
        >
          <p className="section-label">// 01 hero</p>
          <h1 className="text-[clamp(3rem,10vw,7.5rem)] font-black leading-[0.9] tracking-[-0.08em]">
            Hi, I&apos;m
            <span className="block bg-gradient-to-r from-white via-cyan-100 to-indigo-300 bg-clip-text text-transparent">
              Omar Brome
            </span>
          </h1>
          <div className="mt-8 h-10 font-mono text-xl text-cyan-300 md:text-2xl">
            {visibleText}
            <span className="ml-1 animate-pulse text-white">|</span>
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Lebanese software developer building C++/Qt desktop systems, Linux tooling, full-stack web apps,
            and AI-assisted products with clean architecture and sharp developer workflows.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="#projects"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-50 hover:shadow-2xl hover:shadow-cyan-500/20"
              style={{ color: "#0a0a0f" }}
            >
              View My Work <FiArrowDown />
            </a>
            <a
              href="/Omar_Brome_CV.pdf"
              download
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/10"
            >
              Download CV <FiDownload />
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <a className="rounded-full border border-white/10 bg-white/5 p-3 text-xl text-slate-300 transition hover:border-cyan-300/40 hover:text-white" href="https://github.com/omar-brome" target="_blank" rel="noreferrer" aria-label="GitHub">
              <FaGithub />
            </a>
            <a className="rounded-full border border-white/10 bg-white/5 p-3 text-xl text-slate-300 transition hover:border-cyan-300/40 hover:text-white" href="https://www.linkedin.com/in/omar-brome" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
            <a className="rounded-full border border-white/10 bg-white/5 p-3 text-xl text-slate-300 transition hover:border-cyan-300/40 hover:text-white" href="mailto:omar.brome@gmail.com" aria-label="Email">
              <FiMail />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
