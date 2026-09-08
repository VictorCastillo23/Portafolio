// Home page — assembles every section in the locked SECTION_IDS order
// (data/content.ts: hero, about, experience, credentials, projects, contact)
// around the persistent layout chrome (Nav, fixed sidebars, Footer fallback).
//
// Hero owns its own full-bleed layout (`min-h-screen`, its own horizontal
// padding) so it renders directly under `<main>`. The remaining sections go
// through `Section` (components/ui/Section.tsx), which only supplies the
// `id`/heading/aria-labelledby wiring and carries no spacing of its own — so
// the shared wrapper below supplies the horizontal max-width/padding (mirrors
// Nav's `mx-auto max-w-6xl` container) and the vertical rhythm between them.

import { Nav } from "../components/layout/Nav";
import { SocialSidebar } from "../components/layout/SocialSidebar";
import { EmailSidebar } from "../components/layout/EmailSidebar";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/sections/Hero";
import { About } from "../components/sections/About";
import { Experience } from "../components/sections/Experience";
import { Credentials } from "../components/sections/Credentials";
import { Projects } from "../components/sections/Projects";
import { Contact } from "../components/sections/Contact";

export default function Home() {
  return (
    <>
      <Nav />
      <SocialSidebar />
      <EmailSidebar />

      <main>
        <Hero />

        <div className="mx-auto max-w-6xl space-y-24 px-6 py-24 sm:space-y-32 sm:px-12 sm:py-32 lg:px-24">
          <About />
          <Experience />
          <Credentials />
          <Projects />
          <Contact />
        </div>
      </main>

      <Footer />
    </>
  );
}
