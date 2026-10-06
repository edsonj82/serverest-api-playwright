export const productService = (request) => {
    const createProduct = async (product, authorization) => {
        return await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
    };
    return {
        createProduct
    };
};