import React from 'react';
import {moveElementDownList, moveElementUpList} from './utility.js';
'use strict';

export default class Directions extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({directions: ['']});
        this.addDirection = this.addDirection.bind(this);
        this.updateDirections = this.updateDirections.bind(this);
        this.removeDirection = this.removeDirection.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    addDirection(event) {
        event.preventDefault();
        this.setState((state, props) => {
            state.directions.push('');
            return ({directions: state.directions});
        })
    }

    updateDirections(index, direction) {
        event.preventDefault();
        this.setState((prevState, props) => {
            prevState.directions[index]= direction;
            return (prevState);
        });
    }

    removeDirection(event, index) {
        event.preventDefault();
        if (this.state.directions.length > 1) {
            this.setState((prevState, props) => {
                prevState.directions.splice(index, 1);
                return(prevState);
            });
        }
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

        const directions = this.state.directions;
        const directionToDrag = directions[element_index];

        // if greater than dropIndex I will have to right shift
        // the array elements up to index
        if (element_index > dropIndex) {
            moveElementUpList(directions, element_index, dropIndex);
            this.setState({directions});
        } else if (element_index < dropIndex) { // left shifts elements
            moveElementDownList(directions, element_index, dropIndex);
            this.setState({directions});
        }
    }

    render() {
        let directionList = null;
        if (this.state.directions.length === 1) {
            directionList = this.state.directions.map((direction, index) => {
                return (
                    <li className="list-item" key={index.toString()} >
                        <div className="drag-item"
                            draggable
                            onDragStart={(e) => this.onDragStart(e, index)}
                            onDragOver={this.handleDragOver}
                            onDrop={(e) => this.onDrop(e, index)}
                        >
                            <DirectionInput
                                direction={direction} 
                                updateDirections={this.updateDirections} 
                                index={index} 
                            />
                            <span className="draggable-icon">
                                <i className="fas fa-grip-lines"></i>
                            </span>
                        </div>
                        <span className="remove-input-wrapper">
                            <button onClick={(e) => this.removeDirection(e, index)} className="remove-input-button" disabled><i className="fas fa-times"></i></button>
                        </span>
                    </li>
                );
            });
            
        } else {
            
            directionList = this.state.directions.map((direction, index) => {
                return (
                    <li className="list-item" key={index.toString()} >
                        <div className="drag-item"
                            draggable
                            onDragStart={(e) => this.onDragStart(e, index)}
                            onDragOver={this.handleDragOver}
                            onDrop={(e) => this.onDrop(e, index)}
                        >
                            <DirectionInput
                                direction={direction} 
                                updateDirections={this.updateDirections} 
                                index={index} 
                            />
                            <span className="draggable-icon"> 
                                <i className="fas fa-grip-lines"></i>
                            </span>
                        </div>
                        <span className="remove-input-wrapper">
                            <button onClick={(e) => this.removeDirection(e, index)} className="remove-input-button"><i className="fas fa-times"></i></button>
                        </span>
                    </li>
                )
            });
        }

        return (
            <div className="input-group">
                <label className="label" form="new-recipe" htmlFor="directions">Directions</label><br />
                <ol>
                    {directionList}
                </ol>
                <button className="add-new-input" onClick={this.addDirection}>Add direction</button>
            </div>
        );
    }
}

class DirectionInput extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(event) {
        event.preventDefault();

        const direction = event.target; 
        if (direction.value.length === 0) {
            direction.setCustomValidity('Please provide a direction.');
        }
        else if (direction.value.trim().length === 0) {
            direction.setCustomValidity('Title cannot only contain empty spaces.'); 
        } 
        else {
            direction.setCustomValidity(''); 
        }
        this.props.updateDirections(Number(this.props.index), direction.value);
    }

    render() {
        return (
            <div className="direction-input">
                <input 
                    className="direction"
                    form="new-recipe" 
                    name="directions" 
                    type="text" 
                    value={this.props.direction} 
                    onChange={this.handleInput} 
                    placeholder="Enter new direction" 
                    required 
                />
            </div>
        )
    }
}