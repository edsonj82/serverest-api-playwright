export const userService = (request) => {
    const createUser = async (user) => {
        return await request.post('https://serverest.dev/usuarios', {
            data: user
        });
    }
    return {
        createUser
    }

}

// module.exports = userService