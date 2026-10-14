import { useState } from "react";
import "./App.css";
import Signup from "./components/Signup";
import Login from "./components/Login";

function App() {
    const [showLogin, setShowLogin] = useState(true);

    return (
        <div className="container">
            <h1>Login and Signup</h1>

            <div className="switch-buttons">
                <button onClick={() => setShowLogin(true)}>
                    Login
                </button>

                <button onClick={() => setShowLogin(false)}>
                    Sign Up
                </button>
            </div>

            <div className="single-form">
                {showLogin ? <Login /> : <Signup />}
            </div>
        </div>
    );
}

export default App;