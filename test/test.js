const test = require('ava');
require('dotenv').config();
const bcrypt = require('bcrypt');
const pg = require('pg-promise')();

const users = require('../src/users');

'use strict' 

const singleUser = {
  username: 'billy bob',
  email: 'billy@yahoo.com',
  password: 'yeehaw32',
};

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

test('add one user', async (t) => {
  let testUser = singleUser;
  await users.addUser(testUser).catch((err) => console.log(err));
  const user = await users.getUser(testUser).catch((err) => console.log(err));

  t.assert(user.username === testUser.username);
  t.assert(user.email === testUser.email);
  const match = await bcrypt.compare(testUser.password, user.hash);
  t.assert(match === true);
});


test('add multiple users', async (t) => {
  for (testUser of multipleUsers) {
    await users.addUser(testUser);
    let user = await users.getUser(testUser).catch((err) => console.log(err));

    t.assert(user.username === testUser.username);
    t.assert(user.email === testUser.email);
    const match = await bcrypt.compare(testUser.password, user.hash);
    t.assert(match === true);
  }
});
