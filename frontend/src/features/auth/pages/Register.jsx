import React from 'react'
import '../auth.form.scss';
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import { useNavigate } from 'react-router';


const Register = () => {
    const { loading, handleRegister } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const success = await handleRegister({ username, email, password });
            if (success) {
                navigate('/login');
            } else {
                alert('Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Register failed in page:', err);
        }
    }

    if (loading) {
        return <main><h1>Loading......</h1></main>
    }

  return (
     <main>
        <div className="form-container">
            <h1>Register</h1>

            <form onSubmit={handleSubmit}> 

                <div className="input-group">
                    <label htmlFor="username">Username</label>
                    <input onChange={(e) => setUsername(e.target.value)} value={username} type="text" id="username" name='username' placeholder='Enter username' />
                </div>

                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input onChange={(e) => setEmail(e.target.value)} type="email" id="email" name='email' placeholder='Enter email address' />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" id="password" name='password' placeholder='Enter password' />
                </div>
                <button className='button primary-button' type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>

            <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
    </main>
  )
}

export default Register