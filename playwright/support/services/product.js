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
    const getProductById = async (productId, authorization) => {
        return await request.get(`https://serverest.dev/produtos/${productId}`, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
    };
    const getProducts = async (queryParams, authorization) => {
        return await request.get('https://serverest.dev/produtos', {
            params: queryParams,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
    };
    const updateProduct = async (productId, updatedProduct, authorization) => {
        return await request.put(`https://serverest.dev/produtos/${productId}`, {
            data: updatedProduct,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
    };
    return {
        createProduct,
        getProductById,
        getProducts,
        updateProduct
    };
};