const express = require("express");
const db = require("./db");
const ejsLayouts = require("express-ejs-layouts");
const enc = require("./encryption");
const { check, validationResult } = require("express-validator");
const session = require("express-session");

const app = express();

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  } else {
    return res.redirect('/login');
  }
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static("src/public"));
app.use(ejsLayouts);
app.use(
  session({
    secret: `NAJSnj123djnsfjhsJBSa123`,
    resave: false,
    saveUninitialized: false
  })
);
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  next();
});

app.set("views", "src/views");
app.set("view engine", "ejs");

app.get("/", (req, res, next) => {
  db.all("SELECT * FROM books", (err, books) => {
    if (err) {
      return next(err);
    }
    res.render("books/index", { books });
  });
});

app.get("/books/add", isAdmin, (req, res) => {
  res.render("books/add-book");
});

app.post("/books/add", isAdmin, (req, res) => {
  const book = req.body;
  book.createdAt = new Date().toString();
  const stmt = db.prepare("INSERT INTO books VALUES (null, ?, ?, ?, ?, ?)");
  stmt.run(
    [book.name, book.price, book.author, book.image, book.createdAt],
    () => {
      res.redirect("/");
    }
  );
  stmt.finalize();
});

app.get("/book/:id", (req, res, next) => {
  db.get("SELECT * FROM books WHERE id=" + req.params.id, (err, book) => {
    if (err) {
      return next(err);
    }
    if (!book) {
      return res.render("error/404");
    }
    res.render("books/book", { book });
  });
});

app.post("/book/:id", isAdmin, (req, res, next) => {
  const newBook = req.params;
  const stmt = db.prepare("UPDATE books SET name = ?, price = ?, author = ?, imageUrl = ? WHERE id = " + newBook.id);
    const book = [
      req.body.name,
      req.body.price,
      req.body.author,
      req.body.image
    ];
    stmt.run(book);
    stmt.finalize();
    res.redirect('/');
});

app.post("/book/delete/:id", isAdmin, (req, res) => {
  if(req.params.id){
    db.all(`DELETE FROM books WHERE id=${req.params.id}`, (err) => {
      if(err){
        return console.log(err);
      }
      res.redirect("/");
    });
  }
});

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.post(
  "/login",
  check("email").isEmail(),
  check("password")
    .not()
    .isEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.mapped());
      return res.render("users/login", { errors: errors.mapped() });
    }
    db.get(
      "SELECT * FROM users WHERE email='" + req.body.email + "'",
      (err, user) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.render("users/login", { errEmail: "Email is wrong!" });
        }

        if (user.password === enc.encryptPassword(req.body.password)) {
          req.session.user = {
            name: user.name,
            email: user.email,
            isAdmin: user.role == 0 ? false : true
          };

          res.redirect("/");
        } else {
          return res.render("users/login", {
            errPassword: "Password is wrong!"
          });
        }
      }
    );
  }
);

app.get("/register", (req, res) => {
  res.render("users/register");
});

app.post("/logout", (req, res) => {
  if (req.session && req.session.user) {
    delete req.session.user;
  }
  res.redirect("/");
});

app.post(
  "/register",
  check("email").isEmail(),
  check("name")
    .not()
    .isEmpty(),
  check("password")
    .not()
    .isEmpty(),
  check("pwConfirm")
    .not()
    .isEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    let confirm = false;
    if (req.body.password === req.body.pwConfirm) {
      confirm = true;
    }

    if (!errors.isEmpty()) {
      const err = errors.mapped();
      return res.render("users/register", { errors: err, confirm });
    }

    const stmt = db.prepare("INSERT INTO users VALUES (null, ?, ?, ?, ?)");
    const user = [
      req.body.email,
      enc.encryptPassword(req.body.password),
      req.body.name,
      0
    ];
    stmt.run(user);
    stmt.finalize();

    req.session.user = {
      name: req.body.name,
      email: req.body.email,
      isAdmin: false
    };

    res.redirect("/");
  }
);

app.use((err, req, res, next) => {
  res.render("error/500");
});

app.listen(8000, () => {
  console.log("Listening on port 8000!");
});
