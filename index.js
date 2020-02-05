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
const bcrypt = require('bcrypt');

require('dotenv').config()

const express = require('express');
const app = express();
const port = 8000;

const body_parser = require('body-parser');

const csp = require('helmet-csp');

const pg = require('pg-promise')();
const db = pg(process.env.DATABASE_URL);

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

app.use(csp({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com/css?family=Open+Sans&display=swap"],
        reportUri: '/signin',
    },
    reportOnly: true,
}));

let router = express.Router();

app.post('/signup', (req, res) => {
    console.log(req.body);
    res.send('/signup');
});

router.get('/', (req, res) => {
    res.send("Got your request for page landing");
});

app.use(express.static(__dirname + "/reshipi-frontend"));
app.listen(port);

async function main() {
    const create_user_table = 
        `CREATE TABLE IF NOT EXISTS
            Users(
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT NOT NULL,
                hash TEXT NOT NULL,
                recipes_table TEXT NOT NULL
            )`;
    
    let client = await db.connect().catch(err => console.log(err));
    client.none(create_user_table);

    app.use(express.static("reshipi-frontend"));
    app.listen(port);

}

async function signup_new_user(req, res) {

    let salt_rounds = 10;

    let user_data = JSON.parse(req);
    let hash_result = await bcrypt.hash(
        user_data.password, 
        salt_rounds
    ).catch(err => console.log(err));

    // const delete_user = pg.as.format(
    //     `DELETE FROM Users WHERE $1:name=$2`,
    //     ["username", user_data.username],
    // );
    // let num_rows_del = await db.none(delete_user);
    // // console.log(num_rows_del);

    user_data.recipe_table = `${user_data.username}_recipes`;

    const create_user_recipes_table = 
        pg.as.format(
            `CREATE TABLE IF NOT EXISTS
                $1:name(
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL,
                    ingredients TEXT NOT NULL,
                    directions TEXT NOT NULL,
                    description TEXT NOT NULL,
                    food_category TEXT NOT NULL,
                    tags TEXT
                );`,
            [user_data.recipe_table],
        );

    // create table for user recipes
    db.none(create_user_recipes_table);

    const insert_new_user = new pg.ParameterizedQuery(
        {
            text: `INSERT INTO Users (username, email, hash, recipes_table)
            VALUES ($1, $2, $3, $4);`,
            values: [user_data.username, user_data.email, hash_result, user_data.recipe_table],

        }
    )
    await db.none(insert_new_user).catch(err => console.log(err));
    let get_one_user = new pg.ParameterizedQuery(
        {
            text: `SELECT * FROM Users WHERE username=$1 LIMIT 1;`,
            values: [user_data.username],
        }
    );
    let user = await db.one(get_one_user);
    console.log(user);
}

// main()

let test_user = JSON.stringify(
    {
        "username": "buma",
        "email": "magamaniac@gmail.com",
        "password": "hello,world",
    }
);

let test_recipe = JSON.stringify(
    {
        "title": "Steak Brisket",
        "ingredients": "Beef chuck 1/2lb\nSalt 1 teaspoon\nBlack Pepper 1 teaspoon\nButter 1 teaspoon",
        "directions": "1. Heat pan up and put butter on pan.\n2. Place steak on pan and cook both side.",
        "description": "Tasty steak", 
        "food_category": "Steak",
        "tags": "beef",
    }
)


// signup_new_user(test_user, 3);