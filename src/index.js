import React from './simple-source'

// import App from './App';
import * as serviceWorker from './serviceWorker';

function App(props) {
    const [count, setCount] = React.useState(1)
    return (
        <div className='app'>
            <p>learn{props.name}</p>
            <p onClick={()=>{console.log('manny')}}>react source</p>
            <p onClick={()=>{setCount(count + 1)}}>click:: {count}</p>
        </div>
    )
}
let app = <App name='yoyo' />

React.render(app, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
