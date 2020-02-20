/* eslint-disable func-names */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable prefer-arrow-callback */
const { describe, it, before, after } = require('mocha');
const assert = require('assert');
require('dotenv').config();
const pgp = require('pg-promise')();
const request = require('supertest');
const bcrypt = require('bcrypt');

require('dotenv').config();

// const users = new UsersDatabase(process.env.TESTING_DATABASE_URL);
// const db = pgp(process.env.TESTING_DATABASE_URL);
const users = require('../src/users.js')(pgp(process.env.TESTING_DATABASE_URL));
const { app } = require('../src/app.js')(users);

'use strict'; 

const testRecipe = JSON.stringify({
  title: 'Steak Brisket',
  ingredients:
    'Beef chuck 1/2lb\nSalt 1 teaspoon\nBlack Pepper 1 teaspoon\nButter 1 teaspoon',
  directions:
    '1. Heat pan up and put butter on pan.\n2. Place steak on pan and cook both side.',
  description: 'Tasty steak',
  food_category: 'Steak',
  tags: 'beef',
});

const createDb = pgp({
  database: 'postgres',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
});


describe('reshipi', function () {
  before(async function () {
    await createDb.none('CREATE DATABASE testing').catch((err) => console.log(err));

    const createUserTable = `CREATE TABLE IF NOT EXISTS
      Users(
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
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

    console.log('Created test db for database testing');
  });

  after(async function () {
    // drops all connections to the database besides this one
    await createDb.one(
      `
        SELECT pg_terminate_backend(pg_stat_activity.pid) 
        FROM pg_stat_activity 
        WHERE pg_stat_activity.datname = 'testing'
          AND pid <> pg_backend_pid();
      `,
    ).catch((err) => console.log(err));
    await createDb.none('DROP DATABASE testing').catch((err) => console.log(err));
    console.log('Deleted database used for testing');
  });

  describe('database testing', function () {
    it('should add one user', async function () {
      const singleUser = {
        username: 'billy bob',
        email: 'billy@yahoo.com',
        password: 'yeehaw32',
      };
      await users.addUser(singleUser).catch((err) => console.log(err));
      const user = await users.getUser(singleUser).catch((err) => console.log(err));

      assert(user.username === singleUser.username);
      assert(user.email === singleUser.email);
      const match = await bcrypt.compare(singleUser.password, user.hash);
      assert(match === true);
    });

    it('should add multiple users', async function () {
      const multipleUsers = [
        {
          username: 'buman',
          email: 'magamaniaca@gmail.com',
          password: 'hello,world!',
        },
        {
          username: 'luna',
          email: 'luna@yahoo.com',
          password: 'witchywatch',
        },
        {
          username: 'lyon',
          email: 'lyon@hotmail.com',
          password: 'lyoness23@',
        },
      ];
      for (const testUser of multipleUsers) {
        await users.addUser(testUser);
        const user = await users.getUser(testUser).catch((err) => console.log(err));

        assert(user.username === testUser.username);
        assert(user.email === testUser.email);
        const match = await bcrypt.compare(testUser.password, user.hash);
        assert(match === true);
      }
    });
    it('signup user', async function () {
      const res = await request(app)
        .post('/signup')
        .send({
          username: 'samus',
          email: 'samus@gmail.com',
          password: 'secret_passy',
        })
        .expect(201);
      assert(res.status === 201);
      assert(res.text === 'successfully added user');
    });

    it('signup user duplicate', async function () {
      const res = await request(app)
        .post('/signup')
        .send({
          username: 'samus',
          email: 'samus@gmail.com',
          password: 'secret_passy',
        })
        .expect(200);
        // .then((res) => {
        //   t.assert(res.status === 200);
        // });
      assert(res.status === 200);
    });
  });
});
