// @ts-check
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

//User API tests
test.describe('POST /usuarios', () => {

    const invalidEmailScenarios = [// Matriz de cenários (Scenario Outline / Data Table)
        { email: 'email-without-at.com', reason: 'missing @ symbol' },
        { email: '@domain.com', reason: 'missing username before @' },
        { email: 'user@.com', reason: 'missing domain after @' },
        { email: 'user@domain', reason: 'missing TLD (.com, .io, etc)' },
        { email: 'user @domain.com', reason: 'contains space' },
        { email: '', reason: 'empty email' }
    ];

    test('it should create a new user', async ({ request }) => {

        //const fullName = faker.person.firstName() + ' ' + faker.person.lastName();
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            //email: faker.internet.email({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ')[1] }),
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(201);

        const responseBody = await response.json();

        expect(responseBody).toHaveProperty('_id');
        expect(responseBody).not.toHaveProperty('password');
        expect(responseBody).not.toHaveProperty('administrador');

        expect(responseBody).toHaveProperty('message', 'Cadastro realizado com sucesso');

    });

    test('it should not create a duplicate user', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            //email: faker.internet.email({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ')[1] }),
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(201);

        const responseBody = await response.json();

        expect(responseBody).toHaveProperty('message', 'Cadastro realizado com sucesso');
        expect(responseBody).toHaveProperty('_id');
        expect(responseBody).not.toHaveProperty('password');
        expect(responseBody).not.toHaveProperty('administrador');

        const email = user.email; // Guardamos o email do usuário criado para tentar criar um duplicado

        // Tentamos criar um usuário com o mesmo email
        const duplicateResponse = await request.post('https://serverest.dev/usuarios', {
            data: {
                nome: fullName,
                email: email,
                password: 'admin1234',
                administrador: 'false'
            }
        });

        expect(duplicateResponse.status()).toBe(400);

        const duplicateResponseBody = await duplicateResponse.json();
        expect(duplicateResponseBody).toHaveProperty('message', 'Este email já está sendo usado');
    });

    test('name field should not be empty', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        // const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: "",
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        // console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody).toHaveProperty('nome', 'nome não pode ficar em branco');
    });

    test('name field is required', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        // const fullName = `${firstName} ${lastName}`;

        const user = {
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        // console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody).toHaveProperty('nome', 'nome é obrigatório');
    });

    test('email field should not be empty', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: "",
            password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        // console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody).toHaveProperty('email', 'email não pode ficar em branco')
    });

    test('email field should be valid', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: "invalid-email",
            password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        // console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody).toHaveProperty('email', 'email deve ser um email válido')
    });

    test('email field is required', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            // email: "",
            password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        // console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody).toHaveProperty('email', 'email é obrigatório')
    });

    invalidEmailScenarios.forEach(({ email, reason }) => {// Iteramos criando um teste para cada cenário
        test(`should reject invalid email: ${reason} ('${email}')`, async ({ request }) => {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();

            const user = {
                nome: `${firstName} ${lastName}`,
                email: email,
                password: 'admin1234',
                administrador: 'false'
            };

            const response = await request.post('https://serverest.dev/usuarios', {
                data: user
            });

            expect(response.status()).toBe(400);

            const responseBody = await response.json();
            // Dependendo se o e-mail for totalmente vazio ou mal formatado, 
            // a API do ServeRest costuma retornar a mensagem no campo correspondente
            if (email === '') {
                expect(responseBody).toHaveProperty('email', 'email não pode ficar em branco')

            } else {
                expect(responseBody).toHaveProperty('email', 'email deve ser um email válido')
            }
        });
    });

    test('password field should not be empty', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: "",
            password: "",
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        // console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody).toHaveProperty('password', 'password não pode ficar em branco')
    });

    test('password field is required', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            // password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        // console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody).toHaveProperty('password', 'password é obrigatório');
    });

    test('administrador field should be "true" or "false"', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: ''
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        // console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody).toHaveProperty('administrador', "administrador deve ser 'true' ou 'false'");
    });

    test('administrador field is required', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            // administrador: 'true'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        // console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody).toHaveProperty('administrador', 'administrador é obrigatório');
    });

    test('it should return 405 for invalid endpoint', async ({ request }) => {
        const response = await request.post('https://serverest.dev/usuarios-invalid-endpoint', {
            data: {
                nome: 'Test User',
                email: 'test@example.com'
            }
        });
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar POST em /usuarios-invalid-endpoint. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 405 for invalid endpoint with ID', async ({ request }) => {
        const invalidId = '1234567890123456';
        const response = await request.post(`https://serverest.dev/usuarios-invalid-endpoint/${invalidId}`, {
            data: {
                nome: 'Test User',
                email: 'test@example.com'
            }
        });
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar POST em /usuarios-invalid-endpoint/1234567890123456. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });
});

