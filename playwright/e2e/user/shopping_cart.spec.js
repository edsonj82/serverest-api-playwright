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

    test('it should return an error when creating a shopping cart with an expired authorization token', async ({ request }) => {
        // Simulando um token expirado (substitua pelo seu token real expirado)
        const expiredToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YjQ3YjE2YzM4ZDAwMDAxIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImFkbWluaXN0cmFkb3IiOnRydWUsImlhdCI6MTY5NzQyMDgwMCwiZXhwIjoxNjk3NDIwODAwfQ.invalidsignature';

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
                Authorization: expiredToken
            }
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(401);

        const responseData = await response.json();
        // expect(responseData).toHaveProperty('message');
        expect(responseData.message).toBe('Token de acesso ausente, inválido, expirado ou usuário do token não existe mais');
    });

    test('it should return an error when creating a shopping cart with an empty product list', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: []
            },
            headers: {
                Authorization: authorization
            }
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);

        console.log('Response body:', await response.json());

        const responseData = await response.json();
        // expect(responseData['produtos[0].idProduto']).toBe('produtos[0].idProduto é obrigatório');
        expect(responseData.produtos).toBe('produtos não contém 1 valor obrigatório');
    });

    test('it should return an error when creating a shopping cart with a missing product ID', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
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

        console.log('Response body:', await response.json());

        const responseData = await response.json();
        expect(responseData['produtos[0].idProduto']).toBe('produtos[0].idProduto é obrigatório');
    });

    test('it should return an error when creating a shopping cart with a missing product quantity', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: '1'
                    }
                ]
            },
            headers: {
                Authorization: authorization
            }
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);

        console.log('Response body:', await response.json());

        const responseData = await response.json();
        expect(responseData['produtos[0].quantidade']).toBe('produtos[0].quantidade é obrigatório');
    });

    test('it should return an error when creating a shopping cart with a negative product quantity', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: '1',
                        quantidade: -1
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
        console.log('Response body:', responseData);
        expect(responseData['produtos[0].quantidade']).toBe('produtos[0].quantidade deve ser um número positivo');
    });

    test('it should return an error when creating a shopping cart with a non-integer product quantity', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: '1',
                        quantidade: 1.5
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
        console.log('Response body:', responseData);
        expect(responseData['produtos[0].quantidade']).toBe('produtos[0].quantidade deve ser um inteiro');
    });

    test('it should return an error when creating a shopping cart with a non-numeric product quantity', async ({ request }) => {
        const response = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: '1',
                        quantidade: 'abc'
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
        console.log('Response body:', responseData);
        expect(responseData['produtos[0].quantidade']).toBe('produtos[0].quantidade deve ser um número');
    });
});

