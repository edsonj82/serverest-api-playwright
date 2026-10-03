import { get } from "node:http";

export const userService = (request) => {
    const createUser = async (user) => {
        return await request.post('https://serverest.dev/usuarios', {
            data: user
        });
    };
    const getUsers = async () => {
        return await request.get(`https://serverest.dev/usuarios`, {
        });
    };
    const getUserById = async (id) => {
        return await request.get(`https://serverest.dev/usuarios/${id}`, {
        });
    };

    return {
        createUser,
        getUsers,
        getUserById
    };
};

