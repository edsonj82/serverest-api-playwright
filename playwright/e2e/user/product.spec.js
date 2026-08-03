import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('POST /produtos', () => {
    let authorization;

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
    });

    test('it should create a product successfully with valid data', async ({ request }) => {
        // Gera dados novos do produto dentro do teste
        const product = {
            nome: `${faker.commerce.productName()} ${Date.now()}`, // Combina o nome do Faker com um timestamp para NUNCA dar conflito de nome na API
            preco: faker.number.int({ min: 10, max: 1000 }), // Gera um número inteiro válido (o ServeRest não aceita decimais nem string no preço)
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 }) // Converte para número inteiro
        };

        const response = await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'Content-Type': 'application/json',
                // Garante a passagem da autorização corretamente
                'authorization': authorization
            }
        });

        expect(response.status()).toBe(201);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('message', 'Cadastro realizado com sucesso');
        expect(responseData).toHaveProperty('_id');
    });

    test('it should return an error when the user is not an administrator', async ({ request }) => {
        // 1. Criar um usuário comum (não administrador)
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();
        const password = faker.internet.password();
        const user = {
            nome: fullName,
            email: email,
            password: password,
            administrador: 'false' // Usuário comum
        };

        // 2. Criar usuário comum
        const createUserResponse = await request.post('https://serverest.dev/usuarios', {
            data: user
        });
        expect(createUserResponse.ok()).toBeTruthy();

        // 3. Fazer login para capturar o Token do usuário comum
        const loginResponse = await request.post('https://serverest.dev/login', {
            data: {
                email: email,
                password: password
            }
        });
        expect(loginResponse.ok()).toBeTruthy();

        const loginData = await loginResponse.json();
        const userAuthorization = loginData.authorization; // Armazena "Bearer <token>"

        // 4. Tentar criar um produto com o usuário comum
        const product = {
            nome: `${faker.commerce.productName()} ${Date.now()}`,
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'Content-Type': 'application/json',
                'authorization': userAuthorization
            }
        });

        expect(response.status()).toBe(403);

        const responseData = await response.json();
        // console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Rota exclusiva para administradores');
    });

    test('it should return an error when creating a product with missing required nome field', async ({ request }) => {
        const incompleteProduct = {
            // nome is missing
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.post('https://serverest.dev/produtos', {
            data: incompleteProduct,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(response.status()).toBe(400);

        const responseData = await response.json();

        // console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('nome'); // Verifica se a resposta contém a propriedade 'nome'
        expect(responseData.nome).toBe('nome é obrigatório');
    });

    test('it should return an error when creating a product with missing required preco field', async ({ request }) => {
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            // preco is missing
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.post('https://serverest.dev/produtos', {
            data: incompleteProduct,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(response.status()).toBe(400);

        const responseData = await response.json();

        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('preco'); // Verifica se a resposta contém a propriedade 'preco'
        expect(responseData.preco).toBe('preco é obrigatório');

    });

    test('it should return an error when creating a product with missing required descricao field', async ({ request }) => {
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            // descricao is missing
            quantidade: faker.number.int({ min: 1, max: 100 })
        };
        const response = await request.post('https://serverest.dev/produtos', {
            data: incompleteProduct,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(response.status()).toBe(400);

        const responseData = await response.json();

        // console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('descricao'); // Verifica se a resposta contém a propriedade 'descricao'
        expect(responseData.descricao).toBe('descricao é obrigatório');
    });

    test('it should return an error when creating a product with missing required quantidade field', async ({ request }) => {
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription()
            // quantidade is missing
        };
        const response = await request.post('https://serverest.dev/produtos', {
            data: incompleteProduct,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(400);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('quantidade'); // Verifica se a resposta contém a propriedade 'quantidade'
        expect(responseData.quantidade).toBe('quantidade é obrigatório');
    });

    test('it should return an error when creating a product with all missing required fields', async ({ request }) => {
        const incompleteProduct = {
            // All required fields are missing
        };

        const response = await request.post('https://serverest.dev/produtos', {
            data: incompleteProduct,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(response.status()).toBe(400);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('nome');
        expect(responseData).toHaveProperty('preco');
        expect(responseData).toHaveProperty('descricao');
        expect(responseData).toHaveProperty('quantidade');

        expect(responseData.nome).toBe('nome é obrigatório');
        expect(responseData.preco).toBe('preco é obrigatório');
        expect(responseData.descricao).toBe('descricao é obrigatório');
        expect(responseData.quantidade).toBe('quantidade é obrigatório');
    });
});
