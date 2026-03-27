import { useEffect, useRef } from 'react';

export default function SkillsMarquee({ skills }) {
  const marqueeRef = useRef(null);

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  const categories = Object.keys(groupedSkills);

  // Get icon URL or fallback
  const getSkillIcon = (skill) => {
    if (skill.icon) return skill.icon;
    const slug = skill.name?.toLowerCase().replace(/\s+/g, '').replace(/\./g, 'dot');
    return `https://cdn.simpleicons.org/${slug}`;
  };

  return (
    <div className="skills-marquee-wrapper">
      <div className="skills-marquee" ref={marqueeRef}>
        <div className="skills-marquee-track">
          {/* Duplicate skills for seamless loop */}
          {[...skills, ...skills, ...skills].map((skill, idx) => (
            <div key={idx} className="skill-badge" title={skill.name}>
              {skill.icon && (
                <img 
                  src={getSkillIcon(skill)} 
                  alt={skill.name} 
                  className="skill-icon"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <span className="skill-name">{skill.name}</span>
              {skill.proficiency && (
                <span className="skill-proficiency">
                  {'★'.repeat(skill.proficiency)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category badges */}
      {categories.length > 0 && (
        <div className="skill-categories">
          {categories.map(cat => (
            <span key={cat} className="category-badge">
              {cat.charAt(0).toUpperCase() + cat.slice(1)} ({groupedSkills[cat].length})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
