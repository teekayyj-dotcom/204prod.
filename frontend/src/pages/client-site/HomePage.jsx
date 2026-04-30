import heroImage from '../../shared/assets/hero.png'
import { siteConfig } from '../../shared/config/site'
import { ProjectGrid } from '../../modules/projects/components/ProjectGrid'

export function HomePage() {
  return (
    <main className="home-shell">
      <section className="hero-block">
        <div className="hero-copy">
          <p className="eyebrow">{siteConfig.location}</p>
          <h1>{siteConfig.name}</h1>
          <p className="tagline">{siteConfig.tagline}</p>
          <p className="description">
            Built around projects first. The site structure now reflects a production
            house workflow where portfolio work, media assets, and editorial curation
            are the primary surfaces.
          </p>
        </div>
        <div className="hero-visual">
          <img src={heroImage} alt="Abstract filmic composition for 204PROD." />
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <p className="eyebrow">Featured Projects</p>
          <h2>Portfolio work is the core product surface.</h2>
        </div>
        <ProjectGrid />
      </section>

      <section className="section-block section-block--notes">
        <div>
          <p className="eyebrow">Backend</p>
          <p>
            `projects`, `media`, `contacts`, `auth`, and `users` now live as isolated
            modules instead of being spread across global `models`, `schemas`, and
            `services` folders.
          </p>
        </div>
        <div>
          <p className="eyebrow">Frontend</p>
          <p>
            App entry, shared primitives, and product modules are separated so the
            portfolio can grow without turning `src/` into a flat dump.
          </p>
        </div>
      </section>
    </main>
  )
}
