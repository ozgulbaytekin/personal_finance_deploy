import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
//port tanımı env üzerinden alındığı için hem localde hem production'da sorunsuz çalışıyor

// middleware
app.use(cors());
app.use(express.json());


// SQLite veritabanını aç
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Veritabanı hatası:', err.message);
  } else {
    console.log('✅ SQLite veritabanına bağlanıldı.');
  }
});

// users tablosu
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);

// assets tablosu
db.run(`
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

// expenses tablosu
//db.run(`DROP TABLE IF EXISTS expenses`);  -> sadece tabloyu silmek için
db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    asset_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    frequency TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
  )
`);






app.post('/api/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email ve şifre gerekli' });

  const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
  stmt.run(email, password, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Kullanıcı zaten var.' });
    }
    res.json({ message: 'Kayıt başarılı', userId: this.lastID });
  });
  stmt.finalize();
});


app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: 'Bilgiler yanlış' });
      res.json({ message: 'Giriş başarılı', user: row });
    }
  );
});



// varlık ekleme
app.post('/api/add-asset', (req, res) => {
  const { user_id, name, amount } = req.body;

  if (!user_id || !name || !amount)
    return res.status(400).json({ error: 'Eksik veri gönderildi' });

  db.run(
    'INSERT INTO assets (user_id, name, amount) VALUES (?, ?, ?)',
    [user_id, name, amount],
    function (err) {
      if (err) {
        console.error('DB Insert Error:', err.message);
        return res.status(500).json({ error: 'Kayıt eklenemedi' });
      }

      res.json({ message: 'Varlık eklendi', id: this.lastID });
    }
  );
});

//varlık silme
app.delete('/api/delete-asset/:id/:userId', (req, res) => {
  const id = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);

  db.run(
    "DELETE FROM assets WHERE id = ? AND user_id = ?",
    [id, userId],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Sunucu hatası" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Varlık bulunamadı veya silme yetkiniz yok." });
      }

      res.json({ success: true });
    }
  );
});





// varlıkları listeleme
app.get('/api/assets/:userId', (req, res) => {
  const userId = req.params.userId;

  db.all('SELECT * FROM assets WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      console.error('DB Select Error:', err.message);
      return res.status(500).json({ error: 'Sorgu hatası' });
    }
    res.json(rows);
  });
});

//harcama ekleme
app.post('/api/add-expense', (req, res) => {
  const {
    user_id,
    asset_id,
    category,
    amount,
    date,
    frequency,
    description
  } = req.body;

  if (
    !user_id ||
    !asset_id ||
    !category ||
    !amount ||
    !date ||
    !frequency
  ) {
    return res.status(400).json({ error: 'Eksik veri gönderildi' });
  }

  // 🔒 TRANSACTION BAŞLAT
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 1️⃣ Asset kontrolü
    db.get(
      'SELECT id, amount FROM assets WHERE id = ? AND user_id = ?',
      [asset_id, user_id],
      (err, asset) => {
        if (err || !asset) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Seçilen kaynak bulunamadı' });
        }

        if (asset.amount < amount) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Yetersiz bakiye' });
        }

        // 2️⃣ Harcamayı ekle
        db.run(
          `
          INSERT INTO expenses
          (user_id, asset_id, category, amount, date, frequency, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            user_id,
            asset_id,
            category,
            amount,
            date,
            frequency,
            description || null
          ],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Harcama eklenemedi' });
            }

            const expenseId = this.lastID;

            // 3️⃣ Asset bakiyesini düş
            db.run(
              'UPDATE assets SET amount = amount - ? WHERE id = ? AND user_id = ?',
              [amount, asset_id, user_id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Bakiye güncellenemedi' });
                }

                // ✅ HER ŞEY BAŞARILI → COMMIT
                db.run('COMMIT');

                res.json({
                  id: expenseId,
                  user_id,
                  asset_id,
                  category,
                  amount,
                  date,
                  frequency,
                  description
                });
              }
            );
          }
        );
      }
    );
  });
});






//harcamaları listeleme
app.get("/api/expenses/:userId", (req, res) => {
  const userId = req.params.userId;

  db.all(
    `
    SELECT
      e.id,
      e.category,
      e.amount,
      e.date,
      e.frequency,
      e.description,
      a.name AS asset_name
    FROM expenses e
    JOIN assets a ON e.asset_id = a.id
    WHERE e.user_id = ?
    ORDER BY e.date DESC
    `,
    [userId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Sorgu hatası" });
      }
      res.json(rows);
    }
  );
});






app.listen(PORT, () => {
  console.log(` Server http://localhost:${PORT} adresinde çalışıyor`);
});
