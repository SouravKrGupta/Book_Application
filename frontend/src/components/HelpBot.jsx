import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const isBookDetailPath = (pathname) => /^\/books\/[^/]+$/.test(pathname);
const isReaderPath = (pathname) => /^\/books\/[^/]+\/pdf-viewer$/.test(pathname);

const getTopicContent = (key, { pathname, user }) => {
  const isGuest = !user;
  const isAdmin = user?.type === 'admin';

  switch (key) {
    case 'start-reading':
      return {
        buttonLabel: 'Start reading',
        label: 'How do I start reading?',
        answer: isGuest
          ? 'Open Books, choose a title, then use Read now or open the book details page. Sign in if you want saved books and progress tracking.'
          : 'Open Books, choose a title, then use Read now or Open PDF reader. Your reading progress can be stored in My Library while you read.',
      };
    case 'save-books':
      return {
        buttonLabel: 'Save books',
        label: 'How do I save books?',
        answer: isGuest
          ? 'Create an account or sign in first. After that, use the Save button on book cards to add titles to My Library.'
          : 'Use the Save button on a book card. Saved titles appear in My Library so you can return to them later.',
      };
    case 'progress':
      return {
        buttonLabel: 'Save progress',
        label: 'How is my progress saved?',
        answer:
          'When you read inside the PDF viewer, the app updates your library progress. Audio progress is also remembered when audio is playing for a book.',
      };
    case 'reader-tools':
      return {
        buttonLabel: 'Reader tools',
        label: 'What can I do in the reader?',
        answer:
          'Inside the PDF reader you can read the document, extract text from selected pages, generate chapter audio, and try full-book audio when supported.',
      };
    case 'audio-tools':
      return {
        buttonLabel: 'Audio tools',
        label: 'How do audio tools work?',
        answer:
          'Quick audio starts from early pages, chapter audio lets you choose a page range, and full-book audio is available for supported books. For very large books, the app may suggest smaller audio options.',
      };
    case 'reviews':
      return {
        buttonLabel: 'Reviews',
        label: 'How do reviews work?',
        answer: isAdmin
          ? 'Reader reviews appear on book pages and the home page. Admins can manage reviews from the dashboard, while reader accounts are the ones that post ratings and comments.'
          : isGuest
            ? 'Open a book detail page to read community reviews. Sign in with a reader account if you want to leave your own rating and comment.'
            : 'Open a book detail page to read reviews or post your own. Reader accounts can submit ratings and comments after opening a book page.',
      };
    case 'account':
      return {
        buttonLabel: 'Why sign in?',
        label: 'Why should I sign in?',
        answer:
          'Signing in unlocks saved books, My Library, reading progress, and reader-only actions like posting reviews.',
      };
    case 'admin':
      return {
        buttonLabel: 'Admin tools',
        label: 'What can admins do here?',
        answer:
          'Admins can open the dashboard to upload books, manage the catalog, and moderate reviews. Reader posting actions stay reserved for normal reader accounts.',
      };
    case 'current-page':
      return {
        buttonLabel: 'Use this page',
        label: 'How do I use this page?',
        answer: isReaderPath(pathname)
          ? 'This page is for focused reading. Use the PDF view for the book, the audio controls for listening, and the text extraction tools when you want passages from selected pages.'
          : isBookDetailPath(pathname)
            ? 'This page gives you the book overview, the Open PDF reader button, AI summary tools, and the review section.'
            : pathname === '/library'
              ? 'This page shows your saved books and reading progress. Open any book here when you want to continue where you left off.'
              : pathname === '/books'
                ? 'This page is for browsing titles. Open a card to see more details or jump straight into reading.'
                : 'This page helps you move through the app. Use the main buttons and navigation links to browse, read, and manage your library.',
      };
    default:
      return {
        buttonLabel: 'Help topics',
        label: 'What can you help with?',
        answer:
          'I can help with browsing books, starting the reader, saving titles, tracking progress, audio tools, and reviews.',
      };
  }
};

