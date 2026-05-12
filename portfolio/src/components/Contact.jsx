import { motion } from "framer-motion";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FiMail, FiPhone } from "react-icons/fi";

const contacts = [
  {
    label: "Email",
    value: "omar.brome@gmail.com",
    href: "mailto:omar.brome@gmail.com",
    icon: FiMail,
  },
  {
    label: "GitHub",
    value: "github.com/omar-brome",
    href: "https://github.com/omar-brome",
    icon: FaGithub,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/omar-brome",
    href: "https://www.linkedin.com/in/omar-brome",
    icon: FaLinkedin,
  },
  {
    label: "Phone",
    value: "+961 81017575",
    href: "tel:+96181017575",
    icon: FiPhone,
  },
];

function Contact() {
  return (
    <section id="contact" className="section-shell">
      <p className="section-label">// 07 contact</p>
      <div className="glass-card rounded-[2rem] p-6 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="section-title">Let&apos;s build something together</h2>
            <p className="section-copy">
              Open to software engineering work, collaboration, and projects around desktop systems,
              developer tools, real-time apps, and AI-assisted workflows.
            </p>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {contacts.map((contact) => {
              const Icon = contact.icon;

              return (
                <motion.a
                  key={contact.label}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                  }}
                  href={contact.href}
                  target={contact.href.startsWith("http") ? "_blank" : undefined}
                  rel={contact.href.startsWith("http") ? "noreferrer" : undefined}
                  className="rounded-3xl border border-white/10 bg-[#0a0a0f]/55 p-5 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-2xl hover:shadow-cyan-950/20"
                >
                  <Icon className="text-2xl text-cyan-300" />
                  <p className="mt-4 text-sm text-slate-500">{contact.label}</p>
                  <p className="mt-1 break-words font-semibold text-white">{contact.value}</p>
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
