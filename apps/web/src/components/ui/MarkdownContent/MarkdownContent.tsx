'use client';
import React, { useMemo } from 'react';
import { marked, type Token, type Tokens } from 'marked';
import styles from './MarkdownContent.module.css';

interface MarkdownContentProps {
  content: string;
  onQuestionClick?: (question: string) => void;
  className?: string;
}

/**
 * Strips markdown markup syntax for clear voice synthesis.
 */
export function stripMarkdown(md: string): string {
  if (!md) return '';
  return md
    .replace(/---/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleans bold/quotes from question text for interactive follow-up button clicks.
 */
function cleanQuestionPrompt(raw: string): string {
  return raw
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/^\d+\.\s*/, '')
    .trim();
}

export default function MarkdownContent({
  content,
  onQuestionClick,
  className,
}: MarkdownContentProps) {
  const tokens = useMemo(() => {
    if (!content) return [];
    try {
      return marked.lexer(content, { gfm: true, breaks: true });
    } catch {
      return [];
    }
  }, [content]);

  if (!tokens || tokens.length === 0) {
    return <div className={`${styles.markdownRoot} ${className || ''}`}>{content}</div>;
  }

  // Group tokens to detect Follow-up questions section
  const elements: React.ReactNode[] = [];
  let inFollowUp = false;

  for (let idx = 0; idx < tokens.length; idx++) {
    const token = tokens[idx];
    if (token.type === 'heading') {
      const lower = (token.text || '').toLowerCase();
      inFollowUp =
        lower.includes('follow-up') ||
        lower.includes('follow up') ||
        lower.includes('পরবর্তী প্রশ্ন') ||
        token.text.includes('❓');
    }

    if (inFollowUp && token.type === 'list') {
      const listToken = token as Tokens.List;
      elements.push(
        <div key={idx} className={styles.followUpSection}>
          <div className={styles.followUpHeader}>
            <span>❓</span>
            <span>Recommended Next Steps & Follow-ups</span>
          </div>
          <div className={styles.followUpList}>
            {listToken.items.map((item, itemIdx) => {
              const cleanedQuestion = cleanQuestionPrompt(item.text);
              return (
                <button
                  key={itemIdx}
                  type="button"
                  className={styles.followUpBtn}
                  onClick={() => onQuestionClick?.(cleanedQuestion)}
                  title={`Click to ask: "${cleanedQuestion}"`}
                >
                  <span>
                    <strong>{itemIdx + 1}.</strong> {renderInlineTokens(item.tokens || [])}
                  </span>
                  <span className={styles.followUpBtnArrow}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      );
      continue;
    }

    elements.push(<BlockToken key={idx} token={token} onQuestionClick={onQuestionClick} />);
  }

  return (
    <div className={`${styles.markdownRoot} ${className || ''}`}>
      {elements}
    </div>
  );
}

function BlockToken({
  token,
  onQuestionClick,
}: {
  token: Token;
  onQuestionClick?: (q: string) => void;
}) {
  switch (token.type) {
    case 'heading': {
      const headingToken = token as Tokens.Heading;
      const depth = headingToken.depth;
      const inline = renderInlineTokens(headingToken.tokens || []);

      if (depth === 1) return <h2 className={styles.heading2}>{inline}</h2>;
      if (depth === 2) return <h2 className={styles.heading2}>{inline}</h2>;
      if (depth === 3) return <h3 className={styles.heading3}>{inline}</h3>;
      return <h4 className={styles.heading4}>{inline}</h4>;
    }

    case 'paragraph': {
      const pToken = token as Tokens.Paragraph;
      return <p>{renderInlineTokens(pToken.tokens || [])}</p>;
    }

    case 'list': {
      const listToken = token as Tokens.List;
      const isOrdered = listToken.ordered;
      const ListTag = isOrdered ? 'ol' : 'ul';
      const listClass = isOrdered ? styles.orderedList : styles.list;

      return (
        <ListTag className={listClass} start={listToken.start || 1}>
          {listToken.items.map((item, i) => (
            <li key={i} className={styles.listItem}>
              {renderListItemContent(item, onQuestionClick)}
            </li>
          ))}
        </ListTag>
      );
    }

    case 'blockquote': {
      const bqToken = token as Tokens.Blockquote;
      return (
        <div className={styles.callout}>
          <span className={styles.calloutIcon}>💡</span>
          <div className={styles.calloutContent}>
            {bqToken.tokens.map((subToken, i) => (
              <BlockToken key={i} token={subToken} onQuestionClick={onQuestionClick} />
            ))}
          </div>
        </div>
      );
    }

    case 'hr':
      return <hr className={styles.divider} />;

    case 'code': {
      const codeToken = token as Tokens.Code;
      return (
        <pre className={styles.codeBlock}>
          <code>{codeToken.text}</code>
        </pre>
      );
    }

    case 'table': {
      const tableToken = token as Tokens.Table;
      return (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {tableToken.header.map((cell, i) => (
                  <th key={i}>{renderInlineTokens(cell.tokens || [])}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableToken.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx}>{renderInlineTokens(cell.tokens || [])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'space':
      return null;

    default:
      if ('text' in token && typeof token.text === 'string') {
        return <p>{token.text}</p>;
      }
      return null;
  }
}

function renderListItemContent(
  item: Tokens.ListItem,
  onQuestionClick?: (q: string) => void
): React.ReactNode {
  if (item.tokens && item.tokens.length > 0) {
    return (
      <>
        {item.tokens.map((subToken, idx) => {
          if (subToken.type === 'text') {
            const textToken = subToken as Tokens.Text;
            if (textToken.tokens && textToken.tokens.length > 0) {
              return <React.Fragment key={idx}>{renderInlineTokens(textToken.tokens)}</React.Fragment>;
            }
            return <React.Fragment key={idx}>{textToken.text}</React.Fragment>;
          }
          if (subToken.type === 'list') {
            const nestedList = subToken as Tokens.List;
            const ListTag = nestedList.ordered ? 'ol' : 'ul';
            return (
              <ListTag key={idx} className={styles.nestedList}>
                {nestedList.items.map((subItem, subIdx) => (
                  <li key={subIdx} className={styles.listItem}>
                    {renderListItemContent(subItem, onQuestionClick)}
                  </li>
                ))}
              </ListTag>
            );
          }
          return <BlockToken key={idx} token={subToken} onQuestionClick={onQuestionClick} />;
        })}
      </>
    );
  }
  return item.text;
}

function renderInlineTokens(tokens: Token[]): React.ReactNode {
  if (!tokens || tokens.length === 0) return null;

  return tokens.map((token, i) => {
    switch (token.type) {
      case 'strong': {
        const strongToken = token as Tokens.Strong;
        return (
          <strong key={i} className={styles.strongText}>
            {renderInlineTokens(strongToken.tokens || [])}
          </strong>
        );
      }

      case 'em': {
        const emToken = token as Tokens.Em;
        return <em key={i}>{renderInlineTokens(emToken.tokens || [])}</em>;
      }

      case 'codespan': {
        const codeToken = token as Tokens.Codespan;
        return (
          <code key={i} className={styles.inlineCode}>
            {codeToken.text}
          </code>
        );
      }

      case 'link': {
        const linkToken = token as Tokens.Link;
        return (
          <a
            key={i}
            href={linkToken.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {renderInlineTokens(linkToken.tokens || [])}
          </a>
        );
      }

      case 'del': {
        const delToken = token as Tokens.Del;
        return <del key={i}>{renderInlineTokens(delToken.tokens || [])}</del>;
      }

      case 'br':
        return <br key={i} />;

      case 'text': {
        const textToken = token as Tokens.Text;
        if (textToken.tokens && textToken.tokens.length > 0) {
          return <React.Fragment key={i}>{renderInlineTokens(textToken.tokens)}</React.Fragment>;
        }
        return <React.Fragment key={i}>{textToken.text}</React.Fragment>;
      }

      case 'escape': {
        const escapeToken = token as Tokens.Escape;
        return <React.Fragment key={i}>{escapeToken.text}</React.Fragment>;
      }

      default:
        if ('text' in token && typeof token.text === 'string') {
          return <React.Fragment key={i}>{token.text}</React.Fragment>;
        }
        return null;
    }
  });
}