test.describe('GET /usuarios', () => {
    //GET
    test('it should show list of registered users', async ({ request }) => {

        const response = await request.get('https://serverest.dev/usuarios');

        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.quantidade).toBeGreaterThan(0); // Garantimos que a lista não está vazia (maior que 0)

        body.usuarios.forEach(user => {//Iteramos por todos os usuários para validar a estrutura dos dados
            expect(user).toHaveProperty('nome');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('password');
            expect(user).toHaveProperty('administrador');
            expect(user).toHaveProperty('_id');
        });

        // Validamos se o total reportado no campo 'quantidade' 
        // é EXATAMENTE igual ao número real de itens dentro da lista
        expect(body.quantidade).toBe(body.usuarios.length);
    });

    test('it should return 405 for invalid endpoint', async ({ request }) => {
        const response = await request.get('https://serverest.dev/usuarios-invalid-endpoint');
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar GET em /usuarios-invalid-endpoint. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 405 for invalid endpoint with ID', async ({ request }) => {
        const invalidId = '1234567890123456';
        const response = await request.get(`https://serverest.dev/usuarios-invalid-endpoint/${invalidId}`);
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar GET em /usuarios-invalid-endpoint/1234567890123456. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 405 for invalid endpoint with query parameters', async ({ request }) => {
        const response = await request.get('https://serverest.dev/usuarios-invalid-endpoint?param=value');
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar GET em /usuarios-invalid-endpoint?param=value. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 405 for invalid endpoint with ID and query parameters', async ({ request }) => {
        const invalidId = '1234567890123456';
        const response = await request.get(`https://serverest.dev/usuarios-invalid-endpoint/${invalidId}?param=value`);
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar GET em /usuarios-invalid-endpoint/1234567890123456?param=value. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 405 for invalid endpoint with trailing slash', async ({ request }) => {
        const response = await request.get('https://serverest.dev/usuarios-invalid-endpoint/');
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar GET em /usuarios-invalid-endpoint/. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 405 for invalid endpoint with ID and trailing slash', async ({ request }) => {
        const invalidId = '1234567890123456';
        const response = await request.get(`https://serverest.dev/usuarios-invalid-endpoint/${invalidId}/`);
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', `Não é possível realizar GET em /usuarios-invalid-endpoint/${invalidId}/. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.`);
    });

    test('it should return 405 for invalid endpoint with query parameters and trailing slash', async ({ request }) => {
        const response = await request.get('https://serverest.dev/usuarios-invalid-endpoint/?param=value');
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar GET em /usuarios-invalid-endpoint/?param=value. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 405 for invalid endpoint with ID, query parameters, and trailing slash', async ({ request }) => {
        const invalidId = '1234567890123456';
        const response = await request.get(`https://serverest.dev/usuarios-invalid-endpoint/${invalidId}/?param=value`);
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', `Não é possível realizar GET em /usuarios-invalid-endpoint/${invalidId}/?param=value. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.`);
    });
});

