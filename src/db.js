const sqlite = require('sqlite3');
const db = new sqlite.Database('data/db.sqlite3');
const enc = require('./encryption');

db.serialize(() => {
  db.get('PRAGMA foreign_keys = ON');
  db.run('CREATE TABLE IF NOT EXISTS genres (id INTEGER PRIMARY KEY, name TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS instruments (id INTEGER PRIMARY KEY, name TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS bands (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, picture TEXT, lead_musician TEXT, genre_id INTEGER, FOREIGN KEY (genre_id) REFERENCES genres (id))');
  db.run('CREATE TABLE IF NOT EXISTS musicians (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, description TEXT, picture TEXT, genre_id INTEGER, instrument_id INTEGER, skill DOUBLE, FOREIGN KEY (genre_id) REFERENCES genres (id), FOREIGN KEY (instrument_id) REFERENCES instruments (id))');
  db.run('CREATE TABLE IF NOT EXISTS musicians_genres (id INTEGER PRIMARY KEY AUTOINCREMENT, musician_id INTEGER, genre_id INTEGER, FOREIGN KEY (musician_id) REFERENCES musicians (id), FOREIGN KEY (genre_id) REFERENCES genres (id))');
  db.run('CREATE TABLE IF NOT EXISTS bands_genres (id INTEGER PRIMARY KEY AUTOINCREMENT, band_id INTEGER, genre_id INTEGER, FOREIGN KEY (band_id) REFERENCES bands (id), FOREIGN KEY (genre_id) REFERENCES genres (id))');
  db.run('CREATE TABLE IF NOT EXISTS band_members (id INTEGER PRIMARY KEY AUTOINCREMENT, musician_id INTEGER, band_id INTEGER, FOREIGN KEY (musician_id) REFERENCES musicians (id), FOREIGN KEY (band_id) REFERENCES bands (id))');
  db.run('CREATE TABLE IF NOT EXISTS band_history (id INTEGER PRIMARY KEY AUTOINCREMENT, musician_id INTEGER, band_id INTEGER, FOREIGN KEY (musician_id) REFERENCES musicians (id), FOREIGN KEY (band_id) REFERENCES bands (id))');
  db.get('SELECT COUNT(*) AS CNT FROM genres', (err, row) => {
    if (row.CNT > 0) {
      return;
    }

    const stmt = db.prepare('INSERT INTO genres VALUES (?, ?)');

    const genres = [
      [1, 'Rock'],
      [2, 'Metal'],
      [3, 'Classical']
    ];
    for (let genre of genres) {
      stmt.run(genre);
    }
    stmt.finalize();
  });
  db.get('SELECT COUNT(*) AS CNT FROM instruments', (err, row) => {
    if (row.CNT > 0) {
      return;
    }

    const stmt = db.prepare('INSERT INTO instruments VALUES (?, ?)');

    const instruments = [
      [1, 'Guitar'],
      [2, 'Drums'],
      [3, 'Vocals']
    ];
    for (let instrument of instruments) {
      stmt.run(instrument);
    }
    stmt.finalize();
  });
  db.get('SELECT COUNT(*) AS CNT FROM bands', (err, row) => {
    if (row.CNT > 0) {
      return;
    }

    //const createdAt = new Date().toString();
    const stmt = db.prepare('INSERT INTO bands VALUES (null, ?, ?, ?, ?, ?)');

    const bands = [
      ['The Name of the Wind', 'Patrick Rothfuss', 'https://kbimages1-a.akamaihd.net/Images/0b52f9bd-f9cf-4f2b-bad0-52b9e8b20dfa/255/400/False/image.jpg', "TakoLoka", 1],
      ['Animal Farm', 'Dimitry Glukhovski', 'https://kbimages1-a.akamaihd.net/Images/0b52f9bd-f9cf-4f2b-bad0-52b9e8b20dfa/255/400/False/image.jpg', "TakoLoka", 2],
      ['Metro 2033', 'Dimitry Glukhovski', 'https://kbimages1-a.akamaihd.net/Images/0b52f9bd-f9cf-4f2b-bad0-52b9e8b20dfa/255/400/False/image.jpg', "Berk", 1]
    ];
    for (let band of bands) {
      stmt.run(band);
    }
    stmt.finalize();
  });
  db.get('SELECT COUNT(*) AS CNT FROM musicians', (err, row) => {
    if (row.CNT > 0) {
      return;
    }
    const stmt = db.prepare('INSERT INTO musicians VALUES (null, ?, ?, ?, ?, ?, ?, ?, ?)');

    const musicians = [
      ['TakoLoka', 'tarik@gmail.com', enc.encryptPassword('takoloka'), 'Desc', "https://kbimages1-a.akamaihd.net/Images/0b52f9bd-f9cf-4f2b-bad0-52b9e8b20dfa/255/400/False/image.jpg", 1, 2, 0],
      ['hgunes', 'hgunes@gmail.com', enc.encryptPassword('hgunes'), 'Desc 1', "https://kbimages1-a.akamaihd.net/Images/0b52f9bd-f9cf-4f2b-bad0-52b9e8b20dfa/255/400/False/image.jpg", 1, 1, 0],
      ['tankut', 'tankut@gmail.com', enc.encryptPassword('tankut'), 'Desc 2', "https://kbimages1-a.akamaihd.net/Images/0b52f9bd-f9cf-4f2b-bad0-52b9e8b20dfa/255/400/False/image.jpg", 1, 2, 0],
    ];
    for (let musician of musicians) {
      stmt.run(musician);
    }
    stmt.finalize();
  });
});

module.exports = db;
