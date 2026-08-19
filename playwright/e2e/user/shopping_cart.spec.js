import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { exitCode } from 'node:process';

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

    // TODO: Adicionar teste para criar carrinho com múltiplos produtos
    test('it should create a shopping cart with multiple products successfully', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    },
                    {
                        idProduto: "YaeJ455lz3k6kSIzA", // Gerando um ID de produto fictício para simular múltiplos produtos
                        quantidade: 3
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

    test('it should return an error when creating a duplicate shopping cart', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId, // Substitua pelo ID do produto criado dinamicamente
                        quantidade: 1
                    }, {
                        idProduto: productId, // Substitua pelo ID do produto criado dinamicamente
                        quantidade: 3
                    }
                ]
            },
            headers: {
                Authorization: authorization
            }
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('message');
        expect(responseData.message).toBe('Não é permitido possuir produto duplicado');
    });

    test('it should validate the quantity of products in the shopping cart', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId, // Substitua pelo ID do produto criado dinamicamente
                        quantidade: 0,
                    }
                ]
            },
            headers: {
                Authorization: authorization
            }
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('produtos');

        expect(responseData.produtos).toBe('produtos não contém 1 valor obrigatório');
        console.log('Response data:', responseData);
    });

    test('it should return an error when creating more than one shopping cart for the same user', async ({ request }) => {
        // Primeiro, cria um carrinho para o usuário
        const firstCartResponse = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                Authorization: authorization
            }
        });
        expect(firstCartResponse.ok()).toBeTruthy();

        // Agora, tenta criar outro carrinho para o mesmo usuário
        const secondCartResponse = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                Authorization: authorization
            }
        });
        expect(secondCartResponse.ok()).toBeFalsy();
        expect(secondCartResponse.status()).toBe(400);

        const responseData = await secondCartResponse.json();
        expect(responseData).toHaveProperty('message');
        expect(responseData.message).toBe('Não é permitido ter mais de 1 carrinho');
    });

    test('it should return an error when creating a shopping cart with an invalid product ID', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: 'invalid-product-id',
                        quantidade: 1
                    }
                ]
            },
            headers: {
                Authorization: authorization
            }
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('message');
        expect(responseData.message).toBe('Produto não encontrado');
    })

    test('it should return an error when a shopping cart can not have suficient quantity of products', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1000 // Quantidade maior que a disponível
                    }
                ]
            },
            headers: {
                Authorization: authorization
            }
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('message');
        expect(responseData.message).toBe('Produto não possui quantidade suficiente');
    });

    test('it should return an error when creating a shopping cart without authorization', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            }
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(401);

        console.log('Response body:', await response.json());
        // expect(responseData).toHaveProperty('message');
        expect(response.message).toBe('Token de acesso ausente, inválido, expirado ou usuário do token não existe mais');
    });

    test('it should return an error when creating a shopping cart with an invalid authorization token', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                Authorization: 'invalid-token'
            }
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(401);

        const responseData = await response.json();
        // expect(responseData).toHaveProperty('message');
        expect(responseData.message).toBe('Token de acesso ausente, inválido, expirado ou usuário do token não existe mais');
    });
});
