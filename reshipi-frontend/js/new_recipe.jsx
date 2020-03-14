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
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();

        fetch('/add_recipe', {
            method: "POST",
            body: JSON.stringify(userData),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(response => {
            console.log("submitted");
        })
    }

    render() {
        return(
            // <div>
                <form id="new-recipe" action="/add_recipe" method="post">
                {/* // <form onSubmit={this.handleSubmit} id="new-recipe"> */}
                    <div id="form-inputs">
                        <div className="input-group">
                            <label className="label" form="new-recipe" htmlFor="title">Recipe Title</label><br />
                            <input className="input" form="new-recipe" id="title" name="title" type="text" required /><br />
                        </div>
                        <div className="input-group">
                            <label className="label" form="new-recipe" htmlFor="description">Description</label><br />
                            <textarea className="input" rows="3" form="new-recipe" id="description" name="description" type="text" required/><br />
                        </div>
                            <IngredientList />
                            <Directions />
                            <FoodCategory />
                        </div>
                        <input id="submit-button" type="submit" value="Save Recipe" />
                    </div>
                </form>
            // </div>
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
        this.state = {ingredients: []};
        this.addNewIngredientInput = this.addNewIngredientInput.bind(this);
        this.removeIngredientInput = this.removeIngredientInput.bind(this);
        this.updateIngredients = this.updateIngredients.bind(this);
    }

    addNewIngredientInput(event) {
        event.preventDefault();
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

    updateIngredients(index, ingredient) {
        this.setState((state, props) => {
            state.ingredients[index].ingredient = ingredient;
            return ({
                ingredients: state.ingredients
            });
        });
    }


    render() {
        if (this.state.ingredients.length === 0) {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="ingredients">Ingredients</label><br />
                    <button onClick={this.addNewIngredientInput}><i className="fas fa-plus"></i></button>
                </div>
            )
        } else {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="ingredients">Ingredients</label><br />
                    {/* <input class="input" form="new-recipe" id="ingredients" name="ingredients" type="text" required/><br /> */}
                <div>
                    {this.state.ingredients.map((ingredient, index) => {
                        return (
                            <IngredientInput 
                                key={index.toString()} 
                                removeIngredientInput={this.removeIngredientInput} 
                                addNewIngredientInput={this.addNewIngredientInput} 
                                ingredient={ingredient.ingredient} 
                                updateIngredients={this.updateIngredients} 
                                index={index} />
                        )
                    })}
                </div>
                </div>
            );
        }
    }
}

class IngredientInput extends React.Component {
    constructor(props) {
        super(props);
        // this.state = ({value: ""});
        this.handleInput = this.handleInput.bind(this);
        this.removeInput = this.removeInput.bind(this);
    }

    handleInput(event) {
        event.preventDefault();
        // this.setState({value: event.target.value});
        this.props.updateIngredients(Number(this.props.index), event.target.value);
    }

    removeInput(event) {
        event.preventDefault();
        this.props.removeIngredientInput(Number(this.props.index));
    }

    render() {
        return (
            <div>
                <input className="ingredient-input" form="new-recipe" name="ingredients" type="text" value={this.props.ingredient} onChange={this.handleInput} required />
                <button onClick={this.props.addNewIngredientInput}><i className="fas fa-plus"></i></button>
                <button onClick={this.removeInput} className="remove-ingredient"><i className="fas fa-minus"></i></button>
            </div>
        )
    }
}

class Directions extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({directions: []});
        this.addDirection = this.addDirection.bind(this);
        this.updateDirections = this.updateDirections.bind(this);
        this.removeDirection = this.removeDirection.bind(this);
    }

    addDirection(event) {
        event.preventDefault();
        this.setState((state, props) => {
            state.directions.push('');
            return ({directions: state.directions});
        })
    }

    updateDirections(index, direction) {
        this.setState((state, props) => {
            state.directions[index]= direction;
            return ({
                directions: state.directions
            });
        });
    }

    removeDirection(index) {
        this.setState((state, props) => {
            state.directions.splice(index, 1);
            return ({
                directions: state.directions
            });
        });
    }

    render() {
        if (this.state.directions.length === 0) {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="directions">Directions</label><br />
                    <button onClick={this.addDirection}><i className="fas fa-plus"></i></button>
                </div>
            )
        } else {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="directions">Directions</label><br />
                {/* <input class="input" form="new-recipe" id="ingredients" name="ingredients" type="text" required/><br /> */}
                <div>
                    {this.state.directions.map((direction, index) => {
                        return (
                            <DirectionInput
                                key={index.toString()} 
                                removeDirection={this.removeDirection} 
                                addDirection={this.addDirection} 
                                direction={direction} 
                                updateDirections={this.updateDirections} 
                                    index={index} 
                                />
                        )
                    })}
                </div>
                </div>
            );
        }
    }
}

class DirectionInput extends React.Component {
    constructor(props) {
        super(props);
        this.removeInput= this.removeInput.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(event) {
        event.preventDefault();
        this.props.updateDirections(Number(this.props.index), event.target.value);
    }

    removeInput(event) {
        event.preventDefault();
        this.props.removeDirection(this.props.index);
    }

    render() {
        return (
            <div>
                <input className="direction-input" form="new-recipe" name="directions" type="text" value={this.props.direction} onChange={this.handleInput} required />
                <button onClick={this.props.addDirection}><i className="fas fa-plus"></i></button>
                <button onClick={this.removeInput} className="remove-direction"><i className="fas fa-minus"></i></button>
            </div>
        )
    }
}

class FoodCategory extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({value: ''});
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(event) {
        this.setState((state, props) => ({value: event.target.value}))
    }

    render () {
        return (
            <div>
                <label className="label" form="new-recipe" htmlFor="food-category">Food Category</label><br />
            <div className="input-group">
                <input className="input" form="new-recipe" id="title" name="food-category" type="text" onChange={this.handleInput} /><br />
            </div>
            </div>
        )
    }


}

const root = document.getElementById("root");
ReactDom.render(<App />, root);