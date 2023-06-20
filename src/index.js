const express = require("express");
const db = require("./db");
const ejsLayouts = require("express-ejs-layouts");
const enc = require("./encryption");
const { check, validationResult } = require("express-validator");
const session = require("express-session");

const app = express();
const pageSize = 8;

function isAdmin(req, res, next) {
  if (req.session.musician && req.session.musician.isAdmin) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static("src/public"));
app.use(ejsLayouts);
app.use(
  session({
    secret: `NAJSnj123djnsfjhsJBSa123`,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(function (req, res, next) {
  res.locals.musician = req.session.musician;
  next();
});

app.set("views", "src/views");
app.set("view engine", "ejs");

app.get("/", (req, res, next) => {
  db.get("SELECT COUNT(*) as COUNT FROM bands", (err, row) => {
    if (err) {
      return next(err);
    }
    const maxPage = Math.ceil(row.COUNT / pageSize);

    if (!req.query.page) req.query.page = 1;

    let queryString = "";

    if (req.query.name || req.query.genre) {
      queryString +=
        " WHERE name LIKE '%" +
        req.query.name +
        "%' AND genre_id = " +
        req.query.genre;
    }

    db.all(
      `SELECT * FROM bands${queryString} LIMIT ${pageSize} OFFSET ${pageSize * (req.query.page - 1)
      }`,
      (err, bands) => {
        if (err) {
          return next(err);
        }
        db.all("SELECT * FROM genres", (err, genres) => {
          bands.map((band) => {
            band.genre = genres.find(
              (genre) => genre.id === band.genre_id
            ).name;
          });
          res.render("bands/index", { bands, genres, maxPage });
        });
      }
    );
  });
});

app.get("/musicians", (req, res, next) => {
  db.get("SELECT COUNT(*) as COUNT FROM musicians", (err, row) => {
    if (err) {
      return next(err);
    }
    const maxPage = Math.ceil(row.COUNT / pageSize);

    if (!req.query.page) req.query.page = 1;

    let queryString = "";

    if (req.query.name || req.query.genre) {
      queryString +=
        " WHERE name LIKE '%" +
        req.query.name +
        "%' AND genre_id = " +
        req.query.genre +
        " AND instrument_id = " +
        req.query.instrument;
    }

    db.all(
      `SELECT * FROM musicians${queryString} LIMIT ${pageSize} OFFSET ${pageSize * (req.query.page - 1)
      }`,
      (err, musicians) => {
        if (err) {
          return next(err);
        }
        db.all("SELECT * FROM genres", (err, genres) => {
          musicians.map((musician) => {
            musician.genre = genres.find(
              (genre) => genre.id === musician.genre_id
            ).name;
          });
          db.all("SELECT * FROM instruments", (err, instruments) => {
            musicians.map((musician) => {
              musician.instrument = instruments.find(
                (instrument) => instrument.id === musician.instrument_id
              ).name;
            });
            res.render("musicians/index", {
              musicians,
              genres,
              instruments,
              maxPage,
            });
          });
        });
      }
    );
  });
});

app.get("/musician/:id", isAdmin, (req, res) => {
  db.all(
    "SELECT * FROM musicians WHERE id = '" + req.params.id + "'",
    (err, musicians) => {
      const musician = musicians[0];
      db.all("SELECT * FROM genres", (err, genres) => {
        musician.genre = genres.find((genre) => genre.id === musician.genre_id);
        db.all("SELECT * FROM instruments", (err, instruments) => {
          musician.instrument = instruments.find(
            (instrument) => instrument.id === musician.instrument_id
          );
          res.render("musicians/profile", { musician, genres, instruments });
        });
      });
    }
  );
});

app.get("/musicians/edit/:name", isAdmin, (req, res) => {
  db.all(
    "SELECT * FROM musicians WHERE name = '" + req.params.name + "'",
    (err, musicians) => {
      const musician = musicians[0];
      db.all("SELECT * FROM genres", (err, genres) => {
        db.all("SELECT * FROM instruments", (err, instruments) => {
          res.render("musicians/edit", { musician, genres, instruments });
        });
      });
    }
  );
});

app.post("/musicians/edit/:name", isAdmin, (req, res) => {
  const musicianData = req.params;
  const stmt = db.prepare(
    "UPDATE musicians SET description = ?, picture = ?, genre_id = ?, instrument_id = ?, skill = 0 WHERE name = '" +
    musicianData.name +
    "'"
  );
  const musician = [
    req.body.description,
    req.body.picture,
    req.body.genre_id,
    req.body.instrument_ids,
  ];
  stmt.run(musician);
  stmt.finalize();

  res.redirect("/");
});

app.post("/band/apply-band/:band_id", isAdmin, (req, res) => {
  console.log(req.session.musician.name);
  db.all("SELECT * FROM musicians WHERE name = '" + req.session.musician.name + "'", (err, musicians) => {
    console.log(musicians);
    const stmt = db.prepare("INSERT INTO band_members VALUES (null, ?, ?, 0)");
    const musician = [musicians[0].id, req.params.band_id];
    stmt.run(musician);
    stmt.finalize();

    res.redirect("/");
  });
});

app.get("/bands/add", isAdmin, (req, res) => {
  db.all("SELECT * FROM genres", (err, genres) => {
    res.render("bands/add-band", { genres });
  });
});

app.post("/bands/add", isAdmin, (req, res) => {
  const stmt = db.prepare(`INSERT INTO bands VALUES (null, ?, ?, ?, ?, ?)`);
  console.log(req.session.musician.name);
  const band = [
    req.body.name,
    req.body.description,
    req.body.image,
    req.session.musician.name,
    req.body.genre_id,
  ];
  stmt.run(band, () => {
    res.redirect("/");
  });
  stmt.finalize();
});

app.post("/band/approve-member/:band_id/:member_id", isAdmin, (req, res) => {
  const stmt = db.prepare(
    `UPDATE band_members SET approved = 1 WHERE band_id=` +
    req.params.band_id +
    " AND musician_id=" +
    req.params.member_id
  );
  stmt.run([], () => {
    res.redirect("/band/" + req.params.band_id);
  });
  stmt.finalize();
});

app.post("/band/reject-member/:band_id/:member_id", isAdmin, (req, res) => {
  const stmt = db.prepare(
    `DELETE FROM band_members WHERE band_id=` +
    req.params.band_id +
    " AND musician_id=" +
    req.params.member_id
  );
  stmt.run([], () => {
    res.redirect("/band/" + req.params.band_id);
  });
  stmt.finalize();
});

app.get("/band/:id", (req, res, next) => {
  db.get("SELECT * FROM bands WHERE id=" + req.params.id, (err, band) => {
    if (err) {
      return next(err);
    }
    if (!band) {
      return res.render("error/404");
    }
    db.all("SELECT * FROM genres", (err, genres) => {
      band.genre = genres.find((genre) => genre.id === band.genre_id).name;
      const band_members = [];
      db.all(
        "SELECT * FROM band_members WHERE band_id = " + req.params.id,
        (err, bands_members) => {
          if (bands_members) {
            let id_list = "";
            bands_members.map(
              (member) => (id_list += member.musician_id + ",")
            );
            id_list = id_list.slice(0, id_list.length - 1);
            db.all(
              "SELECT * FROM musicians where id IN (" + id_list + ")",
              (err, musician) => {
                for (let i = 0; i < musician.length; i++) {
                  const member = bands_members.find(
                    (m) => m.musician_id === musician[i].id
                  );
                  band_members.push({
                    ...musician[i],
                    approved: member && member.approved,
                  });
                  console.log(i);
                }
                console.log(band_members);
                res.render("bands/band", { band, band_members });
              }
            );
          }
        }
      );
    });
  });
});

app.post("/band/edit/:id", isAdmin, (req, res, next) => {
  const newBook = req.params;
  const stmt = db.prepare(
    "UPDATE bands SET name = ?, price = ?, author = ?, imageUrl = ? WHERE id = " +
    newBook.id
  );
  const band = [req.body.name, req.body.price, req.body.author, req.body.image];
  stmt.run(band);
  stmt.finalize();
  res.redirect("/");
});

app.post("/band/delete/:id", isAdmin, (req, res) => {
  if (req.params.id) {
    db.all(`DELETE FROM bands WHERE id=${req.params.id}`, (err) => {
      if (err) {
        return console.log(err);
      }
      res.redirect("/");
    });
  }
});

app.get("/login", (req, res) => {
  res.render("musicians/login");
});

app.post(
  "/login",
  check("email").isEmail(),
  check("password").not().isEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.mapped());
      return res.render("musicians/login", { errors: errors.mapped() });
    }
    db.get(
      "SELECT * FROM musicians WHERE email='" + req.body.email + "'",
      (err, musician) => {
        if (err) {
          return next(err);
        }
        if (!musician) {
          return res.render("musicians/login", { errEmail: "Email is wrong!" });
        }

        if (musician.password === enc.encryptPassword(req.body.password)) {
          req.session.musician = {
            id: musician.id,
            name: musician.name,
            email: musician.email,
            isAdmin: musician.role == 0 ? false : true,
          };

          res.redirect("/");
        } else {
          return res.render("musicians/login", {
            errPassword: "Password is wrong!",
          });
        }
      }
    );
  }
);

app.get("/register", (req, res) => {
  res.render("musicians/register");
});

app.post("/logout", (req, res) => {
  if (req.session && req.session.musician) {
    delete req.session.musician;
  }
  res.redirect("/");
});

app.post(
  "/register",
  check("email").isEmail(),
  check("name").not().isEmpty(),
  check("password").not().isEmpty(),
  check("pwConfirm").not().isEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    let confirm = false;
    if (req.body.password === req.body.pwConfirm) {
      confirm = true;
    }

    if (!errors.isEmpty()) {
      const err = errors.mapped();
      return res.render("musicians/register", { errors: err, confirm });
    }

    const stmt = db.prepare(
      "INSERT INTO musicians VALUES (null, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const musician = [
      req.body.name,
      req.body.email,
      enc.encryptPassword(req.body.password),
      "Hello I am a new Musician",
      "",
      1,
      1,
      0,
    ];
    stmt.run(musician);
    stmt.finalize();

    res.redirect("/login");
  }
);

app.get("/assessment/:name", (req, res) => {
  res.render("musicians/assessment");
});

app.use((err, req, res, next) => {
  console.log(err);
  res.render("error/500");
});

app.listen(8000, () => {
  console.log("Listening on port 8000!");
});