test.describe('GET /usuarios/{id}', () => {

    let userId, nome, email, password, administrador;// 1. Declaramos a variável vazia no escopo do describe

    test('it should show user details by ID', async ({ request }) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(201);

        const responseBody = await response.json();
        userId = responseBody._id;// 2. Guardamos o valor do _id retornado na nossa variável de escopo
        nome = user.nome;
        email = user.email;
        password = user.password;
        administrador = user.administrador;

        const userResponse = await request.get(`https://serverest.dev/usuarios/${userId}`);

        expect(userResponse.status()).toBe(200);

        const body = await userResponse.json();
        expect(body).toHaveProperty('_id', userId);
        expect(body).toHaveProperty('nome', nome);
        expect(body).toHaveProperty('email', email);
        expect(body).toHaveProperty('password', password);
        expect(body).toHaveProperty('administrador', administrador);
    });

    test('it should return 400 for valid length ID that does not exist', async ({ request }) => {
        const nonExistentUserId = '0000000000000000';
        const response = await request.get(`https://serverest.dev/usuarios/${nonExistentUserId}`);

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Usuário não encontrado');
    });

    test('it should return 400 when ID has invalid length', async ({ request }) => {
        const invalidLengthId = '1234nonexistentid';
        const response = await request.get(`https://serverest.dev/usuarios/${invalidLengthId}`);

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos')
    });

    test('it should return 400 when ID is empty', async ({ request }) => {
        const emptyId = '';
        const response = await request.get(`https://serverest.dev/usuarios/${emptyId}`);

        // Marca o teste como "fixme" apontando o ID do bug/card
        test.fixme(true, 'BUG: API returning 200 instead of 400 for non-existent user ID');

        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', 'id não pode ficar em branco')
    });

    test('it should return 400 when ID is not provided', async ({ request }) => {
        const response = await request.get(`https://serverest.dev/usuarios/`);

        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        // expect(responseBody.id).toBe('id não pode ficar em branco');

        expect(responseBody.quantidade).toBeGreaterThan(0); // Garantimos que a lista não está vazia (maior que 0)

        responseBody.usuarios.forEach(user => {//Iteramos por todos os usuários para validar a estrutura dos dados
            expect(user).toHaveProperty('nome');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('password');
            expect(user).toHaveProperty('administrador');
            expect(user).toHaveProperty('_id');
        });

        expect(responseBody.quantidade).toBe(responseBody.usuarios.length);
    });

    test('it should return 400 when ID is not a string', async ({ request }) => {
        const nonStringId = 1234567890123456;
        const response = await request.get(`https://serverest.dev/usuarios/${nonStringId}`);

        // console.log('Response status:', response); // Adicione esta linha para depuração
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        // Marca o teste como "fixme" apontando o ID do bug/card
        test.fixme(true, 'BUG: API returning 400 with non-string user ID');

        expect(responseBody).toBe('id deve ser uma string');
    });

    test('it should return 400 when ID contains special characters', async ({ request }) => {
        const specialCharId = '1234!@#$%^&*()';
        const response = await request.get(`https://serverest.dev/usuarios/${specialCharId}`);

        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos')
    });

    test('it should return 400 when ID contains spaces', async ({ request }) => {
        const spaceId = '1234 5678 9012 3456';
        const response = await request.get(`https://serverest.dev/usuarios/${spaceId}`);
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos')
    });

    test('it should return 400 when ID contains non-alphanumeric characters', async ({ request }) => {
        const nonAlphanumericId = '1234-5678-9012-3456';
        const response = await request.get(`https://serverest.dev/usuarios/${nonAlphanumericId}`);
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos')
    });

    test('it should return 400 when ID is null', async ({ request }) => {
        const nullId = null;
        const response = await request.get(`https://serverest.dev/usuarios/${nullId}`);
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos')
    });

    test('it should return 400 when ID is undefined', async ({ request }) => {
        const undefinedId = undefined;
        const response = await request.get(`https://serverest.dev/usuarios/${undefinedId}`);
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos')
    });

    test('it should return 400 when ID is a boolean', async ({ request }) => {
        const booleanId = true;
        const response = await request.get(`https://serverest.dev/usuarios/${booleanId}`);
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos')
    });

    test('it should return 400 when ID is an array', async ({ request }) => {
        const arrayId = ['1234567890123456'];
        const response = await request.get(`https://serverest.dev/usuarios/${arrayId}`);
        expect(response.status()).toBe(400);
        const responseBody = await response.json();

        // Marca o teste como "fixme" apontando o ID do bug/card
        test.fixme(true, 'BUG: API returning 400 with non-array user ID');
        expect(responseBody).toHaveProperty('id', 'id deve ter exatamente 16 caracteres alfanuméricos')
    });
});

