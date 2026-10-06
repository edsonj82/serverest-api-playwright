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
    const updateUser = async (userId, updateData) => {
        return await request.put(`https://serverest.dev/usuarios/${userId}`, {
            data: updateData
        });
    };
    const deleteUser = async (userId) => {
        const safeUserId = typeof userId === 'symbol' ? userId.description : String(userId);
        return await request.delete(`https://serverest.dev/usuarios/${safeUserId}`, {
        });
    };
    return {
        createUser,
        getUsers,
        getUserById,
        updateUser,
        deleteUser
    };
};

