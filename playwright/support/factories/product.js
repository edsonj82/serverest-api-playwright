import { faker } from '@faker-js/faker'

export const getProduct = () => {
    // 1. Dados do Produto
    const productName = faker.commerce.productName();
    const price = faker.number.int({ min: 10, max: 1000 });
    const description = faker.commerce.productDescription();
    const quantity = faker.number.int({ min: 1, max: 100 });

    return {
        // nome: faker.commerce.productName(),
        // preco: faker.number.int({ min: 10, max: 1000 }),
        // descricao: faker.commerce.productDescription(),
        // quantidade: faker.number.int({ min: 1, max: 100 })
        nome: productName,
        preco: price,
        descricao: description,
        quantidade: quantity
    }
}