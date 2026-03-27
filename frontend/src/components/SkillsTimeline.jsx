import { useState } from 'react';

const CATEGORIES = ['all', 'frontend', 'backend', 'database', 'devops', 'ai', 'mobile', 'tools', 'soft-skills', 'other'];

// Map skill names to Simple Icons slugs (https://simpleicons.org)
const SKILL_ICON_MAP = {
  react: 'react', 'react.js': 'react', reactjs: 'react',
  angular: 'angular', vue: 'vuedotjs', 'vue.js': 'vuedotjs',
  javascript: 'javascript', typescript: 'typescript',
  html: 'html5', html5: 'html5', css: 'css3', css3: 'css3',
  'node.js': 'nodedotjs', nodejs: 'nodedotjs', node: 'nodedotjs',
  express: 'express', 'express.js': 'express',
  python: 'python', java: 'openjdk', 'c#': 'csharp', csharp: 'csharp',
  'c++': 'cplusplus', c: 'c', go: 'go', golang: 'go', rust: 'rust',
  ruby: 'ruby', php: 'php', swift: 'swift', kotlin: 'kotlin', dart: 'dart',
  flutter: 'flutter', 'react native': 'react',
  mongodb: 'mongodb', postgresql: 'postgresql', postgres: 'postgresql',
  mysql: 'mysql', redis: 'redis', sqlite: 'sqlite',
  docker: 'docker', kubernetes: 'kubernetes', aws: 'amazonwebservices',
  azure: 'microsoftazure', gcp: 'googlecloud', 'google cloud': 'googlecloud',
  git: 'git', github: 'github', gitlab: 'gitlab',
  linux: 'linux', nginx: 'nginx', apache: 'apache',
  graphql: 'graphql', rest: 'openapiinitiative',
  tailwind: 'tailwindcss', 'tailwind css': 'tailwindcss', tailwindcss: 'tailwindcss',
  bootstrap: 'bootstrap', sass: 'sass', scss: 'sass',
  webpack: 'webpack', vite: 'vite', babel: 'babel',
  jest: 'jest', cypress: 'cypress', playwright: 'playwright',
  figma: 'figma', 'adobe xd': 'adobexd',
  firebase: 'firebase', supabase: 'supabase',
  nextjs: 'nextdotjs', 'next.js': 'nextdotjs',
  nuxt: 'nuxtdotjs', 'nuxt.js': 'nuxtdotjs',
  django: 'django', flask: 'flask', fastapi: 'fastapi',
  spring: 'spring', 'spring boot': 'springboot',
  '.net': 'dotnet', dotnet: 'dotnet',
  terraform: 'terraform', ansible: 'ansible', jenkins: 'jenkins',
  'ci/cd': 'githubactions', vercel: 'vercel', netlify: 'netlify',
  heroku: 'heroku', render: 'render',
  openai: 'openai', tensorflow: 'tensorflow', pytorch: 'pytorch',
  pandas: 'pandas', numpy: 'numpy', scikit: 'scikitlearn',
  'machine learning': 'scikitlearn', ai: 'openai',
  postman: 'postman', insomnia: 'insomnia',
  slack: 'slack', jira: 'jira', notion: 'notion', trello: 'trello',
  'vs code': 'visualstudiocode', vscode: 'visualstudiocode',
};

function getSkillIconUrl(skillName) {
  const slug = SKILL_ICON_MAP[skillName?.toLowerCase()?.trim()];
  if (slug) return `https://cdn.simpleicons.org/${slug}`;
  return null;
}

export default function SkillsTimeline({ skills = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? skills
    : skills.filter(s => s.category === activeCategory);

  if (skills.length === 0) {
    return <p className="empty-state">No skills added yet.</p>;
  }

  return (
    <div className="skills-section">
      <div className="skills-filter">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat.replace(/-/g, ' ')}
          </button>
        ))}
      </div>
      <div className="skills-grid">
        {filtered.map(skill => {
          const iconUrl = skill.icon || getSkillIconUrl(skill.name);
          return (
            <div key={skill._id} className="skill-card">
              {iconUrl && <img src={iconUrl} alt={skill.name} className="skill-icon-img" width="32" height="32" loading="lazy" />}
              <h4>{skill.name}</h4>
              <div className="skill-bar">
                <div
                  className="skill-bar-fill"
                  style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={skill.proficiency}
                  aria-valuemin={0}
                  aria-valuemax={5}
                />
              </div>
              <span className="skill-level">{skill.proficiency}/5</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
