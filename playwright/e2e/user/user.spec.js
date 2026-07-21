// @ts-check
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

//User API tests
test.describe('POST /usuarios', () => {
    let userId;// 1. Declaramos a variável vazia no escopo do describe

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

        userId = responseBody._id;// 2. Guardamos o valor do _id retornado na nossa variável de escopo
        // 3. No próximo teste, a variável "userId" estará preenchida e pronta para uso!
        // Garantimos que o teste anterior rodou e o ID foi salvo antes de continuar
        //expect(userId).toBeDefined();

        // Fazemos um GET passando o ID dinamicamente na URL
        //const response = await request.get(`https://serverest.dev/usuarios/${userId}`);
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

        // const user = [
        //   nome: 'Fulano da Silva',
        //   email: 'beltrano@qa.com.br',
        //   password: 'admin1234',
        //   administrador: 'true',
        //   _id: '1AmGIy7FkEaltWdO'
        // ]

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.quantidade).toBeGreaterThan(0);
        // expect(body.usuarios).toContainEqual(user);
        expect(body.usuarios[0]).toHaveProperty('nome');
        expect(body.usuarios[0]).toHaveProperty('email');
        expect(body.usuarios[0]).toHaveProperty('password');
        expect(body.usuarios[0]).toHaveProperty('administrador');
        expect(body.usuarios[0]).toHaveProperty('_id');

    });
});


