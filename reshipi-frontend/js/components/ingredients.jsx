import React from 'react';
import {moveElementDownList, moveElementUpList} from './utility.js';
'use strict';

class Ingredient {
    constructor(ingredient, quantity) {
        this.ingredient = ingredient;
        this.quantity = quantity;
    }
}

export default class IngredientList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {ingredients: []};
        this.addNewIngredientInput = this.addNewIngredientInput.bind(this);
        this.removeIngredientInput = this.removeIngredientInput.bind(this);
        this.updateIngredients = this.updateIngredients.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDrop = this.onDrop.bind(this);
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

    removeIngredientInput(event, index) {
        event.preventDefault();
        this.setState((state, props) => {
            state.ingredients.splice(index, 1);
            return ({
                ingredients: state.ingredients
            });
        });
    }

    updateIngredients(index, ingredientOrAmount, valueType) {
        event.preventDefault();
        this.setState((state, props) => {
            if (valueType === "ingredient amount") {
                state.ingredients[index].quantity = ingredientOrAmount;
            } else if (valueType === "ingredient") {
                state.ingredients[index].ingredient = ingredientOrAmount;
            }
            return ({
                ingredients: state.ingredients
            });
        });
    }

    handleDragOver (event) {
        event.preventDefault();
    }

    onDragStart (event, index) {
        event.dataTransfer.setData("text/plain", index);
    }

    onDrop(event, dropIndex) {
        event.preventDefault();

        // dataTransfer turns the data into a DOMstring
        const element_index = Number(event.dataTransfer.getData("text/plain"));

        const ingredients = this.state.ingredients;
        const ingredientToDrag = ingredients[element_index];

        // if greater than dropIndex I will have to right shift
        // the array elements up to index
        if (element_index > dropIndex) {
            moveElementUpList(ingredients, element_index, dropIndex);
            this.setState({ingredients});
        } else if (element_index < dropIndex) { // left shifts elements
            moveElementDownList(ingredients, element_index, dropIndex);
            this.setState({ingredients});
        }
    }


    render() {
        if (this.state.ingredients.length === 0) {
            return (
                <div className="input-group">
                    <label className="label" form="new-recipe" htmlFor="ingredients">Ingredients</label><br />
                    <button className="add-new-input" onClick={this.addNewIngredientInput}>Add Ingredient</button>
                </div>
            )
        } else {
            const ingredientList = this.state.ingredients.map((ingredient, index) => {
                return (
                    <li 
                        className="list-item"
                        key={index.toString()} 
                    >
                        <div className="drag-item"
                            draggable
                            onDragStart={(e) => this.onDragStart(e, index)}
                            onDragOver={this.handleDragOver}
                            onDrop={(e) => this.onDrop(e, index)}
                        >
                            <IngredientInput
                                ingredient={ingredient} 
                                updateIngredients={this.updateIngredients} 
                                index={index} 
                            />
                            <span className="draggable-icon">
                                <i className="fas fa-grip-lines"></i>
                                {/* <i className="fas fa-grip-vertical"></i> */}
                            </span>
                        </div>
                        <span className="remove-input-wrapper">
                            <button onClick={(e) => this.removeIngredientInput(e, index)} className="remove-input-button"><i className="fas fa-times"></i></button>
                        </span>
                    </li>
                )
            });
            return (
                <ul className="input-group ingredient-list">
                    <label className="label" form="new-recipe" htmlFor="ingredients">Ingredient</label><br />
                    {ingredientList}
                    <button className="add-new-input" onClick={this.addNewIngredientInput}>Add ingredient</button>
                </ul>
            );
        }
    }
}

class IngredientInput extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(event) {
        event.preventDefault();
        if (event.target.name === "ingredient-amount") {
            this.props.updateIngredients(Number(this.props.index), event.target.value, "ingredient amount");
        } else if (event.target.name === "ingredients") {
            this.props.updateIngredients(Number(this.props.index), event.target.value, "ingredient");
        }
    }

    render() {
        return (
            <div className="ingredient-input">
                <input 
                    className="ingredient"
                    form="new-recipe" 
                    name="ingredients" 
                    type="text" 
                    value={this.props.ingredient.ingredient} 
                    onChange={this.handleInput} 
                    placeholder="Enter new ingredient" 
                    required 
                />
                <input 
                    className="ingredient-amount"
                    form="new-recipe"
                    name="ingredient-amount"
                    type="text"
                    value={this.props.ingredient.quantity}
                    onChange={this.handleInput}
                    placeholder="Amount"
                    required
                />
            </div>
        )
    }
}
