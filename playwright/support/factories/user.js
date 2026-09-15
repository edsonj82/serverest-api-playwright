import { faker } from '@faker-js/faker'

export const getUserAdmin = () => {
    // 1. Dados do usuário Administrador
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;//const fullName = faker.person.firstName() + ' ' + faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();//email: faker.internet.email({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ')[1] }),
    const password = faker.internet.password();

    return {
        nome: fullName,
        email: email,
        password: password,
        administrador: 'true' // Obrigatório ser string 'true' no ServeRest
    }
}