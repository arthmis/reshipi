import React from 'react';
import ReactDom from 'react-dom';
// import Directions from './components/directions.jsx';
// import IngredientList from './components/ingredients.jsx';
import NewRecipeForm from './components/new_recipe_form.jsx';

'use strict';


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
                    <NewRecipeForm />
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
        return(
            <nav id="nav">
                <a id="home-link" href="/recipes">Reshipi</a>
                <form id="logout-form" action="/logout" method="post">
                    <input id="logout" type="submit" name="logout" value="Logout"/>
                </form>
            </nav>
        );
    }
}

const root = document.getElementById("root");
ReactDom.render(<App />, root);