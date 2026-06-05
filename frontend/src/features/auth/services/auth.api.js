import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true
});



export async function register({username , email , password}) {

    try {
        const response = await api.post('/api/auth/register', {
            username,
            email,
            password
        });
        return response.data;

    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}



export async function login({email , password}) {

    try {
        const response = await api.post('/api/auth/login', {
            email,
            password
        });
        return response.data;
    } catch (error) {
        console.error('Error logging in user:', error);
        throw error;
    }
}

export async function logout() {
    try {
        await api.get('/api/auth/logout', {});
    } catch (error) {
        console.error('Error logging out user:', error);
        throw error;
    }
}

export async function getMe(){
    try {
        const response = await api.get('/api/auth/get-me');
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}