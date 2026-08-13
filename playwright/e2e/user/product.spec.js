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

    test('it should return an error when creating a duplicate product name', async ({ request }) => {
        // Gera dados novos do produto dentro do teste
        const product = {
            nome: `${faker.commerce.productName()} ${Date.now()}`,
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        // Primeiro, cria o produto
        const createResponse = await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
        expect(createResponse.status()).toBe(201);

        // Tenta criar o mesmo produto novamente
        const response = await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(response.status()).toBe(400);

        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Já existe produto com esse nome');
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

    test('it should return an error when creating a product with empty required nome field', async ({ request }) => {
        const incompleteProduct = {
            nome: '', // nome is empty
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
        expect(responseData).toHaveProperty('nome'); // Verifica se a resposta contém a propriedade 'nome'
        expect(responseData.nome).toBe('nome não pode ficar em branco');
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

    test('it should return an error when creating a product with empty required preco field', async ({ request }) => {
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: '', // preco is empty
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
        expect(responseData).toHaveProperty('preco'); // Verifica se a resposta contém a propriedade 'preco'
        expect(responseData.preco).toBe('preco deve ser um número');
    });

    test('it should return and error when creating a product with invalid preco field (string instead of number)', async ({ request }) => {

        const invalid_price = '-10,00'; // preco is a string instead of a number
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: invalid_price, // preco is a string instead of a number
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
        expect(responseData).toHaveProperty('preco'); // Verifica se a resposta contém a propriedade 'preco'
        expect(responseData.preco).toBe('preco deve ser um número');
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

    test('it should return an error when creating a product with empty required descricao field', async ({ request }) => {
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: '', // descricao is empty
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
        expect(responseData).toHaveProperty('descricao'); // Verifica se a resposta contém a propriedade 'descricao'
        expect(responseData.descricao).toBe('descricao não pode ficar em branco');
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

    test('it should return an error when creating a product with empty required quantidade field', async ({ request }) => {
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: '' // quantidade is empty
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
        expect(responseData.quantidade).toBe('quantidade deve ser um número');
    });

    test('it should return an error when creating a product with invalid quantidade field (string instead of number)', async ({ request }) => {
        const invalid_quantity = 'dez'; // quantidade is a string instead of a number
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: invalid_quantity // quantidade is a string instead of a number
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
        expect(responseData.quantidade).toBe('quantidade deve ser um número');
    });

    test('it should return an error when creating a product with missing required administrador field', async ({ request }) => {
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
            // administrador is missing
        };
        const response = await request.post('https://serverest.dev/produtos', {
            data: incompleteProduct,
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        // Marca o teste como "fixme" apontando o ID do bug/card
        test.fixme(true, 'BUG: API returning 201 instead of 400 for non-existent administrador is missing');
        expect(response.status()).toBe(400);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('administrador'); // Verifica se a resposta contém a propriedade 'administrador'
        expect(responseData.administrador).toBe('administrador é obrigatório');
    });

    test('it should return an error when creating a product with invalid administrador field (not "true" or "false")', async ({ request }) => {
        const invalid_administrador = 'yes'; // administrador is not "true" or "false"
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 }),
            administrador: invalid_administrador // administrador is invalid
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
        expect(responseData).toHaveProperty('administrador'); // Verifica se a resposta contém a propriedade 'administrador'
        expect(responseData.administrador).toBe('administrador não é permitido');
    });

    test('it should return an error when creating a product with empty required administrador field', async ({ request }) => {
        const incompleteProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 }),
            administrador: '' // administrador is empty
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
        expect(responseData).toHaveProperty('administrador'); // Verifica se a resposta contém a propriedade 'administrador'
        expect(responseData.administrador).toBe('administrador não é permitido');
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
        // expect(responseData).toHaveProperty('administrador');

        expect(responseData.nome).toBe('nome é obrigatório');
        expect(responseData.preco).toBe('preco é obrigatório');
        expect(responseData.descricao).toBe('descricao é obrigatório');
        expect(responseData.quantidade).toBe('quantidade é obrigatório');
        // expect(responseData.administrador).toBe('administrador é obrigatório');
    });

    test('it should return an error when creating a product with all invalid required fields', async ({ request }) => {
        const invalidProduct = {
            nome: 123,
            preco: 'invalid',
            descricao: 456,
            quantidade: 'invalid',
            administrador: 'invalid'
        };
        const response = await request.post('https://serverest.dev/produtos', {
            data: invalidProduct,
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
        expect(responseData).toHaveProperty('administrador');

        expect(responseData.nome).toBe('nome deve ser uma string');
        expect(responseData.preco).toBe('preco deve ser um número');
        expect(responseData.descricao).toBe('descricao deve ser uma string');
        expect(responseData.quantidade).toBe('quantidade deve ser um número');
        expect(responseData.administrador).toBe('administrador não é permitido');
    });

    test('it should return an error when the tkoken is missing', async ({ request }) => {
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
                // 'authorization' header is missing or invalid
            }
        });

        expect(response.status()).toBe(401);

        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais');
    });

    test('it should return an error when the token is invalid', async ({ request }) => {
        const invalid_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2jWBLfI8T4JdF-P_A6gU3P-XoDq3o';
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
                // 'authorization': 'Bearer invalid_token'
                'authorization': `Bearer ${invalid_token}`
            }
        });

        expect(response.status()).toBe(401);

        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais');
    });

    test('it should return an error when the token is expired', async ({ request }) => {
        const expired_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxlbGFuZC5vY29ubmVyQGdtYWlsLmNvbSIsInBhc3N3b3JkIjoic0owUUp5dkxQWkRSZng4IiwiaWF0IjoxNzg1Nzk2ODgxLCJleHAiOjE3ODU3OTc0ODF9.K-57b8Vd3IbCWZUh8qSpb63YqCp1UchJO2sEXyZp7h4';
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
                'authorization': `Bearer ${expired_token}`
            }
        });

        expect(response.status()).toBe(401);

        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais');
    });
});