test.describe('GET /carrinhos', () => {
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
        // console.log(productResponseData);

        productId = productResponseData._id; // Armazena o ID do produto criado
        expect(productResponse.status()).toBe(201);
    });

    test('it should retrieve the shopping cart successfully', async ({ request }) => {
        // 1. Cria o carrinho
        const createCartResponse = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(createCartResponse.ok()).toBeTruthy();

        // 2. Busca os carrinhos
        const getCartResponse = await request.get('https://serverest.dev/carrinhos', {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(getCartResponse.ok()).toBeTruthy();
        expect(getCartResponse.status()).toBe(200);

        const responseData = await getCartResponse.json();

        // console.log('Response data:', responseData.carrinhos[0]);
        expect(responseData).toHaveProperty('carrinhos');
        expect(responseData.carrinhos[0]).toHaveProperty('produtos');
        expect(responseData.carrinhos[0].produtos[0]).toHaveProperty('idProduto');
        expect(responseData.carrinhos[0].produtos[0]).toHaveProperty('quantidade');
        expect(responseData.carrinhos[0].produtos[0]).toHaveProperty('precoUnitario');
        expect(responseData.carrinhos[0]).toHaveProperty('precoTotal');
        expect(responseData.carrinhos[0]).toHaveProperty('quantidadeTotal');
        expect(responseData.carrinhos[0]).toHaveProperty('idUsuario');
        expect(responseData.carrinhos[0]).toHaveProperty('_id');


        expect(Array.isArray(responseData.carrinhos[0].produtos)).toBe(true);
        expect(responseData.carrinhos[0].produtos.length).toBeGreaterThan(0);

        // 3. Procura o produto em QUALQUER carrinho retornado na lista
        let productInCart;
        for (const carrinho of responseData.carrinhos) {
            productInCart = carrinho.produtos.find(p => p.idProduto === productId);
            if (productInCart) break; // Sai do loop se encontrar o produto
        }

        expect(productInCart).toBeDefined();
        expect(productInCart.quantidade).toBe(1);

    });

    test('it should return all shopping carts for the user', async ({ request }) => {
        // 1. Cria o carrinho
        const createCartResponse = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(createCartResponse.ok()).toBeTruthy();

        // 2. Busca os carrinhos
        const getCartResponse = await request.get('https://serverest.dev/carrinhos', {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(getCartResponse.ok()).toBeTruthy();
        expect(getCartResponse.status()).toBe(200);

        const responseData = await getCartResponse.json();

        // console.log('Response data:', responseData.carrinhos[0]);
        expect(responseData).toHaveProperty('carrinhos');
        expect(responseData.carrinhos[0]).toHaveProperty('produtos');
        expect(responseData.carrinhos[0].produtos[0]).toHaveProperty('idProduto');
        expect(responseData.carrinhos[0].produtos[0]).toHaveProperty('quantidade');
        expect(responseData.carrinhos[0].produtos[0]).toHaveProperty('precoUnitario');
        expect(responseData.carrinhos[0]).toHaveProperty('precoTotal');
        expect(responseData.carrinhos[0]).toHaveProperty('quantidadeTotal');
        expect(responseData.carrinhos[0]).toHaveProperty('idUsuario');
        expect(responseData.carrinhos[0]).toHaveProperty('_id');
    });

    test('it should return all shopping carts when retrieving without authorization', async ({ request }) => {
        const response = await request.get('https://serverest.dev/carrinhos', {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(responseData).toHaveProperty('carrinhos');
        expect(responseData.carrinhos[0]).toHaveProperty('produtos');
        expect(responseData.carrinhos[0].produtos[0]).toHaveProperty('idProduto');
        expect(responseData.carrinhos[0].produtos[0]).toHaveProperty('quantidade');
        expect(responseData.carrinhos[0].produtos[0]).toHaveProperty('precoUnitario');
        expect(responseData.carrinhos[0]).toHaveProperty('precoTotal');
        expect(responseData.carrinhos[0]).toHaveProperty('quantidadeTotal');
        expect(responseData.carrinhos[0]).toHaveProperty('idUsuario');
        expect(responseData.carrinhos[0]).toHaveProperty('_id');
    });

    test('it should return the shopping cart for a specific _id', async ({ request }) => {
        // 1. Cria o carrinho
        const createCartResponse = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(createCartResponse.ok()).toBeTruthy();

        const createCartData = await createCartResponse.json();
        const cartId = createCartData._id;

        // 2. Busca o carrinho específico pelo _id
        const getCartResponse = await request.get(`https://serverest.dev/carrinhos/${cartId}`, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(getCartResponse.ok()).toBeTruthy();

        const getCartData = await getCartResponse.json();
        console.log('Response data:', getCartData);

        expect(getCartData._id).toBe(cartId);
        expect(getCartData.produtos[0].idProduto).toBe(productId);
        expect(getCartData.produtos[0].quantidade).toBe(1);

        expect(getCartData).toHaveProperty('produtos');
        expect(getCartData.produtos[0]).toHaveProperty('idProduto');
        expect(getCartData.produtos[0]).toHaveProperty('quantidade');
        expect(getCartData.produtos[0]).toHaveProperty('precoUnitario');
        expect(getCartData).toHaveProperty('precoTotal');
        expect(getCartData).toHaveProperty('quantidadeTotal');
        expect(getCartData).toHaveProperty('idUsuario');
        expect(getCartData).toHaveProperty('_id');
    });

    test('it should return the shopping cart for a specific precoTotal', async ({ request }) => {

        // 1. Cria o carrinho
        const createCartResponse = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(createCartResponse.ok()).toBeTruthy();

        const createCartData = await createCartResponse.json();
        const cartId = createCartData._id;

        // 2. Busca o carrinho específico pelo _id
        const getCartResponse = await request.get(`https://serverest.dev/carrinhos/${cartId}`, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(getCartResponse.ok()).toBeTruthy();
        expect(getCartResponse.status()).toBe(200);

        const getCartData = await getCartResponse.json();

        const precoTotal = getCartData.precoTotal; // Armazena o precoTotal do carrinho criado
        console.log('precoTotal:', precoTotal);

        // 3. Busca o carrinho específico pelo precoTotal
        const getCartByPrecoTotalResponse = await request.get(`https://serverest.dev/carrinhos?precoTotal=${precoTotal}`, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });

        expect(getCartByPrecoTotalResponse.ok()).toBeTruthy();
        expect(getCartByPrecoTotalResponse.status()).toBe(200);

        const getCartByPrecoTotalData = await getCartByPrecoTotalResponse.json();
        console.log('Response data for precoTotal:', getCartByPrecoTotalData);

        expect(getCartData.precoTotal).toBe(getCartByPrecoTotalData.carrinhos[0].precoTotal);

        expect(getCartByPrecoTotalData).toHaveProperty('carrinhos');
        expect(getCartByPrecoTotalData.carrinhos[0]).toHaveProperty('produtos');
        expect(getCartByPrecoTotalData.carrinhos[0].produtos[0]).toHaveProperty('idProduto');
        expect(getCartByPrecoTotalData.carrinhos[0].produtos[0]).toHaveProperty('quantidade');
        expect(getCartByPrecoTotalData.carrinhos[0].produtos[0]).toHaveProperty('precoUnitario');
        expect(getCartByPrecoTotalData.carrinhos[0]).toHaveProperty('precoTotal');
        expect(getCartByPrecoTotalData.carrinhos[0]).toHaveProperty('quantidadeTotal');
        expect(getCartByPrecoTotalData.carrinhos[0]).toHaveProperty('idUsuario');
        expect(getCartByPrecoTotalData.carrinhos[0]).toHaveProperty('_id');

    });

    test('it should return the shopping cart for a specific quantidadeTotal', async ({ request }) => {

        // 1. Cria o carrinho
        const createCartResponse = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }

        });
        expect(createCartResponse.ok()).toBeTruthy();

        const createCartData = await createCartResponse.json();
        const cartId = createCartData._id;

        // 2. Busca o carrinho específico pelo _id
        const getCartResponse = await request.get(`https://serverest.dev/carrinhos/${cartId}`, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
        expect(getCartResponse.ok()).toBeTruthy();
        expect(getCartResponse.status()).toBe(200);

        const getCartData = await getCartResponse.json();
        const quantidadeTotal = getCartData.quantidadeTotal;
        console.log('quantidadeTotal:', quantidadeTotal);

        // 3. Busca o carrinho específico pelo quantidadeTotal
        const getCartByQuantidadeTotalResponse = await request.get(`https://serverest.dev/carrinhos?quantidadeTotal=${quantidadeTotal}`, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
        expect(getCartByQuantidadeTotalResponse.ok()).toBeTruthy();
        expect(getCartByQuantidadeTotalResponse.status()).toBe(200);

        const getCartByQuantidadeTotalData = await getCartByQuantidadeTotalResponse.json();
        console.log('Response data for quantidadeTotal:', getCartByQuantidadeTotalData);

        expect(getCartData.quantidadeTotal).toBe(getCartByQuantidadeTotalData.carrinhos[0].quantidadeTotal);

        expect(getCartByQuantidadeTotalData).toHaveProperty('carrinhos');
        expect(getCartByQuantidadeTotalData.carrinhos[0]).toHaveProperty('produtos');
        expect(getCartByQuantidadeTotalData.carrinhos[0].produtos[0]).toHaveProperty('idProduto');
        expect(getCartByQuantidadeTotalData.carrinhos[0].produtos[0]).toHaveProperty('quantidade');
        expect(getCartByQuantidadeTotalData.carrinhos[0].produtos[0]).toHaveProperty('precoUnitario');
        expect(getCartByQuantidadeTotalData.carrinhos[0]).toHaveProperty('precoTotal');
        expect(getCartByQuantidadeTotalData.carrinhos[0]).toHaveProperty('quantidadeTotal');
        expect(getCartByQuantidadeTotalData.carrinhos[0]).toHaveProperty('idUsuario');
        expect(getCartByQuantidadeTotalData.carrinhos[0]).toHaveProperty('_id');
    });

    test('it should return the shopping cart for a specific idUsuario', async ({ request }) => {
        // 1. Cria o carrinho
        const createCartResponse = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }

        });
        expect(createCartResponse.ok()).toBeTruthy();

        const createCartData = await createCartResponse.json();
        const cartId = createCartData._id;

        // 2. Busca o carrinho específico pelo _id
        const getCartResponse = await request.get(`https://serverest.dev/carrinhos/${cartId}`, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
        expect(getCartResponse.ok()).toBeTruthy();
        expect(getCartResponse.status()).toBe(200);

        const getCartData = await getCartResponse.json();
        const idUsuario = getCartData.idUsuario;
        console.log('idUsuario:', idUsuario);

        // 3. Busca o carrinho específico pelo idUsuario
        const getCartByIdUsuarioResponse = await request.get(`https://serverest.dev/carrinhos?idUsuario=${idUsuario}`, {
            headers: {
                'Content-Type': 'application/json',
                'authorization': authorization
            }
        });
        expect(getCartByIdUsuarioResponse.ok()).toBeTruthy();
        expect(getCartByIdUsuarioResponse.status()).toBe(200);

        const getCartByIdUsuarioData = await getCartByIdUsuarioResponse.json();
        console.log('Response data for idUsuario:', getCartByIdUsuarioData);

        expect(getCartData.idUsuario).toBe(getCartByIdUsuarioData.carrinhos[0].idUsuario);

        expect(getCartByIdUsuarioData).toHaveProperty('carrinhos');
        expect(getCartByIdUsuarioData.carrinhos[0]).toHaveProperty('produtos');
        expect(getCartByIdUsuarioData.carrinhos[0].produtos[0]).toHaveProperty('idProduto');
        expect(getCartByIdUsuarioData.carrinhos[0].produtos[0]).toHaveProperty('quantidade');
        expect(getCartByIdUsuarioData.carrinhos[0].produtos[0]).toHaveProperty('precoUnitario');
        expect(getCartByIdUsuarioData.carrinhos[0]).toHaveProperty('precoTotal');
        expect(getCartByIdUsuarioData.carrinhos[0]).toHaveProperty('quantidadeTotal');
        expect(getCartByIdUsuarioData.carrinhos[0]).toHaveProperty('idUsuario');
        expect(getCartByIdUsuarioData.carrinhos[0]).toHaveProperty('_id');
    });
});

test.describe('GET /carrinhos/:id', () => {
    let authorization, productId, cartId;

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
        authorization = loginData.authorization;

        // 4. Criar um produto para adicionar ao carrinho
        const product = {
            nome: faker.commerce.productName(),
            preco: faker.number.int({ min: 10, max: 1000 }),
            descricao: faker.commerce.productDescription(),
            quantidade: faker.number.int({ min: 1, max: 10 })
        };

        const productResponse = await request.post('https://serverest.dev/produtos', {
            data: product,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization
            }
        });

        // console.log('Product creation response:', await productResponse.json());
        expect(productResponse.ok()).toBeTruthy();
        const productData = await productResponse.json();
        productId = productData._id;

        // 5. Criar um carrinho para o usuário
        const createCartResponse = await request.post('https://serverest.dev/carrinhos', {
            data: {
                produtos: [
                    {
                        idProduto: productId,
                        quantidade: 1
                    }
                ]
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization
            }
        });
        expect(createCartResponse.ok()).toBeTruthy();
        const createCartData = await createCartResponse.json();
        cartId = createCartData._id;
    });

    test('it should return a shopping cart by its ID', async ({ request }) => {
        const response = await request.get(`https://serverest.dev/carrinhos/${cartId}`, {
            headers: {
                'Authorization': authorization
            }
        });
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const responseData = await response.json();
        console.log('Response data:', responseData);

        expect(Array.isArray(responseData.produtos)).toBe(true);

        expect(responseData).toHaveProperty('produtos');
        expect(responseData.produtos[0]).toHaveProperty('idProduto', productId);
        expect(responseData.produtos[0]).toHaveProperty('quantidade', 1);
        expect(responseData.produtos[0]).toHaveProperty('precoUnitario');
        expect(responseData).toHaveProperty('precoTotal');
        expect(responseData).toHaveProperty('quantidadeTotal');
        expect(responseData).toHaveProperty('idUsuario');
        expect(responseData).toHaveProperty('_id', cartId);

        expect(responseData.produtos[0].idProduto).toBe(productId);
        expect(responseData.produtos[0].quantidade).toBe(1);
        expect(responseData._id).toBe(cartId);
    });
});