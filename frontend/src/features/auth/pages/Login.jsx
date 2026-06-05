import React from 'react'
import '../auth.form.scss';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';



const Login = () => {

    const { loading , handleLogin } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
             const success = await handleLogin({ email, password });
             if (success) {
                 navigate('/');
             } else {
                 // keep user on login page; optionally show an error
                 alert('Login failed. Please check your credentials.');
             }
    }

    if(loading){
        return <main><h1>Loading......</h1></main>
    }

  return (
    <main>
        <div className="form-container">
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input onChange={(e) => {setEmail(e.target.value)}} type="email" id="email" name='email' placeholder='Enter email address' />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input onChange={(e) => {setPassword(e.target.value)}} type="password" id="password" name='password' placeholder='Enter password' />
                </div>
                <button className='button primary-button' type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

             <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
    </main>
  )
}

export default Login;