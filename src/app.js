require('dotenv').config();
const fs = require('fs');

const express = require('express');
const {
  check,
  validationResult,
  body,
  query,
} = require('express-validator');
const bodyParser = require('body-parser');
const csp = require('helmet-csp');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const multer = require('multer');
const validator = require('validator');
const morgan = require('morgan');
const path = require('path');
const SonicChannelSearch = require('sonic-channel').Search;
const SonicChannelIngest = require('sonic-channel').Ingest;
const { RateLimiterPostgres } = require('rate-limiter-flexible');

const logger = require('./log.js');

logger.logger.emitErrs = false;

const sonicChannelSearch = new SonicChannelSearch({
  host: '::1',
  port: 1491,
  auth: process.env.SONIC_PASSWORD,
}).connect({
  connected: () => {
    logger.info('sonic channel connected to host for search');
  },

  disconnected: () => {
    logger.error('sonic channel is now disconnected');
  },

  timeout: () => {
    logger.error('sonic channel connection timed out');
  },

  retrying: () => {
    logger.error('trying to reconnect to sonic channel');
  },

  error: () => {
    logger.error('sonic channel failed to connect to host');
  },
});

const sonicChannelIngest = new SonicChannelIngest({
  host: '::1', // Or '127.0.0.1' if you are still using IPv4
  port: 1491, // Default port is '1491'
  auth: 'SecretPassword', // Authentication password (if any)
}).connect({
  connected: () => {
    // Connected handler
    logger.info('Sonic Channel succeeded to connect to host (ingest).');
  },

  disconnected: () => {
    // Disconnected handler
    logger.error('Sonic Channel is now disconnected (ingest).');
  },

  timeout: () => {
    // Timeout handler
    logger.error('Sonic Channel connection timed out (ingest).');
  },

  retrying: () => {
    // Retry handler
    logger.error('Trying to reconnect to Sonic Channel (ingest)...');
  },

  error: (error) => {
    // Failure handler
    logger.error('Sonic Channel failed to connect to host (ingest).', error);
  },
});

const maxConsecutiveLoginAttempts = 5;
const maxLoginAttempts = 10;

