const sqlite3 = require('sqlite3'); const db = new sqlite3.Database('db.sqlite'); db.all('SELECT name, image_path FROM characters', (err, rows) => { console.log(rows); });
