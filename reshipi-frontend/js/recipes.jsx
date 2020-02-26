import React from 'react';
import ReactDom from 'react-dom';

'use strict';

class Button extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return(
            <button onClick={() => console.log("clicked")}>
                Click
            </button>
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
                </main>
            </div>
        );
    }
}

const root = document.getElementById("root");
ReactDom.render(<App />, root);