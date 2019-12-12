const sqlite = require('sqlite3');
const db = new sqlite.Database('data/db.sqlite3');
const enc = require('./encryption');

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price DOUBLE, author TEXT,imageUrl TEXT, createdAt TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, password TEXT, name TEXT, role INTEGER)');
  db.get('SELECT COUNT(*) AS CNT FROM books', (err, row) => {
    if (row.CNT > 0) {
      return;
    }

    const createdAt = new Date().toString();
    const stmt = db.prepare('INSERT INTO books VALUES (null, ?, ?, ?, ?, ?)');

    const books = [
      ['The Name of the Wind', 8.21, 'Patrick Rothfuss', 'https://kbimages1-a.akamaihd.net/Images/0b52f9bd-f9cf-4f2b-bad0-52b9e8b20dfa/255/400/False/image.jpg',createdAt],
      ['Animal Farm', 10.96, 'George Orwell', 'https://i.dr.com.tr/cache/600x600-0/originals/0000000447651-1.jpg',createdAt],
      ['Metro 2033', 12.36, 'Dimitry Glukhovski', 'https://i.dr.com.tr/cache/600x600-0/originals/0000000667877-1.jpg',createdAt],
      ["The Wise Man's Fear", 11.32, 'Patrick Rothfuss','https://i.dr.com.tr/cache/600x600-0/originals/0000000666684-1.jpg',createdAt],
      ['Koralin', 6.96, 'Neil Gaiman','https://i.dr.com.tr/cache/600x600-0/originals/0001822965001-1.jpg',createdAt],
      ['Norse Mythology', 10.46, 'Neil Gaiman','https://i.dr.com.tr/cache/600x600-0/originals/0001784514001-1.jpg',createdAt],
      ['Revival', 15.96, 'Stephen King','https://i.dr.com.tr/cache/600x600-0/originals/0000000611189-1.jpg',createdAt],
      ['The Talisman', 10.96, 'Stephen King','https://i.dr.com.tr/cache/600x600-0/originals/0000000416228-1.jpg',createdAt]
    ];
    for (let book of books) {
      stmt.run(book);
    }
    stmt.finalize();
  });
  db.get('SELECT COUNT(*) AS CNT FROM users', (err, row) => {
    if (row.CNT > 0) {
      return;
    }
    const stmt = db.prepare('INSERT INTO users VALUES (null, ?, ?, ?, ?)');

    const users = [
      ['tarik@gmail.com', enc.encryptPassword('takoloka'), 'Tarik', 1],
      ['berk@gmail.com', enc.encryptPassword('berkaksoyy'), 'Berk', 1],
      ['ertug@gmail.com',enc.encryptPassword('ertugsagman'), 'Ertug', 1]
    ];
    for (let user of users) {
      stmt.run(user);
    }
    stmt.finalize();
  });
});

module.exports = db;