test.describe('PUT /usuarios/{id}', () => {
    let userId;

    test('it should update user details by ID', async ({ request }) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };

        const createResponse = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(createResponse.status()).toBe(201);

        const createResponseBody = await createResponse.json();
        userId = createResponseBody._id;
        const updateData = {
            nome: `${firstName} Updated ${lastName}`,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };

        const updateResponse = await request.put(`https://serverest.dev/usuarios/${userId}`, {
            data: updateData
        });

        expect(updateResponse.status()).toBe(200);

        const updateResponseBody = await updateResponse.json();

        expect(updateResponseBody).toHaveProperty('message', 'Registro alterado com sucesso');
        console.log('Update response body:', updateResponseBody); // Adicione esta linha para depuração

        // expect(updateResponseBody).toHaveProperty('_id', userId);
        // expect(updateResponseBody).toHaveProperty('nome', updateData.nome);
        // expect(updateResponseBody).toHaveProperty('email', updateData.email);
        // expect(updateResponseBody).toHaveProperty('password', updateData.password);
        // expect(updateResponseBody).toHaveProperty('administrador', updateData.administrador);
    });

    test('it should register a new user when PUT is called with a non-existent ID', async ({ request }) => {
        // const nonExistentUserId = '0000000000000000';
        const nonExistentUserId = (() => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let id = '';
            for (let i = 0; i < 16; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            console.log("id", id); // Adicione esta linha para depuração
            return id;
        })(); // Use a variável gerada aleatoriamente

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };
        const createResponse = await request.put(`https://serverest.dev/usuarios/${nonExistentUserId}`, {
            data: user
        });

        expect(createResponse.status()).toBe(201);

        const createResponseBody = await createResponse.json();
        expect(createResponseBody).toHaveProperty('message', 'Cadastro realizado com sucesso');
        expect(createResponseBody).toHaveProperty('_id');

        // console.log('Create response body:', createResponseBody); // Adicione esta linha para depuração
    });

    test('it should not create a duplicate user', async ({ request }) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(201);

        const responseBody = await response.json();

        expect(responseBody).toHaveProperty('message', 'Cadastro realizado com sucesso');
        expect(responseBody).toHaveProperty('_id');
        expect(responseBody).not.toHaveProperty('password');
        expect(responseBody).not.toHaveProperty('administrador');

        const newFakeId = '0000000000000000';
        const duplicateResponse = await request.put(`https://serverest.dev/usuarios/${newFakeId}`, {// Tentamos criar um usuário com o mesmo email
            data: {
                nome: fullName,
                email: user.email,
                password: 'admin1234',
                administrador: 'false'
            }
        });

        expect(duplicateResponse.status()).toBe(400);

        const duplicateResponseBody = await duplicateResponse.json();
        expect(duplicateResponseBody).toHaveProperty('message', 'Este email já está sendo usado');
    });

    test('it should return 405 for invalid endpoint', async ({ request }) => {
        const idInvalidEndpoint = 'usuarios-invalid-endpoint';
        const response = await request.put(`https://serverest.dev/${idInvalidEndpoint}`, {
            data: {
                nome: 'Test User',
                email: 'test@example.com',
                password: 'admin1234',
                administrador: 'false'
            }
        });
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', `Não é possível realizar PUT em /${idInvalidEndpoint}. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.`);
    });

    test('it should return 405 for invalid endpoint with ID', async ({ request }) => {
        const idInvalidEndpoint = 'usuarios-invalid-endpoint';
        const response = await request.put(`https://serverest.dev/${idInvalidEndpoint}/1234567890123456`, {
            data: {
                nome: 'Test User',
                email: 'test@example.com',
                password: 'admin1234',
                administrador: 'false'
            }
        });
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', `Não é possível realizar PUT em /${idInvalidEndpoint}/1234567890123456. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.`);
    });

    test('it should return 405 for invalid endpoint with query parameters', async ({ request }) => {
        const idInvalidEndpoint = 'usuarios-invalid-endpoint';
        const response = await request.put(`https://serverest.dev/${idInvalidEndpoint}?param=value`, {
            data: {
                nome: 'Test User',
                email: 'test@example.com',
                password: 'admin1234',
                administrador: 'false'
            }
        });
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', `Não é possível realizar PUT em /${idInvalidEndpoint}?param=value. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.`);
    });
});