test.describe('GET /produtos', () => {

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

    test('it should return a list of products', async ({ request }) => {
        const product = {
            nome: `${faker.commerce.productName()} ${Date.now()}`,
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const createResponse = await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'authorization': authorization
            }
        });
        expect(createResponse.status()).toBe(201);

        const response = await request.get('https://serverest.dev/produtos', {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(200);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração

        expect(Array.isArray(responseData.produtos)).toBe(true);

        expect(responseData.produtos.length).toBeGreaterThan(0);
        responseData.produtos.forEach(product => {
            expect(product).toHaveProperty('_id');
            expect(product).toHaveProperty('nome');
            expect(product).toHaveProperty('preco');
            expect(product).toHaveProperty('descricao');
            expect(product).toHaveProperty('quantidade');
        });
    });

    test('it should return a list when the token is missing', async ({ request }) => {
        const response = await request.get('https://serverest.dev/produtos', {
            headers: {
                'Content-Type': 'application/json',
                // 'authorization' header is missing
            }
        });
        expect(response.status()).toBe(200);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração

        expect(Array.isArray(responseData.produtos)).toBe(true);

        expect(responseData.produtos.length).toBeGreaterThan(0);
        responseData.produtos.forEach(product => {
            expect(product).toHaveProperty('_id');
            expect(product).toHaveProperty('nome');
            expect(product).toHaveProperty('preco');
            expect(product).toHaveProperty('descricao');
            expect(product).toHaveProperty('quantidade');
        });
    });

    test('it should return a list when the token is invalid', async ({ request }) => {
        const invalid_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2jWBLfI8T4JdF-P_A6gU3P-XoDq3o';
        const response = await request.get('https://serverest.dev/produtos', {
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${invalid_token}`
            }
        });
        expect(response.status()).toBe(200);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração  
        expect(Array.isArray(responseData.produtos)).toBe(true);

        expect(responseData.produtos.length).toBeGreaterThan(0);
        responseData.produtos.forEach(product => {
            expect(product).toHaveProperty('_id');
            expect(product).toHaveProperty('nome');
            expect(product).toHaveProperty('preco');
            expect(product).toHaveProperty('descricao');
            expect(product).toHaveProperty('quantidade');
        });
    });

    test('it should return a list when the token is expired', async ({ request }) => {
        const expired_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxlbGFuZC5vY29ubmVyQGdtYWlsLmNvbSIsInBhc3N3b3JkIjoic0owUUp5dkxQWkRSZng4IiwiaWF0IjoxNzg1Nzk2ODgxLCJleHAiOjE3ODU3OTc0ODF9.K-57b8Vd3IbCWZUh8qSpb63YqCp1UchJO2sEXyZp7h4';
        const response = await request.get('https://serverest.dev/produtos', {
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${expired_token}`
            }
        });
        expect(response.status()).toBe(200);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração

        expect(Array.isArray(responseData.produtos)).toBe(true);

        expect(responseData.produtos.length).toBeGreaterThan(0);
        responseData.produtos.forEach(product => {
            expect(product).toHaveProperty('_id');
            expect(product).toHaveProperty('nome');
            expect(product).toHaveProperty('preco');
            expect(product).toHaveProperty('descricao');
            expect(product).toHaveProperty('quantidade');
        });
    });

    test('it should error when the url is invalid', async ({ request }) => {
        const response = await request.get('https://serverest.dev/produtos-invalidos', {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(405);
        const responseData = await response.json();
        // console.log('Response Data:', responseData);
        expect(responseData).toHaveProperty('message', 'Não é possível realizar GET em /produtos-invalidos. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should error when the url is invalid and the token is missing', async ({ request }) => {
        const response = await request.get('https://serverest.dev/produtos-invalidos', {
            headers: {
                'Content-Type': 'application/json',
                // 'authorization' header is missing
            }
        });
        expect(response.status()).toBe(405);
        const responseData = await response.json();
        // console.log('Response Data:', responseData);
        expect(responseData).toHaveProperty('message', 'Não é possível realizar GET em /produtos-invalidos. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should error when the url is invalid and the token is invalid', async ({ request }) => {
        const invalid_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2jWBLfI8T4JdF-P_A6gU3P-XoDq3o';
        const response = await request.get('https://serverest.dev/produtos-invalidos', {
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${invalid_token}`
            }
        });
        expect(response.status()).toBe(405);
        const responseData = await response.json();
        // console.log('Response Data:', responseData);
        expect(responseData).toHaveProperty('message', 'Não é possível realizar GET em /produtos-invalidos. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should error when the url is invalid and the token is expired', async ({ request }) => {
        const expired_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxlbGFuZC5vY29ubmVyQGdtYWlsLmNvbSIsInBhc3N3b3JkIjoic0owUUp5dkxQWkRSZng4IiwiaWF0IjoxNzg1Nzk2ODgxLCJleHAiOjE3ODU3OTc0ODF9.K-57b8Vd3IbCWZUh8qSpb63YqCp1UchJO2sEXyZp7h4';
        const response = await request.get('https://serverest.dev/produtos-invalidos', {
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${expired_token}`
            }
        });
        expect(response.status()).toBe(405);
        const responseData = await response.json();
        // console.log('Response Data:', responseData);
        expect(responseData).toHaveProperty('message', 'Não é possível realizar GET em /produtos-invalidos. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });
});

test.describe('GET /produtos/:id', () => {

    test('it should return a product by id', async ({ request }) => {
        const produtoId = 'BeeJh5lz3k6kSIzA';

        const createResponse = await request.get(`https://serverest.dev/produtos/${produtoId}`);

        expect(createResponse.status()).toBe(200);
        const responseData = await createResponse.json();

        console.log('Response Data:', responseData); // Log para depuração

        expect(responseData).toHaveProperty('_id', produtoId);
        expect(responseData).toHaveProperty('nome');
        expect(responseData).toHaveProperty('preco');
        expect(responseData).toHaveProperty('descricao');
        expect(responseData).toHaveProperty('quantidade');
    });

    test('it should return list of the products when the product id is missing', async ({ request }) => {
        const emptyProductId = '';

        const response = await request.get(`https://serverest.dev/produtos/${emptyProductId}`);

        expect(response.status()).toBe(200);

        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração

        expect(Array.isArray(responseData.produtos)).toBe(true);

        expect(responseData.produtos.length).toBeGreaterThan(0);
        responseData.produtos.forEach(product => {
            expect(product).toHaveProperty('_id');
            expect(product).toHaveProperty('nome');
            expect(product).toHaveProperty('preco');
            expect(product).toHaveProperty('descricao');
            expect(product).toHaveProperty('quantidade');
        });
    });

    test('it should return an error when the product id is invalid', async ({ request }) => {
        const invalidProductId = 'invalid-id';

        const response = await request.get(`https://serverest.dev/produtos/${invalidProductId}`);

        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos');
    });

    test('it should return an error when the product id does not exist', async ({ request }) => {
        const nonExistentProductId = '1234567890123456'; // 16 caracteres alfanuméricos, mas não existe

        const response = await request.get(`https://serverest.dev/produtos/${nonExistentProductId}`);

        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Produto não encontrado');
    });

    test('it should return an error when the product id is missing and the url is invalid', async ({ request }) => {
        const emptyProductId = '';

        const response = await request.get(`https://serverest.dev/produtos-invalidos/${emptyProductId}`);

        expect(response.status()).toBe(405);
        const responseData = await response.json();
        // console.log('Response Data:', responseData);
        expect(responseData).toHaveProperty('message', 'Não é possível realizar GET em /produtos-invalidos/. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });
});

test.describe('PUT /produtos/:id', () => {
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

        const product = {
            nome: `${faker.commerce.productName()} ${Date.now()}`,
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };
        // 4. Criar produto
        const createProductResponse = await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'authorization': authorization
            }
        });
        expect(createProductResponse.ok()).toBeTruthy();
        const createProductData = await createProductResponse.json();
        productId = createProductData._id;
    });

    test('it should update a product by id', async ({ request }) => {
        const updatedProduct = {
            nome: `${faker.commerce.productName()} ${Date.now()}`,
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.put(`https://serverest.dev/produtos/${productId}`, {
            data: updatedProduct,
            headers: {
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(200);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração

        expect(responseData).toHaveProperty('message', 'Registro alterado com sucesso');
    });

    test('it should return an error when updating a product with invalid id', async ({ request }) => {
        const invalidProductId = 'invalid-id';
        const updatedProduct = {
            nome: `${faker.commerce.productName()} ${Date.now()}`,
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.put(`https://serverest.dev/produtos/${invalidProductId}`, {
            data: updatedProduct,
            headers: {
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos');
    });

    test('it should return an error when updating a product with non-existent id', async ({ request }) => {
        const nonExistentProductId = '1234567890123456';
        const updatedProduct = {
            nome: `${faker.commerce.productName()} ${Date.now()}`,
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.put(`https://serverest.dev/produtos/${nonExistentProductId}`, {
            data: updatedProduct,
            headers: {
                'authorization': authorization
            }
        });

        // Marca o teste como "fixme" apontando o ID do bug/card
        test.fixme(true, 'BUG: API returning 201 instead of 400 for non-existent product ID');

        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Produto não encontrado');
    });

    test('it should return an error when updating a product when nome has more than 124 characters', async ({ request }) => {
        const invalidProduct = {
            nome: 'a'.repeat(125), // nome with 125 characters
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.put(`https://serverest.dev/produtos/${productId}`, {
            data: invalidProduct,
            headers: {
                'authorization': authorization
            }
        });
        // Marca o teste como "fixme" apontando o ID do bug/card
        test.fixme(true, 'BUG: API returning 200 instead of 400 for nome with more than 124 characters');

        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Alguns campos são obrigatórios');
    });

    test('it should return an error when updating a product when preco is negative', async ({ request }) => {
        const invalidProduct = {
            nome: faker.commerce.productName(),
            preco: -10, // preco is negative
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.put(`https://serverest.dev/produtos/${productId}`, {
            data: invalidProduct,
            headers: {
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('preco', 'preco deve ser um número positivo');
    });

    test('it should return an error when updating a product when quantidade is negative', async ({ request }) => {
        const invalidProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: -5 // quantidade is negative
        };

        const response = await request.put(`https://serverest.dev/produtos/${productId}`, {
            data: invalidProduct,
            headers: {
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('quantidade', 'quantidade deve ser maior ou igual a 0');
    });

    test('it should return an error when token is missing', async ({ request }) => {
        const updatedProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };
        const response = await request.put(`https://serverest.dev/produtos/${productId}`, {
            data: updatedProduct,
            headers: {
                // 'authorization' header is intentionally missing
            }
        });
        expect(response.status()).toBe(401);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais');
    });

    test('it should return an error when token is invalid', async ({ request }) => {
        const invalid_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2jWBLfI8T4JdF-P_A6gU3P-XoDq3o';
        const updatedProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.put(`https://serverest.dev/produtos/${productId}`, {
            data: updatedProduct,
            headers: {
                'authorization': invalid_token
            }
        });
        expect(response.status()).toBe(401);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais');
    });

    test('it should return an error when token is expired', async ({ request }) => {
        const expired_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxlbGFuZC5vY29ubmVyQGdtYWlsLmNvbSIsInBhc3N3b3JkIjoic0owUUp5dkxQWkRSZng4IiwiaWF0IjoxNzg1Nzk2ODgxLCJleHAiOjE3ODU3OTc0ODF9.K-57b8Vd3IbCWZUh8qSpb63YqCp1UchJO2sEXyZp7h4';
        const updatedProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };

        const response = await request.put(`https://serverest.dev/produtos/${productId}`, {
            data: updatedProduct,
            headers: {
                'authorization': expired_token
            }
        });
        expect(response.status()).toBe(401);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais');
    });

    test('it should return an error when the url is invalid', async ({ request }) => {
        const updatedProduct = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };
        const response = await request.put(`https://serverest.dev/produtos/invalid-url`, {
            data: updatedProduct,
            headers: {
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos');
    });
});

test.describe('DELETE /produtos/:id', () => {
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

        const product = {
            nome: `${faker.commerce.productName()} ${Date.now()}`,
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 100 })
        };
        // 4. Criar produto
        const createProductResponse = await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'authorization': authorization
            }
        });
        expect(createProductResponse.ok()).toBeTruthy();
        const createProductData = await createProductResponse.json();
        productId = createProductData._id;
    });

    test('it should delete a product by id', async ({ request }) => {
        const response = await request.delete(`https://serverest.dev/produtos/${productId}`, {
            headers: {
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(200);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Registro excluído com sucesso');
    });

    test('it should return an error when the product id is empty', async ({ request }) => {
        const emptyProductId = '';
        const response = await request.delete(`https://serverest.dev/produtos/${emptyProductId}`, {
            headers: {
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(405);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Não é possível realizar DELETE em /produtos/. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return an error when the product id is invalid', async ({ request }) => {
        const invalidProductId = 'invalid-id';
        const response = await request.delete(`https://serverest.dev/produtos/${invalidProductId}`, {
            headers: {
                'authorization': authorization
            }
        });
        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos');
    });

    test('it should return an error when the product id does not exist', async ({ request }) => {
        const nonExistentProductId = '1234567890123456';
        const response = await request.delete(`https://serverest.dev/produtos/${nonExistentProductId}`, {
            headers: {
                'authorization': authorization
            }
        });
        // Marca o teste como "fixme" apontando o ID do bug/card
        test.fixme(true, 'BUG: API returning 200 instead of 400 for non-existent product ID');

        expect(response.status()).toBe(400);
        const responseData = await response.json();
        console.log('Response Data:', responseData); // Log para depuração
        expect(responseData).toHaveProperty('message', 'Produto não encontrado');
    });
});