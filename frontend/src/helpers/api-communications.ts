import axios from 'axios' 

export const userLogin = async (email: string, password: string) => {
    const res = await axios.post("/user/login", {email: email, password: password});
    if(res.status !== 201) {
        throw new Error("Unable to login");
    }
    const data = await res.data;
    return data;
}

export const checkAuthStatus = async () => {
    const res = await axios.get("/user/auth-status");
    if(res.status !== 201) {
        throw new Error("Unable to authenticate");
    }
    const data = await res.data;
    return data;
}