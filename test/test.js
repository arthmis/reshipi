const { describe, it, before, after, afterEach } = require('mocha');
const assert = require('assert');
require('dotenv').config();
const pgp = require('pg-promise')();
const request = require('supertest');
const bcrypt = require('bcrypt');

require('dotenv').config();

const db = pgp(process.env.TESTING_DATABASE_URL);
const users = require('../src/users.js')(db);
const { app } = require('../src/app.js')(users, db);


describe('reshipi', function () {
  before(async function () {
    const createUserTable = `CREATE TABLE IF NOT EXISTS
      Users(
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        hash TEXT NOT NULL
      )`;

    const createRecipesTable = `CREATE TABLE IF NOT EXISTS
      Recipes(
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        recipe JSONB NOT NULL
      )`;

    // need to put unique for sid or will get error
    const createSessionsTable = `CREATE TABLE IF NOT EXISTS
    Sessions(
      sid VARCHAR UNIQUE,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )`;

    await db.none(createUserTable).catch((err) => err);
    await db.none(createRecipesTable).catch((err) => err);
    await db.none(createSessionsTable).catch((err) => err);

    console.log('Created tables for testing');
  });

  after(async function () {
    // delete all data in reshipi_testdb
    await db.none('DELETE FROM users').catch((err) => console.log(err));
    await db.none('DELETE FROM recipes').catch((err) => console.log(err));
    await db.none('DELETE FROM sessions').catch((err) => console.log(err));
    console.log('Deleted everything from tables in testdb');
  });

  describe('database testing', function () {
    it('should add one user', async function () {
      const singleUser = {
        email: 'billy@yahoo.com',
        password: 'yeehaw32',
      };
      await users.addUser(singleUser).catch((err) => console.log(err));
      const user = await users.getUser(singleUser).catch((err) => console.log(err));

      assert(user.email === singleUser.email);
      const match = await bcrypt.compare(singleUser.password, user.hash);
      assert(match === true);
    });
  });

  describe('signup', function () {
    it('should sign up a user', async function () {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'samus@gmail.com',
          password: 'secret_passy',
          confirm_password: 'secret_passy',
        })
        .expect(201);
      assert(res.status === 201);
    });

    it('should prevent a duplicate user from signing up', async function () {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'samus@gmail.com',
          password: 'secret_passy',
          confirm_password: 'secret_passy',
        })
        .expect(200);
      assert(res.status === 200);
    });
  });

  describe('login', function () {
    after(async function () {
        await db.none('DELETE FROM users').catch((err) => console.log(err));
        await db.none('DELETE FROM recipes').catch((err) => console.log(err));
        await db.none('DELETE FROM sessions').catch((err) => console.log(err));
    });

    it('should login a user', async function () {
      await request(app)
        .post('/signup')
        .send({
          email: 'kupam@gmail.com',
          password: 'secret_passy',
          confirm_password: 'secret_passy',
        })
        .expect(201);

      const res = await request(app)
        .post('/login')
        .send({
          email: 'kupam@gmail.com',
          password: 'secret_passy',
        });
      assert(res.status === 303);
      assert(res.redirect === true);
      assert(res.header.location === '/recipes');
    });

    it('should not login a user', async function () {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'kupam@gmail.com',
          password: 'wrong_secret_passy',
        });
      assert(res.status === 401);
    });
  });

  describe('logout', function () {
    it('should logout a user', async function () {
      res = await request(app)
        .post('/logout');

      assert(res.status === 303);
      assert(res.redirect === true);
    });
  });

  describe('recipe operations', function () {
    const agent = request.agent(app);

    before(async function () {
      await agent
        .post('/signup')
        .send({
          email: 'kupam@gmail.com',
          password: 'secret_passy',
          confirm_password: 'secret_passy',
        })
        .expect(201);

      await agent
        .post('/login')
        .send({
          email: 'kupam@gmail.com',
          password: 'secret_passy'
        })
        .expect(303);
    });

    after(async function () {
      await agent
        .post('/logout')
        .expect(303);

        await db.none('DELETE FROM users').catch((err) => console.log(err));
        await db.none('DELETE FROM recipes').catch((err) => console.log(err));
    });

    it('should add a recipe', async function () {
      const recipe = {
        title: 'Steak Brisket',
        ingredients: [
          'Beef chuck',
          'Salt',
          'Black Pepper',
          'Butter',
        ],
        ingredient_amount: [
          '1/2 lb',
          '1 teaspoon',
          '1 teaspoon',
          '1 tablespoon',
        ],
        directions: [
          'Heat pan up and put butter on pan.',
          'Place steak on pan and cook both side.',
        ],
        description: 'Tasty steak',
        original_url: '',
        food_category: '',
      };

      res = await agent
        .post('/add_recipe')
        .send(recipe);
        
      assert(res.status === 200, `res.status was ${res.status}`);

      const row = await db.one(
        "SELECT recipe FROM Recipes WHERE recipe->>'title' = $1 AND username = $2",
        [recipe.title, "kupam@gmail.com"],
      ).catch((err) => {
        throw err;
      });
      assert(recipe.title === row.recipe.title, `expected title is ${recipe.title}, got ${row.recipe.title}`);
    });

    it('should update recipe', async function () {
      const recipeUpdate = {
        title: 'Pork Brisket',
        ingredients: [
          'Beef chuck',
          'Salt',
          'Black Pepper',
          'Butter',
        ],
        ingredient_amount: [
          '1/2 lb',
          '1 teaspoon',
          '1 teaspoon',
          '1 tablespoon',
        ],
        directions: [
          'Heat pan up and put butter on pan.',
          'Place steak on pan and cook both side.',
        ],
        description: 'Tasty steak',
        original_title: 'Steak Brisket',
        original_image: '',
        original_url: '',
        food_category: '',

      };
      res = await agent
        .put('/update_recipe')
        .send(recipeUpdate);
        
      assert(res.status === 200, `res.status was ${res.status}`);

      const row = await db.one(
        "SELECT recipe FROM Recipes WHERE recipe->>'title' = $1 AND username = $2",
        [recipeUpdate.title, "kupam@gmail.com"],
      ).catch((err) => {
        throw err;
      });
      assert(recipeUpdate.title === row.recipe.title, `expected title is ${recipeUpdate.title}, got ${row.recipe.title}`);
    });
  });

});
