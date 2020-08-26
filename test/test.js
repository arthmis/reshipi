/* eslint-disable func-names */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable prefer-arrow-callback */
const { describe, it, before, after } = require('mocha');
const assert = require('assert');
require('dotenv').config();
const pgp = require('pg-promise')();
// const request = require('supertest');
const bcrypt = require('bcrypt');

require('dotenv').config();

// const users = new UsersDatabase(process.env.TESTING_DATABASE_URL);
const db = pgp(process.env.TESTING_DATABASE_URL);
const users = require('../src/users.js')(db);
const { app } = require('../src/app.js')(users, db);

// const testRecipe = JSON.stringify({
//   title: 'Steak Brisket',
//   ingredients:
//     'Beef chuck 1/2lb\nSalt 1 teaspoon\nBlack Pepper 1 teaspoon\nButter 1 teaspoon',
//   directions:
//     '1. Heat pan up and put butter on pan.\n2. Place steak on pan and cook both side.',
//   description: 'Tasty steak',
//   food_category: 'Steak',
//   tags: 'beef',
// });

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
        title TEXT NOT NULL,
        ingredients TEXT NOT NULL,
        directions TEXT NOT NULL,
        description TEXT NOT NULL,
        food_category TEXT NOT NULL,
        tags TEXT
      )`;

    await users.db.none(createUserTable).catch((err) => err);
    await users.db.none(createRecipesTable).catch((err) => err);

    console.log('Created tables for testing');
  });

  after(async function () {
    // delete all data in testdb
    await db.none('DELETE FROM users').catch((err) => console.log(err));
    await db.none('DELETE FROM recipes').catch((err) => console.log(err));
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

    // it.skip('should add multiple users', async function () {
    //   const multipleUsers = [
    //     {
    //       username: 'buman',
    //       email: 'magamaniaca@gmail.com',
    //       password: 'hello,world!',
    //     },
    //     {
    //       username: 'luna',
    //       email: 'luna@yahoo.com',
    //       password: 'witchywatch',
    //     },
    //     {
    //       username: 'lyon',
    //       email: 'lyon@hotmail.com',
    //       password: 'lyoness23@',
    //     },
    //   ];
    //   for (const testUser of multipleUsers) {
    //     await users.addUser(testUser);
    //     const user = await users.getUser(testUser).catch((err) => console.log(err));

    //     assert(user.username === testUser.username);
    //     assert(user.email === testUser.email);
    //     const match = await bcrypt.compare(testUser.password, user.hash);
    //     assert(match === true);
    //   }
    // });
  });
  // describe('user authentication', function () {
  //   it.skip('should sign up a user', async function () {
  //     const res = await request(app)
  //       .post('/signup')
  //       .send({
  //         username: 'samus',
  //         email: 'samus@gmail.com',
  //         password: 'secret_passy',
  //       })
  //       .expect(201);
  //     assert(res.status === 201);
  //   });

  //   it.skip('should prevent a duplicate user from signing up', async function () {
  //     const res = await request(app)
  //       .post('/signup')
  //       .send({
  //         username: 'samm',
  //         email: 'samus@gmail.com',
  //         password: 'secret_passy',
  //       })
  //       .expect(200);
  //     // .then((res) => {
  //     //   t.assert(res.status === 200);
  //     // });
  //     assert(res.status === 200);
  //   });

  //   it.skip('should login a user', async function () {
  //     await request(app)
  //       .post('/signup')
  //       .send({
  //         username: 'kupa',
  //         email: 'kupa@gmail.com',
  //         password: 'secret_passy',
  //       })
  //       .expect(201);

  //     const res = await request(app)
  //       .post('/login')
  //       .send({
  //         email: 'kupa@gmail.com',
  //         password: 'secret_passy',
  //       })
  //       .expect(200);
  //     assert(res.status === 200);
  //     assert(res.type === 'text/html');
  //     assert(res.text === 'login successful');
  //     // assert(res.path === '/recipes');
  //     // console.log(res);
  //   });

  // it('should not login a user', async function () {
  //   await request(app)
  //     .post('/signup')
  //     .send({
  //       username: 'kupa',
  //       email: 'kupam@gmail.com',
  //       password: 'secret_passy',
  //     })
  //     .expect(201);

  //   const res = await request(app)
  //     .post('/login')
  //     .send({
  //       email: 'kupam@gmail.com',
  //       password: 'wrong_secret_passy',
  //     })
  //     .expect(200);
  //   assert(res.status === 200);
  //   assert(res.type === 'text/html');
  //   assert(res.text === 'login successful');
  // });
  // });
});
