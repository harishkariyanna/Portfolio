import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getProjects } from '../services/api';
import { aboutApi, skillsApi, experiencesApi, educationApi } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import SkillsMarquee from '../components/SkillsMarquee';
import ResumeDownloadModal from '../components/ResumeDownloadModal';
import { FiArrowRight, FiDownload, FiMapPin } from 'react-icons/fi';
import { FaGithub, FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaYoutube, FaMedium, FaDev, FaStackOverflow, FaBehance, FaDribbble, FaGlobe } from 'react-icons/fa';

export default function HomePage() {
  const [about, setAbout] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);

  const getSocialIcon = (platform) => {
    const icons = {
      github: FaGithub,
      linkedin: FaLinkedin,
      twitter: FaTwitter,
      facebook: FaFacebook,
      instagram: FaInstagram,
      youtube: FaYoutube,
      medium: FaMedium,
      devto: FaDev,
      stackoverflow: FaStackOverflow,
      behance: FaBehance,
      dribbble: FaDribbble,
      website: FaGlobe,
    };
    const Icon = icons[platform] || FaGlobe;
    return <Icon />;
  };

  useEffect(() => {
    aboutApi.getAll().then(r => setAbout(r.data[0] || null)).catch(() => {});
    getProjects({ limit: 6, featured: true }).then(r => setProjects(r.data.projects || [])).catch(() => {});
    skillsApi.getAll().then(r => setSkills(r.data || [])).catch(() => {});
    experiencesApi.getAll().then(r => setExperiences(r.data || [])).catch(() => {});
    educationApi.getAll().then(r => setEducation(r.data || [])).catch(() => {});
  }, []);

  const visibleSocialLinks = about?.socialLinks?.filter(link => link.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

  return (
    <>
      <Helmet>
        <title>Portfolio | Home</title>
        <meta name="description" content="AI-Powered Dynamic Portfolio Platform" />
      </Helmet>

      {/* Hero Section */}
      <section className="hero" role="banner">
        <div className="hero-content">
          <div className="hero-profile">
            {about?.profileImage && (
              <img src={about.profileImage} alt="Profile" className="hero-profile-img" />
            )}
            {visibleSocialLinks.length > 0 && (
              <div className="social-links">
                {visibleSocialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label={link.platform}
                    title={link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                  >
                    {getSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="hero-text">
            <h1 className="hero-title">
              {about?.headline || 'Welcome to My Portfolio'}
            </h1>
            <p className="hero-subtitle">
              {about?.bio || 'Full-Stack Developer & AI Enthusiast'}
            </p>
            {about?.location && (
              <p className="hero-location"><FiMapPin /> {about.location}</p>
            )}
            {about?.typingTaglines?.length > 0 && (
              <TypingTagline taglines={about.typingTaglines} />
            )}
            <div className="hero-cta">
              <Link to="/projects" className="btn btn-primary">View Projects <FiArrowRight /></Link>
              <button className="btn btn-outline" onClick={() => setResumeModalOpen(true)}>
                <FiDownload /> Download Resume
              </button>
              <Link to="/contact" className="btn btn-outline">Contact Me</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {projects.length > 0 && (
        <section className="section" aria-labelledby="projects-heading">
          <h2 id="projects-heading" className="section-title">Featured Projects</h2>
          <div className="projects-grid">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
          <div className="section-footer">
            <Link to="/projects" className="btn btn-outline">All Projects <FiArrowRight /></Link>
          </div>
        </section>
      )}

      {/* Skills */}
      <section className="section skills-section" aria-labelledby="skills-heading">
        <h2 id="skills-heading" className="section-title">Skills & Technologies</h2>
        <SkillsMarquee skills={skills} />
      </section>

      {/* Experience */}
      <section className="section" aria-labelledby="experience-heading">
        <h2 id="experience-heading" className="section-title">Experience</h2>
        {experiences.length > 0 ? (
          <div className="timeline">
            {experiences.map(exp => (
              <div key={exp._id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  {exp.companyLogo && (
                    <img 
                      src={exp.companyLogo} 
                      alt={exp.company} 
                      className="timeline-logo"
                      style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '0.5rem' }}
                    />
                  )}
                  <h3>{exp.role}</h3>
                  <p className="timeline-company">{exp.company}</p>
                  <p className="timeline-date">
                    {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    {' — '}
                    {exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                  {exp.highlights?.length > 0 && (
                    <ul className="timeline-highlights">
                      {exp.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No experience entries yet.</p>
        )}
      </section>

      {/* Education */}
      <section className="section" aria-labelledby="education-heading">
        <h2 id="education-heading" className="section-title">Education</h2>
        {education.length > 0 ? (
          <div className="timeline">
            {education.map(edu => (
              <div key={edu._id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  {edu.collegeLogo && (
                    <img 
                      src={edu.collegeLogo} 
                      alt={edu.institution} 
                      className="timeline-logo"
                      style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '0.5rem' }}
                    />
                  )}
                  <h3>{edu.degree}</h3>
                  <p className="timeline-company">{edu.institution}</p>
                  {edu.fieldOfStudy && <p className="timeline-field">{edu.fieldOfStudy}</p>}
                  {edu.grade && <p className="timeline-grade">Grade: {edu.grade}</p>}
                  <p className="timeline-date">
                    {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    {' — '}
                    {edu.current ? 'Present' : new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                  {edu.description && <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{edu.description}</p>}
                  {edu.achievements?.length > 0 && (
                    <ul className="timeline-highlights">
                      {edu.achievements.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No education entries yet.</p>
        )}
      </section>

      <ResumeDownloadModal isOpen={resumeModalOpen} onClose={() => setResumeModalOpen(false)} />
    </>
  );
}

function TypingTagline({ taglines }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [taglines.length]);

  return <p className="typing-tagline">{taglines[index]}</p>;
}
