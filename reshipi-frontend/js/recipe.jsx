'use strict';

class Ingredient {
    constructor(ingredient, amount) {
        this.ingredient = ingredient;
        this.amount = amount;
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <header>
                    <Nav />
                </header>
                <main>
                    <Recipe />
                </main>
            </div>
        );
    }
}

class Nav extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <nav id="nav">
                <a id="reshipi" href="/recipes">RE&middot;SHI&middot;PI</a>
                <form id="logout-form" action="/logout" method="get">
                    <input id="logout" type="submit" name="logout" value="Logout" />
                </form>
            </nav>
        );
    }
}

class Recipe extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            recipe: {
                title: '',
                description: '',
                ingredients: [],
                ingredients_amount: [],
                directions: [],
                food_category: '',
                image: '',
                url: '',
            },
            originalTitle: '',
        };
    }

    async componentDidMount() {
        const urlKeys = new URLSearchParams(window.location.search);
        const title = urlKeys.get('title');
        const encodedTitle = encodeURIComponent(title);
        const newUrl = `/get_recipe?title=${encodedTitle}`;
        let response = await fetch(newUrl, {
            method: "GET",
            mode: 'same-origin',
            credentials: 'same-origin',
        });
        let recipe = await response.json();
        console.log(recipe);

        const ingredientAndQuantity = [];
        for (let i = 0; i < recipe.ingredients.length; i += 1) {
            ingredientAndQuantity.push(new Ingredient(recipe.ingredients[i], recipe.ingredient_amount[i]))
        }

        recipe.ingredients = ingredientAndQuantity;
        delete recipe.ingredients_amount;

        this.setState((prevState, props) => {
            prevState.recipe = recipe;
            prevState.originalTitle = recipe.title;

            return (prevState);
        });
    }
    render() {
        return (
            <div id="recipe">
                <h2 id="title">{this.state.recipe.title}</h2>
                <img src={this.state.recipe.image} />
                <p id="description">{this.state.recipe.description}</p>
                <Ingredients ingredients={this.state.recipe.ingredients} />
                <Directions directions={this.state.recipe.directions} />
            </div>
        );
    }
}

class Ingredients extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="ingredients">
                <h4>Ingredients</h4>
                <ul>
                    {this.props.ingredients.map((ingredient, index) => {
                        return (
                            <li key={index.toString()} className="ingredient-item">
                                <span className="ingredient">
                                    {ingredient.ingredient}&ensp;
                                </span>
                                <span className="ingredient-amount">
                                    {ingredient.amount}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        )
    }
}

class Directions extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="directions">
                <h4>Directions</h4>
                <ol>
                    {this.props.directions.map((direction, index) => {
                        return (
                            <li key={index.toString()} className="direction">
                                {direction}
                            </li>
                        );
                    })}
                </ol>
            </div>
        )
    }
}

const root = document.getElementById("root");
ReactDOM.render(<App />, root);