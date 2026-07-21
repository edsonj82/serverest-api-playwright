// @ts-check
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

//User API tests
test.describe('POST /usuarios', () => {

    let userId, nome, email, password, administrador;// 1. Declaramos a variável vazia no escopo do describe

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
            administrador: 'true'
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

    });

    test('it should show user details by ID', async ({ request }) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'true'
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

    test('it should not create a duplicate user', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            //email: faker.internet.email({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ')[1] }),
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'true'
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
                administrador: 'true'
            }
        });

        expect(duplicateResponse.status()).toBe(400);

        const duplicateResponseBody = await duplicateResponse.json();
        expect(duplicateResponseBody).toHaveProperty('message', 'Este email já está sendo usado');
    });

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

    test('name field should not be empty', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        // const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: "",
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'true'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();

        console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody.nome).toBe('nome não pode ficar em branco');
    });

    test('name field is required', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        // const fullName = `${firstName} ${lastName}`;

        const user = {
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password: 'admin1234',
            administrador: 'true'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();

        console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody.nome).toBe('nome é obrigatório');
    });

    test('email field should not be empty', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: "",
            password: 'admin1234',
            administrador: 'true'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();

        console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody.email).toBe('email não pode ficar em branco');
    });

    test('email field is required', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            // email: "",
            password: 'admin1234',
            administrador: 'true'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();

        console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody.email).toBe('email é obrigatório');
    });

    test('password field should not be empty', async ({ request }) => {

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;

        const user = {
            nome: fullName,
            email: "",
            password: "",
            administrador: 'true'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.status()).toBe(400);

        const responseBody = await response.json();

        console.log('Response body:', responseBody); // Adicione esta linha para depuração
        expect(responseBody.password).toBe('password não pode ficar em branco');
    });

});
