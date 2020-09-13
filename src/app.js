require('dotenv').config();
const fs = require('fs');

const express = require('express');
const {
  check,
  validationResult,
  body,
  query,
} = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const bodyParser = require('body-parser');
const csp = require('helmet-csp');
const helmet = require('helmet');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const multer = require('multer');
const validator = require('validator');
const morgan = require('morgan');
const path = require('path');
const { RateLimiterPostgres } = require('rate-limiter-flexible');

const logger = require('./log.js');

logger.logger.emitErrs = false;

const maxConsecutiveLoginAttempts = 5;
const maxLoginAttempts = 10;

module.exports = (users, db) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, '../uploads/');
    },
    filename: async (req, file, cb) => {
      const originalNameSplit = file.originalname.split('.');
      const extension = originalNameSplit[originalNameSplit.length - 1];
      let newFileName = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
      while (await users.isImageNameDuplicate(`../uploads/${newFileName}`)) {
        newFileName = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
      }
      cb(null, newFileName);
    },
  });

  const upload = multer({ storage });

  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
  }));

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

  const loginRateLimiterReady = (err) => {
    if (err) {
      logger.error(err.stack);
    } else {
      logger.info('login rate limiting table is ready');
    }
  };

  const maxLoginRateLimiterReady = (err) => {
    if (err) {
      logger.error(err.stack);
    } else {
      logger.info('max login rate limiting table is ready');
    }
  };

  const loginRateLimiter = new RateLimiterPostgres(loginRateLimitingOptions, loginRateLimiterReady);
  const maxLoginRateLimiter = new RateLimiterPostgres(maxLoginRateLimitingOptions, maxLoginRateLimiterReady);

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: ['json', 'application/csp-report'] }));

  function getMinutesInMilliseconds(minutes) {
    // minutes * second * milliseconds
    return minutes * 60 * 1000;
  }

  const cookieAge = getMinutesInMilliseconds(3600);

  app.set('trust proxy', true);

  app.use(session({
    cookie: {
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: cookieAge,
      sameSite: true,
    },
    secret: process.env.SECRET,
    name: 'id',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: new PgSession({
      pgPromise: db,
      tableName: 'sessions',
    }),
  }));
  app.set('trust proxy', 1) // trust first proxy

  app.set('view engine', 'ejs');

  app.use(
    csp({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://unpkg.com/react@16/umd/react.development.js',
          'https://unpkg.com/react-dom@16/umd/react-dom.development.js',
          'https://unpkg.com/react@16/umd/react.production.min.js',
          'https://unpkg.com/react-dom@16/umd/react-dom.production.min.js',
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

  app.post('/report-violation', (req, res) => {
    logger.warn(req.body);
    res.sendStatus(204);
  });

  function validateUserSession(req, res, next) {
    req.sessionStore.get(req.session.id, (err, sess) => {
      if (err) {
        logger.error(err.stack);
        res.status(500);
        res.render('pages/500');
        return;
      }

      if (!sess) {
        res.redirect(303, '/login');
        return;
      }
      req.user = sess.user;
      next();
    });
  }

  const signupNewUser = async (req, res) => {
    const userData = req.body;

    const user = {
      email: userData.email,
      emailSpan: '',
      confirmPassword: '',
    };

    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      user.emailSpan = `${validationErrors.errors[0].value} is not a valid email`;
      res.status(200);
      res.render('pages/signup', {
        user,
      });
      return;
    }

    try {
      const previouslyUsedEmail = await users.checkCredentialsExist(userData);

      if (previouslyUsedEmail) {
        user.emailSpan = 'Email not available';

        res.status(200);
        res.render('pages/signup', { user });
      } else if (userData.password !== userData.confirm_password) {
        user.confirmPassword = 'Confirmed password must match password.';

        res.status(200);
        res.render('pages/signup', { user });
      } else {
        try {
          await users.addUser(userData);
          res.status(201);
          res.render('pages/login_plain');
        } catch (err) {
          logger.error(err.stack);
          res.sendStatus(500);
        }
      }
    } catch (err) {
      logger.error(err.stack);
      res.sendStatus(500);
    }
  };
  app.post('/signup',
    [
      check('email').isEmail().normalizeEmail(),
      check('password').isLength({ min: 8, max: 50 }),
    ],
    signupNewUser);

  async function maxLoginLimiter(req, res, next) {
    const credentials = req.body;
    const resMaxLoginLimiter = await maxLoginRateLimiter.get(req.ip)
      .catch((err) => logger.error(err.stack));

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
    next();
  }
  const loginUser = async (req, res) => {
    const credentials = req.body;
      console.log("credentials: ", credentials);

    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const user = {
        email: credentials.email,
        errorMessage: 'email or password is incorrect',
      };
      res.status(200);
      res.render('pages/login', {
        user,
      });

      return;
    }

    try {
      const isValidLogin = await users.isValidLogin(credentials);

      if (!isValidLogin) {
        await Promise.all([
          loginRateLimiter.consume(req.ip),
          maxLoginRateLimiter.consume(req.ip),
        ])
          .catch((error) => logger.error(error.stack));

        const [consecutiveLoginRes, maxLoginRes] = await Promise.all([
          loginRateLimiter.get(req.ip),
          maxLoginRateLimiter.get(req.ip),
        ])
          .catch((error) => logger.error(error.stack));

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
          logger.error(err.stack);
          res.status(500);
          res.render('pages/500');
        } else {
          const consecutiveLoginRes = await loginRateLimiter.get(req.ip)
            .catch((error) => logger.error(error.stack));
          if (consecutiveLoginRes) {
            await loginRateLimiter.delete(req.ip)
              .catch((error) => logger.error(error.stack));
          }

          const maxLoginRes = await maxLoginRateLimiter.get(req.ip)
            .catch((error) => logger.error(error.stack));
          if (maxLoginRes) {
            await maxLoginRateLimiter.delete(req.ip)
              .catch((error) => logger.error(error.stack));
          }
          req.session.user = credentials.email;
          res.redirect(303, '/recipes');
        }
      });
    } catch (err) {
      logger.error(err.stack);
      res.status(500);
      res.render('pages/500');
    }
  };

  app.post('/login',
    maxLoginLimiter,
    [
      check('email').isEmail().normalizeEmail(),
      check('password').isLength({ min: 8, max: 50 }),
    ],
    loginUser);

  app.post('/logout', validateUserSession, (req, res) => {
    req.sessionStore.destroy(req.session.id, (err) => {
      if (err) {
        logger.error(err.stack);
        res.status(500);
        res.render('pages/500');
        return;
      }
      res.redirect(303, '/');
    });
  });

  app.get('/recipes', validateUserSession, (req, res) => {
    res.status(200);
    res.render('pages/recipes');
  });

  app.get('/new_recipe', validateUserSession, (req, res) => {
    res.status(200);
    res.render('pages/new_recipe');
  });

  async function addRecipe(req, res) {
    const validationErrors = validationResult(req);
    const recipe = req.body;
    if (!validationErrors.isEmpty()) {
      logger.error('validation error: ', validationErrors);
      res.sendStatus(400);
      return;
    }
    if (!(Array.isArray(recipe.ingredients))) {
      recipe.ingredients = [recipe.ingredients];
    }
    if (!(Array.isArray(recipe.ingredient_amount))) {
      recipe.ingredient_amount = [recipe.ingredient_amount];
    }
    if (!(Array.isArray(recipe.directions))) {
      recipe.directions = [recipe.directions];
    }

    try {
      const isDuplicateTitle = await users.isDuplicateTitle(recipe.title, req.user);

      if (isDuplicateTitle) {
        res.status(203);
        res.json({
          recipe,
          error: 'recipe title cannot be a duplicate of another recipe',
        });
        return;
      }

      try {
        if (req.files === undefined) {
          req.files = '';
        }
        await users.addRecipe(recipe, req.user, req.files);
        res.status(200);
        res.render('pages/recipes');
      } catch (error) {
        logger.error(`error adding recipe: ${error.stack}`);
        res.status(500);
        res.render('pages/500');
      }
    } catch (error) {
      logger.error(error.stack);
      res.status(500);
      res.render('pages/500');
    }
  }

  const checkIngredients = (ingredients) => {
    if (!(Array.isArray(ingredients))) {
      ingredients = [ingredients];
    }
    for (let i = 0; i < ingredients.length; i += 1) {
      ingredients[i] = validator.trim(ingredients[i]);

      if (validator.isEmpty(ingredients[i])) {
        return false;
      }
    }
    return true;
  };
  const checkIngredientQuantity = (quantities) => {
    if (!Array.isArray(quantities)) {
      quantities = [quantities];
    }
    for (let i = 0; i < quantities.length; i += 1) {
      quantities[i] = validator.trim(quantities[i]);

      if (validator.isEmpty(quantities[i])) {
        return false;
      }
    }
    return true;
  };
  const checkDirections = (directions) => {
    if (!Array.isArray(directions)) {
      directions = [directions];
    }
    for (let i = 0; i < directions.length; i += 1) {
      directions[i] = validator.trim(directions[i]);

      if (validator.isEmpty(directions[i])) {
        return false;
      }
    }
    return true;
  };

  app.post(
    '/add_recipe',
    validateUserSession,
    upload.any('image'),
    [
      body('title').trim().not().isEmpty()
        .isLength({ min: 3, max: 100 }),
      body('description').trim().isLength({ min: 0, max: 240 }),
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
        .isEmpty(),
    ],
    addRecipe,
  );

  app.get('/all_recipes', validateUserSession, async (req, res) => {
    try {
      const recipes = await users.getRecipes(req.session.user);
      res.status(200);
      // TODO add error handling for file read
      const images = fs.readdirSync('./reshipi-frontend/images/food_image_substitutes');
      for (let i = 0; i < images.length; i += 1) {
        images[i] = `images/food_image_substitutes/${images[i]}`;
      }
      // sanitize recipes for html on client side
      for (let i = 0; i < recipes.length; i += 1) {
        for (const key of Object.keys(recipes[i])) {
          recipes[i][key] = sanitizeHtml(recipes[i][key]);
        }
      }
      res.json({ recipes, images });
    } catch (error) {
      logger.error(error.stack);
      res.status(500);
      res.render('pages/500');
    }
  });

  app.delete('/delete_recipe',
    validateUserSession,
    upload.none(),
    [
      body('title').trim().not().isEmpty()
        .isLength({ min: 3, max: 100 }),
    ],
    async (req, res) => {
      const validationErrors = validationResult(req);
      const recipe = req.body;
      if (!validationErrors.isEmpty()) {
        logger.error('validation error: ', validationErrors);
        res.sendStatus(401);
        return;
      }

      try {
        const isDeleted = await users.deleteRecipe(recipe.title, req.user);

        if (isDeleted) {
          res.sendStatus(204);
        } else {
          res.sendStatus(404);
        }
      } catch (error) {
        logger.error(error.stack);
        res.status(500);
        res.render('pages/500');
      }
    });

  app.get(
    '/edit_recipe',
    validateUserSession,
    [
      query('title').trim().not().isEmpty(),
    ],
    (req, res) => {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        logger.error(validationErrors);
        res.sendStatus(401);
        return;
      }

      res.status(200);
      res.render('pages/edit_recipe');
    },
  );

  app.get('/get_recipe', validateUserSession, [query('title').trim().not().isEmpty()], async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      logger.error(validationErrors);
      res.sendStatus(401);
      return;
    }

    try {
      const recipe = await users.getRecipe(req.query.title, req.user);
      // sanitize recipe for html
      recipe.title = sanitizeHtml(recipe.title);
      recipe.image = sanitizeHtml(recipe.image);
      recipe.description = sanitizeHtml(recipe.description);
      recipe.original_url = sanitizeHtml(recipe.original_url);
      recipe.food_category = sanitizeHtml(recipe.food_category);
      for (let i = 0; i < recipe.ingredients.length; i += 1) {
        recipe.ingredients[i] = sanitizeHtml(recipe.ingredients[i]);
      }
      for (let i = 0; i < recipe.ingredient_amount.length; i += 1) {
        recipe.ingredient_amount[i] = sanitizeHtml(recipe.ingredient_amount[i]);
      }
      for (let i = 0; i < recipe.directions.length; i += 1) {
        recipe.directions[i] = sanitizeHtml(recipe.directions[i]);
      }

      res.status(200);
      res.json(recipe);
    } catch (error) {
      logger.error(error.stack);
      res.status(500);
      res.render('pages/500');
    }
  });

  app.post('/check_duplicate_recipe', validateUserSession, upload.none('title'), [body('title').trim()], async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      logger.error(validationErrors);
      res.sendStatus(401);
      return;
    }

    const isDuplicate = await users.isDuplicateTitle(req.body.title, req.user);

    res.status(200);
    res.json(isDuplicate);
  });

  app.put(
    '/update_recipe',
    validateUserSession,
    upload.any('image'),
    [
      body('title').trim().not().isEmpty()
        .isLength({ min: 3, max: 100 }),
      body('description').trim().isLength({ min: 0, max: 240 }),
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
        .isEmpty(),
      body('original_title').trim().not().isEmpty()
        .isLength({ min: 3, max: 100 }),
      body('original_image').trim().isLength({ min: 0, max: 100 }),
    ],
    async (req, res) => {
      const validationErrors = validationResult(req);
      const recipe = req.body;
      if (!validationErrors.isEmpty()) {
        logger.error(validationErrors);
        res.sendStatus(401);
        return;
      }

      try {
        // makes sure updated recipe title is not a duplicate
        if (recipe.title.toLowerCase() !== recipe.original_title.toLowerCase()) {
          const isDuplicateTitle = await users.isDuplicateTitle(recipe.title, req.user);

          if (isDuplicateTitle) {
            res.status(203);
            res.json({
              recipe,
              error: 'recipe title cannot be a duplicate of another recipe',
            });
            return;
          }
        }

        try {
          await users.updateRecipe(recipe, req.user, req.files);
          res.sendStatus(200);
        } catch (error) {
          logger.error(error.stack);
          res.status(500);
          res.render('pages/500');
        }
      } catch (error) {
        logger.error(error.stack);
        res.status(500);
        res.render('pages/500');
      }
    },
  );
  app.get(
    '/recipe',
    validateUserSession,
    [query('title').trim().not().isEmpty()],
    async (req, res) => {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        logger.error(validationErrors);
        res.sendStatus(401);
        return;
      }

      res.status(200);
      res.render('pages/recipe');
    },
  );

  // app.get('/search_recipes', validateUserSession, query('search').trim(), async (req, res) => {
  //   const validationErrors = validationResult(req);
  //   if (!validationErrors.isEmpty()) {
  //     logger.error(validationErrors);
  //     res.sendStatus(401);
  //     return;
  //   }

  //   const searchTerms = req.query.search;

  //   if (searchTerms !== '') {
  //     const objectId = await sonicChannelSearch.query('recipes', req.user, searchTerms)
  //       .catch((error) => logger.error(error.stack));

  //     if (objectId.length > 0) {
  //       const possibleRecipes = [];
  //       for (const item of objectId) {
  //         const recipePromise = users.getRecipe(
  //           item.split(':')[1].split('+').join(' '),
  //           req.user,
  //         );
  //         possibleRecipes.push(recipePromise);
  //       }

  //       const recipes = [];
  //       try {
  //         const fullRecipes = await Promise.all(possibleRecipes);

  //         for (const fullRecipe of fullRecipes) {
  //           const recipe = {
  //             title: fullRecipe.title,
  //             description: fullRecipe.description,
  //           };
  //           recipe.image = fullRecipe.image.replace('\\', '/');
  //           recipe.image = recipe.image.replace('uploads/', '');
  //           recipes.push(recipe);
  //         }
  //         res.status(200);
  //         res.json(recipes);
  //       } catch (error) {
  //         logger.error(error.stack);
  //         res.status(500);
  //         // maybe think about about sending an empty recipe
  //       }
  //     } else {
  //       res.sendStatus(404);
  //     }
  //   } else {
  //     try {
  //       const recipes = await users.getRecipes(req.user);
  //       res.status(200);
  //       res.send(recipes);
  //     } catch (error) {
  //       logger.error(error.stack);
  //       res.status(500);
  //     }
  //   }
  // });

  return { app };
};
