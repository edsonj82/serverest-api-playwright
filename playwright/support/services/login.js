export const loginService = (request) => {
    const postLogin = async (user) => {
        return await request.post('https://serverest.dev/login', {
            data: {
                email: user.email,
                password: user.password
            }
        });
    };
    return {
        postLogin
    };
};