import { useState, useEffect } from 'react';
import { aboutApi } from '../services/api';

export default function Footer() {
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    aboutApi.getAll()
      .then(r => {
        const about = r.data[0];
        if (about?.footerText) {
          const text = about.footerText.replace('{year}', new Date().getFullYear());
          setFooterText(text);
        } else {
          setFooterText(`© ${new Date().getFullYear()} Portfolio Platform. Built with MERN + AI.`);
        }
      })
      .catch(() => setFooterText(`© ${new Date().getFullYear()} Portfolio Platform. Built with MERN + AI.`));
  }, []);

  return (
    <footer className="footer">
      <p>{footerText}</p>
    </footer>
  );
}
