import React, { memo } from 'react';

const TEXT_LINK_PATTERN = /((?:https?:\/\/|www\.)[^\s]+|(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:\/[^\s]*)?)|@([A-Za-z0-9_-]+)/g;
const TRAILING_PUNCTUATION_PATTERN = /[),.!?;:]+$/;

const toHref = (value) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
};

export const renderTextWithLinks = (text) => {
  if (!text) {
    return null;
  }

  const parts = [];
  let lastIndex = 0;
  let match;
  TEXT_LINK_PATTERN.lastIndex = 0;

  while ((match = TEXT_LINK_PATTERN.exec(text)) !== null) {
    const matchText = match[0];
    const matchStart = match.index;
    let matchEnd = matchStart + matchText.length;
    let trailing = '';
    let tokenText = matchText;

    if (match[1]) {
      const trailingMatch = matchText.match(TRAILING_PUNCTUATION_PATTERN);
      if (trailingMatch?.[0]) {
        trailing = trailingMatch[0];
        tokenText = matchText.slice(0, -trailing.length);
        matchEnd -= trailing.length;
      }
    }

    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart));
    }

    if (match[1]) {
      parts.push(
        <a
          key={`${matchStart}-link`}
          href={toHref(tokenText)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link"
        >
          {tokenText}
        </a>
      );

      if (trailing) {
        parts.push(trailing);
      }
    } else if (match[2]) {
      const mention = match[2];
      parts.push(
        <a
          key={`${matchStart}-mention`}
          href={`https://scratch.mit.edu/users/${encodeURIComponent(mention)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link"
        >
          @{mention}
        </a>
      );
    }

    lastIndex = matchEnd;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const ProjectCard = ({ project }) => {
  return (
    <div className="project">
      <div className="project-title">
        <a
          href={`https://scratch.mit.edu/projects/${project.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {project.title}
        </a>
      </div>

      <a
        href={`https://scratch.mit.edu/projects/${project.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="project-image-link"
      >
        <img
          src={`https://cdn2.scratch.mit.edu/get_image/project/${project.id}_480x360.png`}
          alt={project.title}
          className="project-image"
          width="480"
          height="360"
          loading="lazy"
          decoding="async"
        />
      </a>

      <p className="info">
        <strong>ID:</strong> {project.id}
        <br />
        <strong>共有:</strong> {project.published_date}
        <br />
        <strong>更新:</strong> {project.modified_date}
      </p>

      <div className="action-buttons">
        <button
          onClick={() => window.open(`https://scratch.mit.edu/projects/${project.id}`, '_blank')}
          className="scratch-button"
        >
          Scratch
        </button>

        <button
          onClick={() => window.open(`https://turbowarp.org/${project.id}`, '_blank')}
          className="turbowarp-button"
        >
          TurboWarp
        </button>
      </div>

      {project.instructions && (
        <div className="usage">
          <strong>使い方:</strong>
          <p>{renderTextWithLinks(project.instructions)}</p>
        </div>
      )}

      {project.description && (
        <div className="description">
          <strong>メモとクレジット:</strong>
          <p>{renderTextWithLinks(project.description)}</p>
        </div>
      )}
    </div>
  );
};

export default memo(ProjectCard);
