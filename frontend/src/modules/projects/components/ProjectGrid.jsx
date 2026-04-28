import { featuredProjects } from '../api/projects'

export function ProjectGrid() {
  return (
    <div className="project-grid">
      {featuredProjects.map((project) => (
        <article className="project-card" key={project.title}>
          <div className="project-card__meta">
            <span>{project.format}</span>
            <span>{project.year}</span>
          </div>
          <h3>{project.title}</h3>
          <p className="project-card__client">{project.client}</p>
          <p>{project.description}</p>
        </article>
      ))}
    </div>
  )
}
