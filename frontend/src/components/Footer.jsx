import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,247,239,0.58)]">Book World</p>
              <h3 className="mt-3 text-4xl text-[#fff7ef]">Reading, listening, and discovery in one calm place.</h3>
            </div>
            <p className="max-w-md text-base leading-7 text-[rgba(255,247,239,0.72)]">
              Explore stories, revisit your library, and turn books into richer experiences with summaries,
              analytics, and audio features built for modern readers.
            </p>
            <div className="grid max-w-lg gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-2xl font-semibold text-[#fff7ef]">24/7</p>
                <p className="mt-1 text-sm text-[rgba(255,247,239,0.66)]">Access on your schedule</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-2xl font-semibold text-[#fff7ef]">AI</p>
                <p className="mt-1 text-sm text-[rgba(255,247,239,0.66)]">Summaries and narration</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-2xl font-semibold text-[#fff7ef]">1</p>
                <p className="mt-1 text-sm text-[rgba(255,247,239,0.66)]">Library for every format</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-[rgba(255,247,239,0.56)]">Explore</h4>
            <ul className="mt-5 space-y-3">
              <li>
                <Link to="/" className="footer-link">Home</Link>
              </li>
              <li>
                <Link to="/books" className="footer-link">Browse books</Link>
              </li>
              <li>
                <Link to="/library" className="footer-link">My library</Link>
              </li>
              <li>
                <Link to="/profile" className="footer-link">Profile</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-[rgba(255,247,239,0.56)]">Highlights</h4>
            <ul className="mt-5 space-y-3 text-[rgba(255,247,239,0.72)]">
              <li>Editorial featured shelves</li>
              <li>Progress-aware reading</li>
              <li>AI summary and audio tools</li>
              <li>Admin content management</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-[rgba(255,247,239,0.56)]">Support</h4>
            <div className="mt-5 space-y-4 text-[rgba(239,232,226,0.29)]">
              <p>support@bookworld.com</p>
              <p>+1 (555) 123-4567</p>
              <p>123 Book Street, Reading City</p>
              <p className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6">
                Need help choosing a title or using audio tools? Reach out and we will point you to the right page.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-[rgba(253,253,253,0.6)] md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Book World. Crafted for thoughtful reading.</p>
          <p>Built to make every page feel inviting.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
