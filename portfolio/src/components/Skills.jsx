import { motion } from "framer-motion";
import { FaCode, FaDatabase, FaLinux, FaReact, FaRobot, FaTools } from "react-icons/fa";

const skillGroups = [
  {
    title: "Systems & Desktop",
    icon: FaLinux,
    skills: ["C++", "Qt 5 & 6", "Linux", "CMake", "QMake", "Perforce P4V"],
  },
  {
    title: "Web & Frontend",
    icon: FaReact,
    skills: ["React", "JavaScript", "HTML5", "CSS3", "Tailwind", "Bootstrap", "jQuery", "AngularJS"],
  },
  {
    title: "Backend & DB",
    icon: FaDatabase,
    skills: ["Node.js", "Express", "Java", "PHP", "PostgreSQL", "MySQL"],
  },
  {
    title: "AI & Dev Tools",
    icon: FaRobot,
    skills: ["Cursor", "GPT-4o", "GitHub Copilot", "VS Code", "Android Studio", "Photoshop"],
  },
  {
    title: "Languages",
    icon: FaCode,
    skills: ["Python", "C#", "Swift", "TCL", "Bash", "XML"],
  },
  {
    title: "Workflow",
    icon: FaTools,
    skills: ["Debugging", "Runtime Optimization", "Automation", "Documentation", "Mentoring"],
  },
];

function Skills() {
  return (
    <section id="skills" className="section-shell">
      <p className="section-label">// 03 skills</p>
      <h2 className="section-title">What I Work With</h2>
      <p className="section-copy">
        A practical mix of systems programming, cross-platform desktop engineering, full-stack web tooling,
        AI-assisted workflows, and product-oriented implementation.
      </p>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {skillGroups.map((group) => {
          const Icon = group.icon;

          return (
            <motion.article
              key={group.title}
              variants={{
                hidden: { opacity: 0, y: 28 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              className="glass-card rounded-3xl p-6"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-300">
                  <Icon />
                </div>
                <h3 className="text-lg font-bold">{group.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span key={skill} className="skill-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}

export default Skills;
