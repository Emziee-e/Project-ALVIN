import './loginPage.css';

function LoginPage() {
    return (
        <div className="loginContainer">
            <div className="logoSection">
                <div className="logoPlaceholder">
                    <span>Your Logo Here</span>
                </div>
            </div>
            <div className="formSection">
                <h1 className="loginHeader">Login</h1>
                <form className="loginForm">
                    <div className="formGroup">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" name="email" placeholder="Enter your email" />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" name="password" placeholder="Enter your password" />
                    </div>
                    <button type="submit" className="loginButton">Sign In</button>
                </form>
                <p className="signupText">Don't have an account? <a href="#signup">Sign up</a></p>
            </div>
        </div>
    )
}   

export default LoginPage;