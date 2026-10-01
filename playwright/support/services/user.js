import { get } from "node:http";

export const postUserService = (request) => {
    const createUser = async (user) => {
        return await request.post('https://serverest.dev/usuarios', {
            data: user
        });
    }
    return {
        createUser
    };
};
// module.exports = userService

export const getUserService = (request) => {
    const getUsers = async () => {
        return await request.get(`https://serverest.dev/usuarios`, {
        });
    }
    const getUserById = async (id) => {
        return await request.get(`https://serverest.dev/usuarios/${id}`, {
        });
    }
    return {
        getUsers,
        getUserById
    };
};

