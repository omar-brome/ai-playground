import { motion } from "framer-motion";

const roles = [
  {
    company: "SiliconCedars / Synopsys",
    title: "C++ Software Developer",
    period: "May 2022 - Present",
    location: "Antelias, Beirut",
    bullets: [
      "Developing and maintaining large-scale Qt 5/6 desktop applications in C++ on Linux.",
      "Leading migration from Qt 5.15 to Qt 6, resolving breaking API changes across a complex multi-module codebase.",
      "Managing source trees with Perforce Helix Core: reconcile, shelving, changelists, and large-scale integrations around 680k file operations.",
      "Building WebEngine components and shared library architectures.",
      "Debugging with GDB and resolving linker issues under lld and --no-allow-shlib-undefined.",
    ],
  },
  {
    company: "Neumann",
    title: "Software Developer",
    period: "Sep 2017 - May 2022",
    location: "Saida",
    bullets: [
      "Built and maintained full-stack web features using Java, JavaScript, and MySQL.",
      "Optimized JavaScript memory usage and runtime performance.",
      "Upgraded jQuery and jQueryUI to eliminate security vulnerabilities.",
      "Integrated and maintained AutolinkerJS, DataTables, and DataTables AltEditor.",
      "Supervised web development interns on-site and remotely.",
      "Led a part-time front-end developer through task assignment and progress review.",
    ],
  },
  {
    company: "Vanrise Solutions",
    title: "Web Developer Intern",
    period: "2017",
    location: "Hazmieh, Beirut",
    bullets: ["Gained professional web development experience through AngularJS-focused implementation and team collaboration."],
  },
  {
    company: "IDS (Integrated Digital Systems)",
    title: "Software Developer Intern",
    period: "Summer 2016",
    location: "BAU Debbieh Branch",
    bullets: ["Completed a university-based training program covering software development fundamentals and documentation."],
  },
];

function Experience() {
  return (
    <section id="experience" className="section-shell">
      <p className="section-label">// 04 experience</p>
      <h2 className="section-title">Professional timeline</h2>
      <p className="section-copy">
        From full-stack web systems to modern C++/Qt desktop engineering, the through-line is debugging,
        performance, reliability, and shipping useful tools.
      </p>

      <div className="relative mt-12">
        <div className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-cyan-300 via-indigo-400 to-transparent md:left-6" />
        <div className="space-y-6">
          {roles.map((role, index) => (
            <motion.article
              key={`${role.company}-${role.period}`}
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="relative pl-12 md:pl-16"
            >
              <span className="absolute left-0 top-7 h-8 w-8 rounded-full border border-cyan-300/40 bg-[#0a0a0f] shadow-[0_0_24px_rgba(34,211,238,0.28)] md:left-2" />
              <div className="glass-card rounded-3xl p-6">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{role.company}</h3>
                    <p className="mt-1 text-cyan-300">{role.title}</p>
                  </div>
                  <p className="font-mono text-sm text-slate-500">
                    {role.period} | {role.location}
                  </p>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-400">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Experience;