module.exports = (users, db) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: async (req, file, cb) => {
      const originalNameSplit = file.originalname.split('.');
      const extension = originalNameSplit[originalNameSplit.length - 1];
      let newFileName = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
      while (await users.isImageNameDuplicate(`uploads/${newFileName}`)) {
        newFileName = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
      }
      cb(null, newFileName);
    },
  });

  const upload = multer({ storage });

  const app = express();

  app.use(morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' }),
  }));

  const loginRateLimitingOptions = {
    storeClient: db.$pool,
    points: maxConsecutiveLoginAttempts, // number of points
    duration: 60, // per seconds

    tableName: 'rate_limited',
    keyPrefix: 'consecutive_ip_login_fail',
    storeType: 'client',

    blockDuration: 60, // in seconds
  };
  const maxLoginRateLimitingOptions = {
    storeClient: db.$pool,
    points: maxLoginAttempts, // number of points
    duration: 120, // per seconds

    tableName: 'max_rate_limited',
    keyPrefix: 'max_ip_login_fail',
    storeType: 'client',

    blockDuration: 120, // in seconds
  };

  // TODO make another ready function for the max login attempts limiter
  const loginRateLimiterReady = (err) => {
    if (err) {
      logger.error(err);
    } else {
      logger.info('login rate limiting table is ready');
    }
  };
  const maxLoginRateLimiterReady = (err) => {
    if (err) {
      logger.error(err);
    } else {
      logger.info('max login rate limiting table is ready');
    }
  };

  const loginRateLimiter = new RateLimiterPostgres(loginRateLimitingOptions, loginRateLimiterReady);
  const maxLoginRateLimiter = new RateLimiterPostgres(maxLoginRateLimitingOptions, maxLoginRateLimiterReady);

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: ['json', 'application/csp-report'] }));

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
        scriptSrc: [
          "'self'",
          'https://unpkg.com/react@16/umd/react.development.js',
          'https://unpkg.com/react-dom@16/umd/react-dom.development.js',
        ],
        imgSrc: ["'self'", 'blob:'],
        styleSrc: [
          "'self'",
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          'https://fonts.gstatic.com',
          "'self'",
        ],
        // upgradeInsecureRequests: true,
        reportUri: '/report-violation',
        blockAllMixedContent: true,
        connectSrc: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
      },
      browserSniff: false,
      // reportOnly: true,
    }),
  );

  const reportCspViolation = (req, res) => {
    // if (req.body) {
      // console.log('CSP Violation: ', req.body);
    // }
    res.sendStatus(204);
  };

  app.post('/report-violation', reportCspViolation);

  const signupNewUser = async (req, res) => {
    const userData = req.body;

    const user = {
      email: userData.email,
      emailSpan: '',
      confirmPassword: '',
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
      .catch((err) => console.log(err));

    if (previouslyUsedEmail) {
      user.emailSpan = 'Email not available';
      console.log('found duplicate user');

      res.status(200);
      res.render('pages/signup', { user });
    } else if (userData.password !== userData.confirm_password) {
      user.confirmPassword = 'Confirmed password must match password.';
      console.log('found duplicate user');
      res.status(200);
      res.render('pages/signup', { user });
    } else {
      await users.addUser(userData).catch((err) => console.log(err));
      res.status(201);
      res.render('pages/login_plain');
    }
  };
  app.post('/signup',
    [
      check('email').isEmail().normalizeEmail(),
      check('password').isLength({ min: 8, max: 50 }),
    ],
    signupNewUser,
  );

  const loginUser = async (req, res) => {
    const credentials = req.body;

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

    const resMaxLoginLimiter = await maxLoginRateLimiter.get(req.ip);

    if (resMaxLoginLimiter && resMaxLoginLimiter.consumedPoints > maxLoginAttempts) {
      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };

      const timeBeforeTry = Math.round(resMaxLoginLimiter.msBeforeNext / 1000);
      user.timeBeforeTry = `Try logging in after ${timeBeforeTry} seconds`;
      res.status(429);
      res.render('pages/login', {
        user,
      });
      return;
    }

    const resLoginLimiter = await loginRateLimiter.get(req.ip);

    if (resLoginLimiter && resLoginLimiter.consumedPoints > maxConsecutiveLoginAttempts) {
      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };
      const timeBeforeTry = Math.round(resLoginLimiter.msBeforeNext / 1000);
      user.timeBeforeTry = `Try logging in after ${timeBeforeTry} seconds`;
      res.status(429);
      res.render('pages/login', {
        user,
      });
      return;
    }

    if (!(await users.isValidLogin(credentials))) {
      await Promise.all([
        loginRateLimiter.consume(req.ip),
        maxLoginRateLimiter.consume(req.ip),
      ])
        .catch((error) => console.log(error));

      const [consecutiveLoginRes, maxLoginRes] = await Promise.all([
        loginRateLimiter.get(req.ip),
        maxLoginRateLimiter.get(req.ip),
      ])
        .catch((error) => console.log(error));

      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };

      if (maxLoginRes && maxLoginRes.consumedPoints > maxLoginAttempts) {
        const timeBeforeTry = Math.round(maxLoginRes.msBeforeNext / 1000);
        user.timeBeforeTry = `Try logging in after ${timeBeforeTry} seconds`;
        res.status(429);
        res.render('pages/login', {
          user,
        });
      } else if (consecutiveLoginRes && consecutiveLoginRes.consumedPoints > maxConsecutiveLoginAttempts) {
        const timeBeforeTry = Math.round(consecutiveLoginRes.msBeforeNext / 1000);
        user.timeBeforeTry = `Try logging in after ${timeBeforeTry} seconds`;
        res.status(429);
        res.render('pages/login', {
          user,
        });
      } else {
        res.status(401);
        res.render('pages/login', {
          user,
        });
      }
      return;
    }
    req.session.regenerate(async (err) => {
      if (err) {
        console.log(err);
      }

      const consecutiveLoginRes = await loginRateLimiter.get(req.ip)
        .catch((error) => console.log(error));
      if (consecutiveLoginRes) {
        await loginRateLimiter.delete(req.ip)
          .catch((error) => console.log(error));
      }

      const maxLoginRes = await maxLoginRateLimiter.get(req.ip)
        .catch((error) => console.log(error));
      if (maxLoginRes) {
        await maxLoginRateLimiter.delete(req.ip)
          .catch((error) => console.log(error));
      }
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

  const addRecipe = (req, res) => {
    req.sessionStore.get(req.session.id, async (err, sess) => {
      if (err) {
        console.log(`err: ${err}`);
        return;
      }
      if (!sess) {
        res.redirect(303, '/login');
        return;
      }
      const validationErrors = validationResult(req);
      const recipe = req.body;
      if (!validationErrors.isEmpty()) {
        console.log('validation error: ', validationErrors);
        res.sendStatus(401);
        return;
      }

      if (await users.isDuplicateTitle(recipe.title)) {
        res.status(203);
        res.send(JSON.stringify({
          recipe,
          error: 'recipe title cannot be a duplicate of another recipe',
        }));
        return;
      }
      const user = sess.user;

      const makeRecipeString = (searchRecipe) => {
        let ingredients = '';
        if (Array.isArray(searchRecipe.ingredients)) {
          ingredients = searchRecipe.ingredients.join(' ');
        } else {
          ingredients = searchRecipe.ingredients;
        }
        let directions = '';
        if (Array.isArray(searchRecipe.directions)) {
          directions = searchRecipe.directions.join(' ');
        } else {
          directions = searchRecipe.directions;
        }

        return [
          searchRecipe.title,
          searchRecipe.description,
          ingredients,
          directions,
        ].join(' ').split('-').join(' ');
      };

      const replacedTitle = recipe.title.split(' ').join('+');
      const objectId = [user, replacedTitle].join(':');

      await sonicChannelIngest.push(
        'recipes',
        user,
        objectId,
        makeRecipeString(recipe),
        'eng',
      )
      .catch((error) => console.error(error));

      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients = recipe.ingredients.join('\n');
      }
      if (Array.isArray(recipe.directions)) {
        recipe.directions = recipe.directions.join('\n');
      }
      if (Array.isArray(recipe.ingredient_amount)) {
        recipe.ingredient_amount = recipe.ingredient_amount.join('\n');
      }

      await users.addRecipe(recipe, user, req.files);
      res.status(200);
      res.render('pages/recipes');
    });
  };

  const checkIngredients = (ingredients, { req }) => {
    if (Array.isArray(ingredients)) {
      for (let i = 0; i < ingredients.length; i += 1) {
        ingredients[i] = validator.trim(ingredients[i]);
        ingredients[i] = validator.escape(ingredients[i]);

        if (validator.isEmpty(ingredients[i])) {
          return false;
        }
      }
      return true;
    }

    ingredients = validator.trim(ingredients);
    ingredients = validator.escape(ingredients);
    if (validator.isEmpty(ingredients)) {
      return false;
    }
    req.body.ingredients = ingredients;
    return true;
  };
  const checkIngredientQuantity = (quantities, { req }) => {
    if (Array.isArray(quantities)) {
      for (let i = 0; i < quantities.length; i += 1) {
        quantities[i] = validator.trim(quantities[i]);
        quantities[i] = validator.escape(quantities[i]);

        if (validator.isEmpty(quantities[i])) {
          return false;
        }
      }
      return true;
    }

    let quantity = validator.trim(quantities);
    quantity = validator.escape(quantity);
    if (validator.isEmpty(quantity)) {
      return false;
    }
    req.body.ingredient_amount = quantity;
    return true;
  };
  const checkDirections = (directions, { req }) => {
    if (Array.isArray(directions)) {
      for (let i = 0; i < directions.length; i += 1) {
        directions[i] = validator.trim(directions[i]);
        directions[i] = validator.escape(directions[i]);

        if (validator.isEmpty(directions[i])) {
          return false;
        }
      }
      return true;
    }

    let direction = validator.trim(directions);
    direction = validator.escape(direction);
    if (validator.isEmpty(direction)) {
      return false;
    }
    req.body.directions = direction;
    return true;
  };
  app.post(
    '/add_recipe',
    upload.any('recipe_image'),
    [
      body('title').trim().not().isEmpty()
        .isLength({ min: 3, max: 100 })
        .escape(),
      body('description').trim().isLength({ min: 0, max: 240 }).escape(),
      body('ingredients', 'Provided ingredient must not be empty.')
        .custom(checkIngredients),
      body('ingredient_amount', 'Provided ingredient quantity cannot be empty.')
        .custom(checkIngredientQuantity),
      body('directions', 'Provided direction cannot be empty.')
        .custom(checkDirections),
      body('original_url').if(body('original_url').not().isEmpty())
        .trim()
        .not()
        .isEmpty()
        .isURL(),
      body('food_category').if(body('food_category').not().isEmpty())
        .trim()
        .not()
        .isEmpty()
        .escape(),
    ],
    addRecipe,
  );

  // add session checking for this
  app.get('/all_recipes', async (req, res) => {
    req.sessionStore.get(req.session.id, async (err, sess) => {
      if (err) {
        console.log(`err: ${err}`);
        return;
      }
      if (!sess) {
        res.redirect(303, '/login');
        return;
      }
      const recipes = await users.getRecipes(req.session.user);
      res.status(200);
      for (let i = 0; i < recipes.length; i += 1) {
        recipes[i].title = validator.unescape(recipes[i].title);
      }
      const images = fs.readdirSync('./reshipi-frontend/images/food_image_substitutes');
      for (let i = 0; i < images.length; i += 1) {
        images[i] = `images/food_image_substitutes/${images[i]}`;
      }
      res.json({ recipes, images });
    });
  });

  app.delete('/delete_recipe',
    upload.none(),
    [
      body('title').trim().not().isEmpty()
        .escape()
        .isLength({ min: 3, max: 50 }),
    ],
    async (req, res) => {
      req.sessionStore.get(req.session.id, async (err, sess) => {
        if (err) {
          console.log(`err: ${err}`);
          return;
        }
        if (!sess) {
          res.redirect(303, '/login');
          return;
        }
        const validationErrors = validationResult(req);
        const recipe = req.body;
        if (!validationErrors.isEmpty()) {
          console.log('validation error: ', validationErrors);
          res.sendStatus(401);
          return;
        }

        await sonicChannelIngest.flusho('recipes', sess.user, [sess.user, recipe.title.split(' ').join('+')].join(':'))
          .catch((error) => console.log(error));

        const isDeleted = await users.deleteRecipe(req.body.title, sess.user);

        if (isDeleted) {
          res.sendStatus(204);
        } else {
          res.sendStatus(404);
        }
      });
    },
  );

  app.get(
    '/edit_recipe',
    [
      query('title').trim().not().isEmpty(),
    ],
    async (req, res) => {
      // console.log(req.query);
      req.sessionStore.get(req.session.id, async (err, sess) => {
        if (err) {
          console.log(`err: ${err}`);
          return;
        }
        if (!sess) {
          res.redirect(303, '/login');
          return;
        }
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
          console.log(validationErrors);
          res.sendStatus(401);
          return;
        }

        res.status(200);
        res.render('pages/edit_recipe');
      });
    },
  );
  app.get('/get_recipe', [query('title').trim().not().isEmpty().escape()], async (req, res) => {
    req.sessionStore.get(req.session.id, async (err, sess) => {
      if (err) {
        console.log(`err: ${err}`);
        return;
      }
      if (!sess) {
        res.redirect(303, '/login');
        return;
      }
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        console.log(validationErrors);
        res.sendStatus(401);
        return;
      }

      const recipe = await users.getRecipe(req.query.title, sess.user);

      for (const [key, value] of Object.entries(recipe)) {
        recipe[key] = validator.unescape(value);
      }

      res.status(200);
      res.send(JSON.stringify(recipe));
    });
  });
  app.post('/check_duplicate_recipe', upload.none('title'), [body('title').trim().escape()], async (req, res) => {
    req.sessionStore.get(req.session.id, async (err, sess) => {
      if (err) {
        console.log(`err: ${err}`);
        return;
      }
      if (!sess) {
        res.redirect(303, '/login');
        return;
      }
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        console.log(validationErrors);
        res.sendStatus(401);
        return;
      }

      const isDuplicate = await users.isDuplicateTitle(req.body.title);

      res.status(200);
      res.send(JSON.stringify({ isDuplicate }));
    });
  });
  app.put(
    '/update_recipe',
    upload.any('recipe_image'),
    [
      body('title').trim().not().isEmpty()
        .isLength({ min: 3, max: 100 })
        .escape(),
      body('description').trim().isLength({ min: 0, max: 240 }).escape(),
      body('ingredients', 'Provided ingredient must not be empty.')
        .custom(checkIngredients),
      body('ingredient_amount', 'Provided ingredient quantity cannot be empty.')
        .custom(checkIngredientQuantity),
      body('directions', 'Provided direction cannot be empty.')
        .custom(checkDirections),
      body('original_url').if(body('original_url').not().isEmpty())
        .trim()
        .not()
        .isEmpty()
        .isURL(),
      body('food_category').if(body('food_category').not().isEmpty())
        .trim()
        .not()
        .isEmpty()
        .escape(),
      body('original_title').trim().not().isEmpty()
        .isLength({ min: 3, max: 100 })
        .escape(),
    ],
    (req, res) => {
      req.sessionStore.get(req.session.id, async (err, sess) => {
        if (err) {
          console.log(`err: ${err}`);
          return;
        }
        if (!sess) {
          res.redirect(303, '/login');
          return;
        }
        const validationErrors = validationResult(req);
        const recipe = req.body;
        if (!validationErrors.isEmpty()) {
          console.log(validationErrors);
          res.sendStatus(401);
          return;
        }

        // makes sure updated recipe title is not a duplicate
        if (await users.isDuplicateTitle(recipe.title)) {
          res.status(203);
          res.send(JSON.stringify({
            recipe,
            error: 'recipe title cannot be a duplicate of another recipe',
          }));
          return;
        }

        const user = sess.user;

        const makeRecipeString = (searchRecipe) => {
          let ingredients = '';
          if (Array.isArray(searchRecipe.ingredients)) {
            ingredients = searchRecipe.ingredients.join(' ');
          } else {
            ingredients = searchRecipe.ingredients;
          }
          let directions = '';
          if (Array.isArray(searchRecipe.directions)) {
            directions = searchRecipe.directions.join(' ');
          } else {
            directions = searchRecipe.directions;
          }

          return [
            searchRecipe.title,
            searchRecipe.description,
            ingredients,
            directions,
          ].join(' ').split('-').join(' ');
        };

        const replacedTitle = recipe.title.split(' ').join('+');
        const objectId = [user, replacedTitle].join(':');

        await sonicChannelIngest.push(
          'recipes',
          user,
          objectId,
          makeRecipeString(recipe),
          'eng',
        )
        .catch((error) => console.error(error));

        await sonicChannelIngest.flusho(
          'recipes',
          user,
          [user, recipe.original_title.split(' ').join('+')].join(':'),
        )
        .catch((error) => console.error(error));

        if (Array.isArray(recipe.ingredients)) {
          recipe.ingredients = recipe.ingredients.join('\n');
        }
        if (Array.isArray(recipe.directions)) {
          recipe.directions = recipe.directions.join('\n');
        }
        if (Array.isArray(recipe.ingredient_amount)) {
          recipe.ingredient_amount = recipe.ingredient_amount.join('\n');
        }

        await users.updateRecipe(recipe, req.session.user, req.files);
        res.sendStatus(200);
      });
    },
  );
  app.get(
    '/recipe',
    [
      query('title').trim().not().isEmpty().escape(),
    ],
    async (req, res) => {
      req.sessionStore.get(req.session.id, async (err, sess) => {
        if (err) {
          console.log(`err: ${err}`);
          return;
        }
        if (!sess) {
          res.redirect(303, '/login');
          return;
        }
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
          console.log(validationErrors);
          res.sendStatus(401);
          return;
        }

        res.status(200);
        res.render('pages/recipe');
      });
    },
  );

  app.get('/search_recipes', query('search').trim(), (req, res) => {
    req.sessionStore.get(req.session.id, async (err, sess) => {
      if (err) {
        console.log(`err: ${err}`);
        return;
      }
      if (!sess) {
        res.redirect(303, '/login');
        return;
      }

      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        console.log(validationErrors);
        res.sendStatus(401);
        return;
      }

      const user = sess.user;
      const searchTerms = req.query.search;

      if (searchTerms) {
        const objectId = await sonicChannelSearch.query('recipes', user, searchTerms)
          .catch((error) => console.log(error));

        if (objectId.length > 0) {
          const possibleRecipes = [];
          for (const item of objectId) {
            const recipePromise = users.getRecipe(
              validator.escape(item.split(':')[1].split('+').join(' ')),
              user,
            );
            possibleRecipes.push(recipePromise);
          }

          const recipes = [];
          const fullRecipes = await Promise.all(possibleRecipes)
            .catch((error) => console.log(error));

          for (const fullRecipe of fullRecipes) {
            const recipe = {
              title: validator.unescape(fullRecipe.title),
              description: fullRecipe.description,
            };
            recipe.image = fullRecipe.image.replace('\\', '/');
            recipe.image = recipe.image.replace('uploads/', '');
            recipes.push(recipe);
          }

          res.status(200);
          res.json(recipes);
        } else {
          res.sendStatus(401);
        }
      } else {
        const recipes = await users.getRecipes(req.session.user)
          .catch((error) => console.log(error));
        res.status(200);
        for (let i = 0; i < recipes.length; i += 1) {
          recipes[i].title = validator.unescape(recipes[i].title);
        }
        res.send(recipes);
      }
    });
  });

  return { app };
};
