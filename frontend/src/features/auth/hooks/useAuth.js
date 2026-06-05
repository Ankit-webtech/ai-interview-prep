import { useContext , useEffect } from 'react';
import { AuthContext } from '../auth.context.jsx';
import { login, register, logout, getMe } from '../services/auth.api.js';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    const { user, setUser, loading, setLoading } = context;

    const handleLogin = async ({ email , password }) => {
        setLoading(true);
        try{
            const data = await login({email, password});
            setUser(data.user);
            return true;
        }catch(error){
            console.error('Login failed:', error);
            return false;
        }finally{
            setLoading(false);
        }

    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });
            setUser(data.user);
            return true;
        } catch (error) {
            console.error('Register failed:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
          const data =  await logout();
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGetMe = async () => {
        setLoading(true);
        try {
            const data = await getMe();
            setUser(data.user);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() =>{
        const getAndSetUser = async () => {
            try {
                const data = await getMe();
                setUser(data.user);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
            finally{
                setLoading(false);
            }
        };
        getAndSetUser();
    }, []);

    return { user, loading, handleLogin, handleRegister, handleLogout, handleGetMe };

}