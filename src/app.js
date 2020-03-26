// Database schema
// Title TEXT
// Description TEXT
// Ingredients TEXT
// Directions TEXT
// Image(Optional) TEXT(path to image)
// Food Category
// Tags TEXT
// The amount of times this recipe has been accessed/searched INT
// link to recipe if there is a url for the original recipe URL
// Related Account ID

// const bcryptjs = require('bcryptjs');

require('dotenv').config();

const express = require('express');
const { check, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const csp = require('helmet-csp');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

module.exports = (users, db) => {
  const app = express();

  // app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  function getMinutesInMilliseconds(minutes) {
    return minutes * 60 * 1000;
  }
  // millisecond * second * milliseconds
  const cookieAge = getMinutesInMilliseconds(120);

  app.use(session({
    cookie: {
      // secure: true,
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: cookieAge,
      sameSite: true,

    },
    secret: process.env.SECRET,
    name: 'id',
    // do more research into this because it depends
    // on the session store i use
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pgPromise: db,
      tableName: 'sessions',
    }),
  }));


  app.set('view engine', 'ejs');

  app.use(
    csp({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'blob:'],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          'https://fonts.gstatic.com',
          "'self'",
        ],
        // upgradeInsecureRequests: true,
        reportUri: '/report-violation',
      },
      reportOnly: true,
    }),
  );

  const reportCspViolation = (req, res) => {
    if (req.body) {
      console.log('CSP Violation: ', req.body);
    }
    res.status(204).end();
  };

  app.post('/report-violation', reportCspViolation);

  const signupNewUser = async (req, res) => {
    const userData = req.body;

    const user = {
      username: userData.username,
      email: userData.email,
      emailSpan: '',
    };

    // console.log(validationResult(req));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      // console.log(validationErrors);
      user.emailSpan = `${validationErrors.errors[0].value} is not a valid email`;
      res.status(200);
      res.render('pages/signup', {
        user,
      });
      return;
    }

    const previouslyUsedEmail = await users
      .checkCredentialsExist(userData)
      .catch((err) => err);

    if (previouslyUsedEmail) {
      user.emailSpan = 'Email not available';
      console.log('found duplicate user');

      res.status(200);
      res.render('pages/signup', { user });
    } else {
      await users.addUser(userData).catch((err) => err);
      // console.log('response: successfully added user');
      res.status(201);
      user.username = '';
      user.email = '';
      res.render('pages/login', { user });
    }
  };
  app.post('/signup',
    [
      check('username').trim().escape().stripLow()
        .isLength({ min: 4, max: 30 }),
      check('email').isEmail().normalizeEmail(),
      check('password').isLength({ min: 8, max: 50 }),
    ],
    signupNewUser,
  );

  const loginUser = async (req, res) => {
    const credentials = req.body;

    // console.log(validationResult(req));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };
      res.status(401);
      res.render('pages/login', {
        user,
      });
      return;
    }

    if (!(await users.isValidLogin(credentials))) {
      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };
      res.status(401);
      res.render('pages/login', {
        user,
      });
      return;
    }
    console.log(`old id: ${req.session.id}`);
    req.session.regenerate((err) => {
      if (err) {
        console.log(err);
      }
      console.log(`new id: ${req.session.id}`);
      req.session.user = credentials.email;
      res.redirect(303, '/recipes');
    });
  };

  app.post('/recipes_login',
    [
      check('email').isEmail().normalizeEmail(),
      check('password').isLength({ min: 8, max: 50 }),
    ],
    loginUser,
  );

  const logout = (req, res) => {
    req.sessionStore.get(req.session.id, (err, sesh) => {
      if (err) {
        console.log(err);
        return;
      }
      if (!sesh) {
        res.redirect(303, '/');
      }
    });
    req.sessionStore.destroy((err) => {
      if (err) {
        console.log(err);
        return;
      }
      res.redirect(303, '/');
    });
  };

  app.get('/logout', logout);

  app.get('/recipes', (req, res) => {
    req.sessionStore.get(req.session.id, (err, sesh) => {
      if (err) {
        console.log('err: ', err);
        return;
      }
      if (!sesh) {
        // res.status(401);
        res.redirect(303, '/login');
        // res.render('pages/login_plain');
        return;
      }
      res.status(200);
      res.render('pages/recipes');
    });
  });

  app.get('/new_recipe', (req, res) => {
    req.sessionStore.get(req.session.id, (err, sesh) => {
      if (err) {
        console.log(`err: ${err}`);
        return;
      }
      if (!sesh) {
        res.redirect(303, '/login');
        return;
      }
      res.status(200);
      res.render('pages/new_recipe');
      // res.send("got the recipe");
    });
  });

  app.post('/add_recipe', upload.any('recipe_image'), (req, res) => {
    req.sessionStore.get(req.session.id, (err, sesh) => {
      if (err) {
        console.log(`err: ${err}`);
        return;
      }
      if (!sesh) {
        res.redirect(303, '/login');
        return;
      }
      // console.log(req.files);
      console.log(req.body);
      res.status(200);
      res.render('pages/recipes');
    });
  });


  return { app };
};

// module.exports = function(app, usersDatabase) {
//   return new App(app, usersDatabase);
// }
// deleteUser
// updateUserInfo
// readUserInfo
// addUserRecipesTable
// updateUserRecipe
// deleteUserRecipe
// addUserRecipe
// get7RandomRecipes