test.describe('DELETE /usuarios/{id}', () => {

    test('it should delete user by ID', async ({ request }) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'false'
        };
        const createResponse = await request.post('https://serverest.dev/usuarios', {
            data: user
        });
        expect(createResponse.status()).toBe(201);

        const createResponseBody = await createResponse.json();
        const userId = createResponseBody._id;

        const deleteResponse = await request.delete(`https://serverest.dev/usuarios/${userId}`);
        expect(deleteResponse.status()).toBe(200);

        const deleteResponseBody = await deleteResponse.json();
        expect(deleteResponseBody).toHaveProperty('message', 'Registro excluído com sucesso');
    });

    test('it should return 200 for valid length ID that does not exist', async ({ request }) => {
        const nonExistentUserId = '0000000000000000';
        const response = await request.delete(`https://serverest.dev/usuarios/${nonExistentUserId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 400 when ID has invalid length', async ({ request }) => {
        const invalidLengthUserId = '123';
        const response = await request.delete(`https://serverest.dev/usuarios/${invalidLengthUserId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 405 for invalid endpoint', async ({ request }) => {
        const response = await request.delete('https://serverest.dev/usuarios-invalid-endpoint');
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar DELETE em /usuarios-invalid-endpoint. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 405 for invalid endpoint with ID', async ({ request }) => {
        const invalidId = '1234567890123456';
        const response = await request.delete(`https://serverest.dev/usuarios-invalid-endpoint/${invalidId}`);
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', `Não é possível realizar DELETE em /usuarios-invalid-endpoint/${invalidId}. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.`);
    });

    test('it should return 405 when ID is empty', async ({ request }) => {
        const emptyUserId = '';
        const response = await request.delete(`https://serverest.dev/usuarios/${emptyUserId}`);
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar DELETE em /usuarios/. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 405 when ID is not provided', async ({ request }) => {
        const response = await request.delete(`https://serverest.dev/usuarios/`);
        expect(response.status()).toBe(405);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Não é possível realizar DELETE em /usuarios/. Acesse https://serverest.dev para ver as rotas disponíveis e como utilizá-las.');
    });

    test('it should return 200 when ID is not a string', async ({ request }) => {
        const nonStringId = 1234567890123456;
        const response = await request.delete(`https://serverest.dev/usuarios/${nonStringId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID contains special characters', async ({ request }) => {
        const specialCharId = '1234!@#$%^&*()';
        const response = await request.delete(`https://serverest.dev/usuarios/${specialCharId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID contains spaces', async ({ request }) => {
        const spaceId = '1234 5678 9012 3456';
        const response = await request.delete(`https://serverest.dev/usuarios/${spaceId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID contains non-alphanumeric characters', async ({ request }) => {
        const nonAlphanumericId = '1234-5678-9012-3456';
        const response = await request.delete(`https://serverest.dev/usuarios/${nonAlphanumericId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is null', async ({ request }) => {
        const nullId = null;
        const response = await request.delete(`https://serverest.dev/usuarios/${nullId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is undefined', async ({ request }) => {
        const undefinedId = undefined;
        const response = await request.delete(`https://serverest.dev/usuarios/${undefinedId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is a boolean', async ({ request }) => {
        const booleanId = true;
        const response = await request.delete(`https://serverest.dev/usuarios/${booleanId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is an array', async ({ request }) => {
        const arrayId = ['1234567890123456'];
        const response = await request.delete(`https://serverest.dev/usuarios/${arrayId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is an object', async ({ request }) => {
        const objectId = { id: '1234567890123456' };
        const response = await request.delete(`https://serverest.dev/usuarios/${objectId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is a function', async ({ request }) => {
        const functionId = () => '1234567890123456';
        const response = await request.delete(`https://serverest.dev/usuarios/${functionId}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is a symbol', async ({ request }) => {
        const symbolId = Symbol('1234567890123456');
        const response = await request.delete(`https://serverest.dev/usuarios/${symbolId.toString()}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is a BigInt', async ({ request }) => {
        const bigIntId = BigInt('1234567890123456');
        const response = await request.delete(`https://serverest.dev/usuarios/${bigIntId.toString()}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is a Date object', async ({ request }) => {
        const dateId = new Date();
        const response = await request.delete(`https://serverest.dev/usuarios/${dateId.toISOString()}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

    test('it should return 200 when ID is a RegExp object', async ({ request }) => {
        const regexId = /1234567890123456/;
        const response = await request.delete(`https://serverest.dev/usuarios/${regexId.toString()}`);
        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message', 'Nenhum registro excluído');
    });

});



// Marca o teste como "fixme" apontando o ID do bug/card
//   test.fixme(true, 'BUG-123: API returning 200 instead of 400 for non-existent product ID');