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
                <a id="reshipi" href="">Reshipi</a>
                <div id="user-auth-actions">
                    <button id="login">Login</button>
                </div>
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
                    <div id="main-information">

                    </div>
                    <div id="signup">

                    </div>
                </main>
            </div>
        );
    }
}

const root = document.getElementById("root");
ReactDom.render(<App />, root);