const buildGuideContext = ({ pathname, user }) => {
  const displayName = user?.name ? user.name.split(' ')[0] : 'there';
  const isGuest = !user;
  const isAdmin = user?.type === 'admin';

  if (pathname === '/') {
    return {
      title: 'Getting started',
      intro: isGuest
        ? `Hi ${displayName}. I can help you browse books, start reading, and understand what you unlock after signing in.`
        : `Hi ${displayName}. I can help you move from browsing to reading, audio, reviews, and library tools.`,
      topics: ['start-reading', 'save-books', 'audio-tools', 'reviews', 'account'],
      actions: isGuest
        ? [
            { label: 'Browse books', to: '/books', tone: 'primary' },
            { label: 'Sign in', to: '/login', tone: 'secondary' },
          ]
        : [
            { label: 'Browse books', to: '/books', tone: 'primary' },
            { label: 'My library', to: '/library', tone: 'secondary' },
          ],
    };
  }

  if (pathname === '/books') {
    return {
      title: 'Book browsing help',
      intro: 'You are on the catalog page. I can help you choose a title, save books, and jump into reading.',
      topics: ['current-page', 'start-reading', 'save-books', 'reviews'],
      actions: isGuest
        ? [
            { label: 'Sign in', to: '/login', tone: 'secondary' },
            { label: 'Go home', to: '/', tone: 'ghost' },
          ]
        : [
            { label: 'My library', to: '/library', tone: 'secondary' },
            { label: 'Go home', to: '/', tone: 'ghost' },
          ],
    };
  }

  if (isBookDetailPath(pathname)) {
    return {
      title: 'Book page help',
      intro: 'This page shows the book details, reader entry point, extra tools, and reviews. Ask me about any of those pieces.',
      topics: ['current-page', 'start-reading', 'audio-tools', 'reviews', 'progress'],
      actions: isGuest
        ? [
            { label: 'Sign in', to: '/login', tone: 'secondary' },
            { label: 'Browse books', to: '/books', tone: 'ghost' },
          ]
        : [
            { label: 'My library', to: '/library', tone: 'secondary' },
            { label: 'Browse books', to: '/books', tone: 'ghost' },
          ],
    };
  }

  if (isReaderPath(pathname)) {
    return {
      title: 'Reader help',
      intro: 'You are inside the reading view. I can help with reading, audio controls, text extraction, and saved progress.',
      topics: ['current-page', 'reader-tools', 'audio-tools', 'progress'],
      actions: [
        { label: 'Back to book', to: pathname.replace('/pdf-viewer', ''), tone: 'secondary' },
        { label: 'My library', to: '/library', tone: 'ghost' },
      ],
    };
  }

  if (pathname === '/library') {
    return {
      title: 'Library help',
      intro: 'This is your saved shelf. I can help you continue reading, understand progress, and manage saved titles.',
      topics: ['current-page', 'progress', 'start-reading', 'save-books'],
      actions: [
        { label: 'Browse books', to: '/books', tone: 'primary' },
        { label: 'Go home', to: '/', tone: 'ghost' },
      ],
    };
  }

  if (pathname === '/login' || pathname === '/register') {
    return {
      title: 'Account help',
      intro: 'Signing in makes the reading experience smoother by unlocking saved books, library tracking, and review tools.',
      topics: ['account', 'start-reading', 'save-books'],
      actions: [
        { label: pathname === '/login' ? 'Create account' : 'Sign in', to: pathname === '/login' ? '/register' : '/login', tone: 'primary' },
        { label: 'Browse books', to: '/books', tone: 'ghost' },
      ],
    };
  }

  if (pathname === '/admin' && isAdmin) {
    return {
      title: 'Admin help',
      intro: 'This dashboard is for managing the catalog and reviews. I can point you to the main admin jobs here.',
      topics: ['admin', 'reviews', 'current-page'],
      actions: [
        { label: 'Go home', to: '/', tone: 'ghost' },
        { label: 'Browse books', to: '/books', tone: 'secondary' },
      ],
    };
  }

  return {
    title: 'Book Guide',
    intro: 'I can help you understand the main reading flow, library tools, and review features across the app.',
    topics: ['start-reading', 'save-books', 'audio-tools', 'reviews'],
    actions: isGuest
      ? [
          { label: 'Browse books', to: '/books', tone: 'primary' },
          { label: 'Sign in', to: '/login', tone: 'secondary' },
        ]
      : [
          { label: 'Browse books', to: '/books', tone: 'primary' },
          { label: 'My library', to: '/library', tone: 'secondary' },
        ],
  };
};

