export const users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    avatar: "https://ui-avatars.com/api/?name=Admin+User&background=random"
  },
  {
    id: 2,
    name: "John Reader",
    email: "john@example.com",
    password: "reader123",
    role: "user",
    avatar: "https://ui-avatars.com/api/?name=John+Reader&background=random"
  }
];

export const books = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Ym9va3xlbnwwfHwwfHx8MA%3D%3D",
    rating: 4.5,
    genre: "Classic",
    publishedYear: 1925,
    pages: 180,
    description: "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, the novel depicts narrator Nick Carraway's interactions with mysterious millionaire Jay Gatsby and Gatsby's obsession to reunite with his former lover, Daisy Buchanan.",
    pdfUrl: "https://www.gutenberg.org/files/64317/64317-h/64317-h.htm",
    reviews: [
      {
        id: 1,
        rating: 5,
        comment: "A masterpiece of American literature. The prose is beautiful and the story is timeless.",
        date: "2024-01-15"
      },
      {
        id: 2,
        rating: 4,
        comment: "Great book, but the ending was a bit disappointing.",
        date: "2024-02-20"
      }
    ]
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGJvb2t8ZW58MHx8MHx8fDA%3D",
    rating: 4.8,
    genre: "Fiction",
    publishedYear: 1960,
    pages: 281,
    description: "To Kill a Mockingbird is a novel by Harper Lee published in 1960. It was immediately successful, winning the Pulitzer Prize, and has become a classic of modern American literature.",
    pdfUrl: "https://www.gutenberg.org/files/26508/26508-h/26508-h.htm",
    reviews: [
      {
        id: 1,
        rating: 5,
        comment: "One of the most important books ever written. A must-read for everyone.",
        date: "2024-01-10"
      }
    ]
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    cover: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Ym9va3xlbnwwfHwwfHx8MA%3D%3D",
    rating: 4.6,
    genre: "Dystopian",
    publishedYear: 1949,
    pages: 328,
    description: "1984 is a dystopian social science fiction novel by English novelist George Orwell. It was published in June 1949 by Secker & Warburg as Orwell's ninth and final book completed in his lifetime.",
    pdfUrl: "https://www.gutenberg.org/files/3268/3268-h/3268-h.htm",
    reviews: [
      {
        id: 1,
        rating: 5,
        comment: "A chilling and prophetic masterpiece that remains relevant today.",
        date: "2024-02-15"
      },
      {
        id: 2,
        rating: 4,
        comment: "Disturbing but important read. Orwell's vision of totalitarianism is terrifying.",
        date: "2024-03-01"
      }
    ]
  }
];

export const library = [
  {
    userId: 2,
    books: [1]
  }
];