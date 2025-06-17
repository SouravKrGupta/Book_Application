import { createContext, useContext, useState, useEffect } from 'react';
import { users as initialUsers, books as initialBooks, library as initialLibrary } from '../data/mockData';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState(initialBooks);
  const [users, setUsers] = useState(initialUsers);
  const [library, setLibrary] = useState(initialLibrary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = (name, email, password) => {
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return false;
    }

    const newUser = {
      id: users.length + 1,
      name,
      email,
      password,
      role: 'user',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    setUsers([...users, newUser]);
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const addToLibrary = (bookId) => {
    if (!user) return false;

    const userLibrary = library.find(l => l.userId === user.id);
    if (userLibrary) {
      if (userLibrary.books.some(b => b.id === bookId)) return false;
      userLibrary.books.push({ id: bookId, status: 'reading', progress: 0 });
      setLibrary([...library]);
    } else {
      setLibrary([...library, { 
        userId: user.id, 
        books: [{ id: bookId, status: 'reading', progress: 0 }] 
      }]);
    }
    return true;
  };

  const removeFromLibrary = (bookId) => {
    if (!user) return false;

    const userLibrary = library.find(l => l.userId === user.id);
    if (userLibrary) {
      userLibrary.books = userLibrary.books.filter(b => b.id !== bookId);
      setLibrary([...library]);
      return true;
    }
    return false;
  };

  const updateReadingStatus = (bookId, status, progress = 0) => {
    if (!user) return false;

    const userLibrary = library.find(l => l.userId === user.id);
    if (userLibrary) {
      const bookEntry = userLibrary.books.find(b => b.id === bookId);
      if (bookEntry) {
        bookEntry.status = status;
        bookEntry.progress = progress;
        setLibrary([...library]);
        return true;
      }
    }
    return false;
  };

  const updateReadingProgress = (bookId, progress) => {
    if (!user) return false;

    const userLibrary = library.find(l => l.userId === user.id);
    if (userLibrary) {
      const bookEntry = userLibrary.books.find(b => b.id === bookId);
      if (bookEntry) {
        bookEntry.progress = progress;
        if (progress >= 100) {
          bookEntry.status = 'completed';
        }
        setLibrary([...library]);
        return true;
      }
    }
    return false;
  };

  const addReview = (bookId, rating, comment) => {
    if (!user) return false;

    const book = books.find(b => b.id === bookId);
    if (book) {
      const newReview = {
        id: Date.now(),
        userId: user.id,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0]
      };
      book.reviews.push(newReview);
      setBooks([...books]);
      return true;
    }
    return false;
  };

  const addBook = (bookData) => {
    if (!user || user.role !== 'admin') return false;

    const newBook = {
      id: books.length + 1,
      ...bookData,
      reviews: []
    };
    setBooks([...books, newBook]);
    return true;
  };

  const deleteBook = (bookId) => {
    if (!user || user.role !== 'admin') return false;

    setBooks(books.filter(book => book.id !== bookId));
    return true;
  };

  const getUserLibrary = () => {
    if (!user) return [];
    const userLibrary = library.find(l => l.userId === user.id);
    return userLibrary 
      ? userLibrary.books.map(bookEntry => ({
          ...books.find(b => b.id === bookEntry.id),
          status: bookEntry.status,
          progress: bookEntry.progress
        }))
      : [];
  };

  const value = {
    user,
    books,
    users,
    library,
    loading,
    login,
    register,
    logout,
    addToLibrary,
    removeFromLibrary,
    updateReadingStatus,
    updateReadingProgress,
    addReview,
    addBook,
    deleteBook,
    getUserLibrary
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 