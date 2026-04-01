const loginHeader = <h1>Login</h1>

function LoginPage() {
    return (
        <div>
            {loginHeader}
            <form>
                <label htmlFor="username">Email Address: </label>
                <input type="text" id="username" name="username" /> <br />
                <br /><label htmlFor="password">Password: </label>
                <input type="password" id="password" name="password" /> <br />
                <br /> <button type="submit">Login</button>
            </form>
        </div>
    )
}   

export default LoginPage;