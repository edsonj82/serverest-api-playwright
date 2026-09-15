import { faker } from '@faker-js/faker'

export const getProduct = () => {
    // 1. Dados do Produto
    const productName = faker.commerce.productName();
    const price = faker.number.int({ min: 10, max: 1000 });
    const description = faker.commerce.productDescription();
    const quantity = faker.number.int({ min: 1, max: 100 });

    return {
        nome: productName,
        preco: price,
        descricao: description,
        quantidade: quantity
    }
}