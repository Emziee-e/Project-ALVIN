const loginHeader = <h1 class="loginHeader">Login</h1>
import './loginPage.css';

function LoginPage() {
    return (
        <div>
            {loginHeader}
            <form>
                <label htmlFor="email">Email Address: </label>
                <input type="email" id="email" name="email" /> <br />
                <br /><label htmlFor="password">Password: </label>
                <input type="password" id="password" name="password" /> <br />
                <br /> <button type="submit">Login</button>
            </form>
        </div>
    )
}   

export default LoginPage;