import React from 'react';
import ReactDom from 'react-dom';

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
                    {/* <h1>hello</h1> */}
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
            <div>
                <nav id="nav">
                    <a id="reshipi" href="/recipes">Reshipi</a>
                    <form action="/logout" method="get">
                        <input id="logout" type="submit" name="logout" value="Logout"/>
                    </form>
                </nav>
            </div>
        );
    }
}

class NewRecipeForm extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div>
                <form id="new-recipe" action="/new_recipe" method="post">
                    <div id="form-inputs">
                        <div className="input-group">
                            <label className="label" form="new-recipe" htmlFor="title">Recipe Title</label><br />
                            <input className="input" form="new-recipe" id="title" name="title" type="text" required /><br />
                        </div>
                        <div className="input-group">
                            <label className="label" form="new-recipe" htmlFor="description">Description</label><br />
                            <textarea className="input" rows="3" form="new-recipe" id="description" name="description" type="text" required/><br />
                        </div>
                        <div className="input-group">
                            <label className="label" form="new-recipe" htmlFor="ingredients">Ingredients</label><br />
                            {/* <input class="input" form="new-recipe" id="ingredients" name="ingredients" type="text" required/><br /> */}
                            <IngredientList />
                        </div>
                        <input id="submit-button" type="submit" value="Save Recipe" />
                    </div>
                </form>
            </div>
        );
    }
}

class Ingredient {
    constructor(ingredient, quantity) {
        this.ingredient = ingredient;
        this.quantity = quantity;
    }
}

class IngredientList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {ingredients: [new Ingredient("", "")]};
        this.addNewIngredientInput = this.addNewIngredientInput.bind(this);
        this.removeIngredientInput = this.removeIngredientInput.bind(this);
    }

    addNewIngredientInput() {
        this.setState((state, props) => {
            state.ingredients.push(new Ingredient('', ''));
            return ({
                ingredients: state.ingredients
            });
        });
    }

    removeIngredientInput(index) {
        this.setState((state, props) => {
            state.ingredients.splice(index, 1);
            return ({
                ingredients: state.ingredients
            });
        });
    }

    // TO DO make this function update the ingredients at the index
    // with the user input when passed to IngredientInput 
    updateIngredients(index) {
        this.setState((state, props) => {
            
            return ({
                ingredients: state.ingredients
            });
        });
    }

    render() {
        if (this.state.ingredients.length === 0) {
            return (
                <div>
                    <button onClick={this.addNewIngredientInput}><i className="fas fa-plus"></i></button>
                </div>
            )
        } else {
            return (
                <div>
                    {this.state.ingredients.map((ingredient, index) => {
                        return (
                            <IngredientInput 
                                key={index.toString()} 
                                removeIngredientInput={this.removeIngredientInput} 
                                addNewIngredientInput={this.addNewIngredientInput} 
                                ingredient={ingredient.ingredient} />
                        )
                    })}
                </div>
            );
        }
    }
}

class IngredientInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({value: ""});
        this.handleInput = this.handleInput.bind(this);
        this.removeInput = this.removeInput.bind(this);
    }

    handleInput(event) {
        this.setState({value: event.target.value});
    }

    removeInput(event) {
        this.props.removeIngredientInput(this.props.index);
    }

    render() {
        return (
            <div>
                <input className="ingredient-input" form="new-recipe" name="ingredients" type="text" value={this.state.value} onChange={this.handleInput} />
                <button onClick={this.props.addNewIngredientInput}><i className="fas fa-plus"></i></button>
                <button onClick={this.removeInput} className="remove-ingredient"><i className="fas fa-minus"></i></button>
            </div>
        )
    }
}

const root = document.getElementById("root");
ReactDom.render(<App />, root);