import { useState } from 'react';
import { FiGithub, FiExternalLink, FiX } from 'react-icons/fi';
import { resolveImageUrl } from '../utils/imageUtils';

export default function ProjectCard({ project }) {
  const [showModal, setShowModal] = useState(false);

  const thumbnail = resolveImageUrl(project.images?.[0]?.url);

  return (
    <>
      <article className="project-card" onClick={() => setShowModal(true)} role="button" tabIndex={0} aria-label={`View ${project.title}`}>
        {thumbnail && <img src={thumbnail} alt={project.title} className="project-card-img" loading="lazy" />}
        <div className="project-card-body">
          <h3>{project.title}</h3>
          <p>{project.description?.substring(0, 120)}...</p>
          <div className="project-tags">
            {project.techStack?.slice(0, 5).map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>
      </article>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} role="dialog" aria-modal="true">
          <div className="modal-content project-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close"><FiX /></button>
            
            {/* Project Images Gallery */}
            {project.images && project.images.length > 0 && (
              <div className="project-modal-images">
                {project.images.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={resolveImageUrl(img.url)} 
                    alt={img.alt || `${project.title} ${idx + 1}`} 
                    className="project-modal-img" 
                    loading="lazy" 
                  />
                ))}
              </div>
            )}
            
            <h2>{project.title}</h2>
            
            {/* Category & Dates */}
            <div className="project-modal-meta">
              <span className="project-category">{project.category || 'other'}</span>
              {project.startDate && (
                <span className="project-date">
                  {new Date(project.startDate).toLocaleDateString()}
                  {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                </span>
              )}
            </div>
            
            {/* Short Description */}
            {project.shortDescription && (
              <p className="project-short-desc"><strong>{project.shortDescription}</strong></p>
            )}
            
            {/* Full Description */}
            <p className="project-description">{project.description}</p>
            
            {/* Tech Stack */}
            {project.techStack && project.techStack.length > 0 && (
              <div className="project-tags">
                {project.techStack.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
            
            {/* Video */}
            {project.videoUrl && (
              <div className="project-video">
                <iframe 
                  src={project.videoUrl} 
                  title={`${project.title} video`} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              </div>
            )}
            
            {/* Links */}
            <div className="project-links">
              {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"><FiGithub /> GitHub</a>}
              {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"><FiExternalLink /> Live Demo</a>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
