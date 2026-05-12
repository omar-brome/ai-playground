import About from "./components/About.jsx";
import CompetitiveProgramming from "./components/CompetitiveProgramming.jsx";
import Contact from "./components/Contact.jsx";
import Experience from "./components/Experience.jsx";
import Footer from "./components/Footer.jsx";
import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import Projects from "./components/Projects.jsx";
import Skills from "./components/Skills.jsx";

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <CompetitiveProgramming />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default App;
