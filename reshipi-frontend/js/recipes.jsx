import React from 'react';
import ReactDom from 'react-dom';

'use strict';

class Nav extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return(
            <nav id="nav">
                <a id="reshipi" href="/recipes">Reshipi</a>
                <form action="/logout" method="get">
                    <input id="logout" type="submit" name="logout" value="Logout"/>
                </form>
            </nav>
        );
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return(
            <div>
                <header>
                    <Nav />
                </header>
                <main>
                    <h2>Reshipi recipe cards</h2>
                    <AddNewRecipe />
                    <Recipes />
                </main>
            </div>
        );
    }
}

class AddNewRecipe extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <form action="/new_recipe" method="get">
                <input id="new-recipe" type="submit" name="new_recipe" value="Add new recipe"/>
            </form>
        )
    }
}

class Recipes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            recipes: [],
        }
    }

    componentDidMount() {
        fetch('/all_recipes', {
            method: "GET",
            mode: 'same-origin',
            credentials: 'same-origin',
        })
        .then(response => response.json())
        .then(recipes => { this.setState({ recipes })});
    }

    render() {
        return (
            <div className="all-recipes">
                {this.state.recipes.map((recipe, index) => {
                    return (<Recipe key={index.toString()} recipe={recipe} />);
                })}
            </div>
        )
    }
}

class Recipe extends React.Component {
    constructor(props) {
        super(props);
    }

    render () {
        return (
            <div className="recipe-wrapper">
                <p>{this.props.recipe.title}</p>
                <img className="recipe-image" src={this.props.recipe.image} alt="recipe image" />
                <p className="description">{this.props.recipe.description}</p>
            </div>
        )
    }
}

const root = document.getElementById("root");
ReactDom.render(<App />, root);