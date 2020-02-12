const test = require('ava');
require('dotenv').config();
const bcrypt = require('bcrypt');
const pg = require('pg-promise')();

const users = require('../src/users');

'use strict' 

const testUsers = [
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

test('test add user', async (t) => {
  let testUser = testUsers[0];
  await users.addUser(testUser);
  let user = await users.validateUser(testUser).catch((err) => console.log(err));
  t.assert(user.username === testUser.username);
  t.assert(user.email === testUser.email);
  let match = await bcrypt.compare(testUser.password, user.hash);
  t.assert(match === true);
  let tableExists = await users.db.one(
    `
      SELECT to_regclass('public.buman_recipes');
    `
  );
  t.assert(`${testUser.username}_recipes` === tableExists.to_regclass);

  testUser = testUsers[1];
  await users.addUser(testUser);
  all_users = await users.db.any(
    `
      SELECT * FROM Users;
    `
  );
  user = await users.validateUser(testUser).catch((err) => console.log(err));
  // console.log(user);
  t.assert(user.username === testUser.username);
  t.assert(user.email === testUser.email);
  match = await bcrypt.compare(testUser.password, user.hash);
  t.assert(match === true);
  tableExists = await users.db.one(
    `
      SELECT to_regclass('public.luna_recipes');
    `
  );
  t.assert(`${testUser.username}_recipes` === tableExists.to_regclass);

  testUser = testUsers[2];
  await users.addUser(testUser);

  user = await users.validateUser(testUser).catch((err) => console.log(err));

  t.assert(user.username === testUser.username);
  t.assert(user.email === testUser.email);

  match = await bcrypt.compare(testUser.password, user.hash);
  t.assert(match === true);
  tableExists = await users.db.one(
    `
      SELECT to_regclass('public.lyon_recipes');
    `
  );
  t.assert(`${testUser.username}_recipes` === tableExists.to_regclass);
});
