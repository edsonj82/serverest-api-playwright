// @ts-check
import { test, expect } from '@playwright/test';

//User API tests
test.describe('POST /usuarios', () => {

    test('it should create a new user', async ({ request }) => {

        const user = {
            nome: 'Fulano da Silva',
            email: 'fulano@qa.com.br',
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


