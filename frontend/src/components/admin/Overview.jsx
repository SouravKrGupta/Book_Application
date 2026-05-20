import { useEffect, useState } from 'react';
import { fetchAdminReviews, fetchBooks, fetchLibrary } from '../../data/api';

const Overview = () => {
  const [stats, setStats] = useState({
    catalogBooks: 0,
    reviewedTitles: 0,
    totalReviews: 0,
    myLibraryEntries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [books, library, reviews] = await Promise.all([
          fetchBooks(),
          fetchLibrary(),
          fetchAdminReviews(),
        ]);

        const reviewedTitles = new Set(reviews.map((review) => review.book)).size;

        setStats({
          catalogBooks: books.length,
          reviewedTitles,
          totalReviews: reviews.length,
          myLibraryEntries: library.length,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load overview data.');
      }
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-state surface-card-strong">
        <div className="loading-spinner"></div>
        <p>Loading overview metrics.</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  const cards = [
    { label: 'Catalog books', value: stats.catalogBooks, tone: 'text-[#7b4636]' },
    { label: 'Reviewed titles', value: stats.reviewedTitles, tone: 'text-[#1f5b53]' },
    { label: 'Total reviews', value: stats.totalReviews, tone: 'text-[#a5622d]' },
    { label: 'My library entries', value: stats.myLibraryEntries, tone: 'text-[#5f4c44]' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8e766a]">{card.label}</p>
          <p className={`stat-card-value ${card.tone}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default Overview;
