import React from 'react';
import ReactDOM from 'react-dom';
import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";

export class Ingredient {
    constructor(ingredient, quantity) {
        this.ingredient = ingredient;
        this.quantity = quantity;
    }
}

export class IngredientList extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
        let ingredientList = null;
        ingredientList = this.props.ingredients.map((ingredient, index) => {
            return (
                <Draggable key={index.toString()} draggableId={index.toString()} index={index}>
                    {(provided) => (
                        <li className="list-item" ref={provided.innerRef} {...provided.draggableProps}>
                            <div className="drag-item">
                                <IngredientInput
                                    ingredient={ingredient} 
                                    updateIngredient={this.props.updateIngredient} 
                                    updateIngredientQuantity={this.props.updateIngredientQuantity}
                                    index={index} 
                                />
                                <span className="draggable-icon" {...provided.dragHandleProps}>
                                    <i className="fas fa-grip-lines"></i>
                                </span>
                            </div>
                            <span className="remove-input-wrapper">
                                {this.props.ingredients.length === 1 ?
                                    <button onClick={(e) => this.props.removeIngredientInput(e, index)} className="remove-input-button" disabled><i className="fas fa-times"></i></button>:
                                    <button onClick={(e) => this.props.removeIngredientInput(e, index)} className="remove-input-button"><i className="fas fa-times"></i></button>
                                }
                            </span>
                        </li>
                    )}
                </Draggable>
            );
        });
        return (
            <div className="input-group">
                <label className="label" form="new-recipe" htmlFor="ingredients">Ingredients</label><br />
                <DragDropContext onDragEnd={this.props.ingredientDragEnd}>
                    <Droppable droppableId="ingredients-list">
                        {(provided) => (
                            <ul id="ingredients-list" className="ingredient-list" {...provided.droppableProps} ref={provided.innerRef}>
                                {ingredientList}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
                <button className="add-new-input" onClick={this.props.addNewIngredientInput}>Add ingredient</button>
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
                    placeholder="Ingredient" 
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