const HelpBot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const messagesRef = useRef(null);

  const guide = useMemo(
    () => buildGuideContext({ pathname: location.pathname, user }),
    [location.pathname, user]
  );

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: guide.intro,
    },
  ]);

  useEffect(() => {
    setMessages([
      {
        id: `welcome-${location.pathname}-${user?.type || 'guest'}`,
        role: 'bot',
        text: guide.intro,
      },
    ]);
  }, [guide.intro, location.pathname, user?.type]);

  useEffect(() => {
    if (!messagesRef.current) return;

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleTopicClick = (topicKey) => {
    const topic = getTopicContent(topicKey, { pathname: location.pathname, user });

    setMessages((current) => [
      ...current,
      { id: `${topicKey}-question-${current.length}`, role: 'user', text: topic.label },
      { id: `${topicKey}-answer-${current.length}`, role: 'bot', text: topic.answer },
    ]);
  };

  const handleNavigate = (to) => {
    navigate(to);
    setIsOpen(false);
  };

  return (
    <div className="help-bot-shell">
      {isOpen && (
        <section className="help-bot-panel" aria-label="Book Guide assistant">
          <div className="help-bot-header">
            <div>
              <p className="help-bot-kicker">Book Guide</p>
              <h2 className="help-bot-title">{guide.title}</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="help-bot-close"
              type="button"
              aria-label="Close help assistant"
            >
              &times;
            </button>
          </div>

          <div ref={messagesRef} className="help-bot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'user' ? 'help-bot-message help-bot-message-user' : 'help-bot-message help-bot-message-bot'}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="help-bot-section">
            <div className="help-bot-section-head">
              <p className="help-bot-label">Suggested questions</p>
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: `welcome-${location.pathname}-${user?.type || 'guest'}-reset`,
                      role: 'bot',
                      text: guide.intro,
                    },
                  ])
                }
                className="help-bot-reset"
                type="button"
              >
                Reset
              </button>
            </div>
            <div className="help-bot-topic-grid">
              {guide.topics.map((topicKey) => {
                const topic = getTopicContent(topicKey, { pathname: location.pathname, user });

                return (
                  <button
                    key={topicKey}
                    onClick={() => handleTopicClick(topicKey)}
                    className="help-bot-topic"
                    type="button"
                  >
                    {topic.buttonLabel || topic.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="help-bot-section">
            <p className="help-bot-label">Quick actions</p>
            <div className="help-bot-actions">
              {guide.actions.map((action) => (
                <button
                  key={`${action.label}-${action.to}`}
                  onClick={() => handleNavigate(action.to)}
                  className={
                    action.tone === 'primary'
                      ? 'help-bot-action help-bot-action-primary'
                      : action.tone === 'secondary'
                        ? 'help-bot-action help-bot-action-secondary'
                        : 'help-bot-action help-bot-action-ghost'
                  }
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <button
        onClick={() => setIsOpen((open) => !open)}
        className="help-bot-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Hide Book Guide' : 'Open Book Guide'}
      >
        <span className="help-bot-toggle-mark">?</span>
        <span className="help-bot-toggle-copy">
          <span className="help-bot-toggle-label">Book Guide</span>
          <span className="help-bot-toggle-text">Need help using the app?</span>
        </span>
      </button>
    </div>
  );
};

export default HelpBot;
