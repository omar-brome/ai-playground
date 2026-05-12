import { motion } from "framer-motion";
import { FiArrowUpRight, FiGithub } from "react-icons/fi";

const projects = [
  {
    title: "AI Recruiting Assistant",
    tags: ["React", "Node.js", "GPT-4o", "RapidAPI"],
    description:
      "Full-stack AI recruiting tool inspired by askbond.ai. Scrapes LinkedIn profiles via RapidAPI, generates AI-powered candidate summaries using GPT-4o, and presents results through a clean React/Vite/Tailwind UI.",
    link: "https://github.com/omar-brome/ai-playground/tree/main/vscode_copilot_app_job_recruiter",
    accent: "from-indigo-400 to-cyan-300",
  },
  {
    title: "SyncRoom",
    tags: ["React", "Socket.io", "Node.js"],
    description:
      "Real-time chat app with room support, live presence indicators, typing detection, and system messages. Inspired by Discord and built to learn WebSockets deeply.",
    link: "https://github.com/omar-brome/ai-playground/tree/main/wavechat",
    accent: "from-cyan-300 to-emerald-300",
  },
  {
    title: "Portfolio Website",
    tags: ["React", "Tailwind", "Framer Motion"],
    description:
      "This site: a modern, responsive personal brand and CV replacement with scroll animations, glassmorphism cards, animated counters, and a downloadable CV.",
    link: "#hero",
    accent: "from-fuchsia-400 to-indigo-400",
    live: true,
  },
];

function Projects() {
  return (
    <section id="projects" className="section-shell">
      <p className="section-label">// 05 projects</p>
      <h2 className="section-title">Selected builds</h2>
      <p className="section-copy">
        A focused set of projects showing full-stack systems, real-time communication, AI integrations,
        and polished frontend implementation.
      </p>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="mt-10 grid gap-5 lg:grid-cols-3"
      >
        {projects.map((project) => (
          <motion.article
            key={project.title}
            variants={{
              hidden: { opacity: 0, y: 32 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
            whileHover={{ y: -6 }}
            className="glass-card group overflow-hidden rounded-3xl"
          >
            <div className={`h-1.5 bg-gradient-to-r ${project.accent}`} />
            <div className="flex h-full flex-col p-6">
              <div className="mb-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{project.title}</h3>
              <p className="mt-4 flex-1 text-sm leading-7 text-slate-400">{project.description}</p>
              <a
                href={project.link}
                target={project.live ? undefined : "_blank"}
                rel={project.live ? undefined : "noreferrer"}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition group-hover:text-white"
              >
                {project.live ? (
                  <>
                    Live <FiArrowUpRight />
                  </>
                ) : (
                  <>
                    <FiGithub /> GitHub
                  </>
                )}
              </a>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

export default Projects;
