import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('User Login', () => {

    let email, password, authorization;

    test('should log in successfully with valid credentials', async ({ request }) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;
        email = faker.internet.email(firstName, lastName);
        password = faker.internet.password();

        const user = {
            nome: fullName,
            email: email,
            password: password,
            administrador: 'false'
        };

        const response = await request.post('https://serverest.dev/usuarios', {
            data: user
        });

        expect(response.ok()).toBeTruthy();

        email = user.email;
        password = user.password;

        const loginResponse = await request.post('https://serverest.dev/login', {
            data: {
                email: email,
                password: password
            }
        });

        expect(loginResponse.ok()).toBeTruthy();

        const loginData = await loginResponse.json();

        expect(loginData).toHaveProperty('authorization');
        authorization = loginData.authorization;
        expect(authorization).toBeTruthy();
        expect(loginData).toHaveProperty('message');
        expect(loginData.message).toBe('Login realizado com sucesso');
    });

    test('should fail to log in with invalid credentials', async ({ request }) => {
        const invalidEmail = faker.internet.email();
        const invalidPassword = faker.internet.password();

        const loginResponse = await request.post('https://serverest.dev/login', {
            data: {
                email: invalidEmail,
                password: invalidPassword
            }
        });

        expect(loginResponse.ok()).toBeFalsy();
        expect(loginResponse.status()).toBe(401);

        const loginData = await loginResponse.json();

        expect(loginData).toHaveProperty('message');
        expect(loginData.message).toBe('Email e/ou senha inválidos');
    });

    test('it should fail to log in with empty email', async ({ request }) => {
        const loginResponse = await request.post('https://serverest.dev/login', {
            data: {
                email: '',
                password: faker.internet.password()
            }
        });

        expect(loginResponse.ok()).toBeFalsy();
        expect(loginResponse.status()).toBe(400);

        const loginData = await loginResponse.json();

        expect(loginData).toHaveProperty('email');
        expect(loginData.email).toBe('email não pode ficar em branco');
    });

    test('it should fail to log in with empty password', async ({ request }) => {
        const loginResponse = await request.post('https://serverest.dev/login', {
            data: {
                email: faker.internet.email(),
                password: ''
            }
        });

        expect(loginResponse.ok()).toBeFalsy();
        expect(loginResponse.status()).toBe(400);

        const loginData = await loginResponse.json();

        expect(loginData).toHaveProperty('password');
        expect(loginData.password).toBe('password não pode ficar em branco');
    });

    test('it should fail to log in with empty email and password', async ({ request }) => {
        const loginResponse = await request.post('https://serverest.dev/login', {
            data: {
                email: '',
                password: ''
            }
        });

        expect(loginResponse.ok()).toBeFalsy();
        expect(loginResponse.status()).toBe(400);

        const loginData = await loginResponse.json();

        expect(loginData).toHaveProperty('email');
        expect(loginData.email).toBe('email não pode ficar em branco');
        expect(loginData).toHaveProperty('password');
        expect(loginData.password).toBe('password não pode ficar em branco');
    });
});