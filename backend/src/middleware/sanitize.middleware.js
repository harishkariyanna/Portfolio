const createDOMPurify = require('isomorphic-dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const ALLOWED_TAGS = ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR
  });
};

const sanitizeMiddleware = (fields = []) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeHtml(req.body[field]);
        }
      });
    }
    next();
  };
};

module.exports = { sanitizeHtml, sanitizeMiddleware };
