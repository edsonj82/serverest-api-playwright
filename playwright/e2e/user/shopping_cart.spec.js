import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'

test.describe('POST /carrinhos', () => {
    let authorization, productId;

    test.beforeAll(async ({ request }) => {
        // 1. Dados do usuário Administrador
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();
        const password = faker.internet.password();

        const user = {
            nome: fullName,
            email: email,
            password: password,
            administrador: 'true' // Obrigatório ser string 'true' no ServeRest
        };

        // 2. Criar usuário admin
        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });
        expect(response.ok()).toBeTruthy();

        // 3. Fazer login para capturar o Token
        const loginResponse = await request.post('https://serverest.dev/login', {
            data: {
                email: email,
                password: password
            }
        });
        expect(loginResponse.ok()).toBeTruthy();

        const loginData = await loginResponse.json();
        authorization = loginData.authorization; // Armazena "Bearer <token>"

        // 4. Criar um produto para adicionar ao carrinho
        const product = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const productResponse = await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'Content-Type': 'application/json',
                // Garante a passagem da autorização corretamente
                'authorization': authorization
            }
        });

        const productResponseData = await productResponse.json();
        console.log(productResponseData);

        productId = productResponseData._id; // Armazena o ID do produto criado
        expect(productResponse.status()).toBe(201);
    });

    test('it should create a shopping cart successfully', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId, // Substitua pelo ID do produto criado dinamicamente
                        quantidade: 1
                    }
                ]
            },
            headers: {
                Authorization: authorization
            }
        });
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(201);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('_id');
        expect(responseData).toHaveProperty('message');

        expect(responseData).toHaveProperty('message', 'Cadastro realizado com sucesso');
    });
});
