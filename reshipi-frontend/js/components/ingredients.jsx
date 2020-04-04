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
        this.state = {ingredients: [new Ingredient('', '')]};
        this.addNewIngredientInput = this.addNewIngredientInput.bind(this);
        this.removeIngredientInput = this.removeIngredientInput.bind(this);
        this.updateIngredient = this.updateIngredient.bind(this);
        this.updateIngredientQuantity = this.updateIngredientQuantity.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    addNewIngredientInput(event) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.ingredients.push(new Ingredient('', ''));
            return (prevState);
        });
    }

    removeIngredientInput(event, index) {
        event.preventDefault();
        if (this.state.ingredients.length > 1) {
            this.setState((prevState, props) => {
                prevState.ingredients.splice(index, 1);
                return (prevState);
            });
        }
    }

    updateIngredient(index, ingredient) {
        this.setState((prevState, props) => {
            prevState.ingredients[index].ingredient = ingredient;
            return (prevState);
        });
    }
    updateIngredientQuantity(index, quantity) {
        this.setState((prevState, props) => {
            prevState.ingredients[index].quantity = quantity;
            return (prevState);
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
        let ingredientList = null;
        if (this.state.ingredients.length === 1) {
            ingredientList = this.state.ingredients.map((ingredient, index) => {
                return (
                    <li className="list-item" key={index.toString()}>
                        <div className="drag-item"
                            draggable
                            onDragStart={(e) => this.onDragStart(e, index)}
                            onDragOver={this.handleDragOver}
                            onDrop={(e) => this.onDrop(e, index)}
                        >
                            <IngredientInput
                                ingredient={ingredient} 
                                updateIngredient={this.updateIngredient} 
                                updateIngredientQuantity={this.updateIngredientQuantity}
                                index={index} 
                            />
                            <span className="draggable-icon">
                                <i className="fas fa-grip-lines"></i>
                            </span>
                        </div>
                        <span className="remove-input-wrapper">
                            <button onClick={(e) => this.removeIngredientInput(e, index)} className="remove-input-button" disabled><i className="fas fa-times"></i></button>
                        </span>
                    </li>
                )
            });
        } else {
            ingredientList = this.state.ingredients.map((ingredient, index) => {
                return (
                    <li className="list-item" key={index.toString()}>
                        <div className="drag-item"
                            draggable
                            onDragStart={(e) => this.onDragStart(e, index)}
                            onDragOver={this.handleDragOver}
                            onDrop={(e) => this.onDrop(e, index)}
                        >
                            <IngredientInput
                                ingredient={ingredient} 
                                updateIngredient={this.updateIngredient} 
                                updateIngredientQuantity={this.updateIngredientQuantity}
                                index={index} 
                            />
                            <span className="draggable-icon">
                                <i className="fas fa-grip-lines"></i>
                            </span>
                        </div>
                        <span className="remove-input-wrapper">
                            <button onClick={(e) => this.removeIngredientInput(e, index)} className="remove-input-button"><i className="fas fa-times"></i></button>
                        </span>
                    </li>
                )
            });
        }
        return (
            <div className="input-group">
                <label className="label" form="new-recipe" htmlFor="ingredients">Ingredients</label><br />
                <ul className="ingredient-list">
                    {ingredientList}
                </ul>
                <button className="add-new-input" onClick={this.addNewIngredientInput}>Add ingredient</button>
            </div>
        );
    }
}

class IngredientInput extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(event) {
        event.preventDefault();

        if (event.target.name === 'ingredient_amount') {
            let ingredient = event.target;
            if (ingredient.value.length === 0) {
                ingredient.setCustomValidity('Please provide an ingredient.');
            }
            else if (ingredient.value.trim().length === 0) {
                ingredient.setCustomValidity('Ingredient cannot be empty.');
            } 
            else {
                ingredient.setCustomValidity('');
            }
            this.props.updateIngredientQuantity(Number(this.props.index), event.target.value);
        } else if (event.target.name === 'ingredients') {
            let amount = event.target;
            if (amount.value.length === 0) {
                amount.setCustomValidity('Please provide an ingredient amount.');
            }
            else if (amount.value.trim().length === 0) {
                amount.setCustomValidity('Ingredient cannot be empty.');
            } 
            else {
                amount.setCustomValidity('');
            }
            this.props.updateIngredient(Number(this.props.index), event.target.value);
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
                    name="ingredient_amount"
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
