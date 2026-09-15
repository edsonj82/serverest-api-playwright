import { faker } from '@faker-js/faker'

export const getUser = () => {
    // 1. Dados do usuário Administrador
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const password = faker.internet.password();

    return {
        nome: fullName,
        email: email,
        password: password,
        administrador: 'true' // Obrigatório ser string 'true' no ServeRest
    }
}