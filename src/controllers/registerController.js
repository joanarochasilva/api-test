import bcrypt from 'bcryptjs';
import { readData, writeData } from '../utils/databaseManager.js';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '../utils/jwtManager.js';

export default async function registerController(req, res) {

    const SALT_ROUNDS = 10;
    const { name, email, password, user_type, user_status } = req.body;

    if(!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });

    // db.json uses the "usuarios" collection
    const users = await readData('usuarios');
    const emailExists = users.find(user => user.email === email);
    if(emailExists) return res.status(409).json({ message: 'Email already registered' });


    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = { 
        id_usuario: uuidv4(),
        nome: name,
        email,
        senha: hashedPassword,
        tipo_usuario: user_type !== undefined ? user_type : 'ESTUDANTE', // default role
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        ativo: user_status !== undefined ? user_status : 'PENDING' // default aguardando
    };

    const token = generateToken({ id: newUser.id_usuario, email: newUser.email, role: newUser.tipo_usuario });
    await writeData('usuarios', newUser);

    return res.status(201).json({ user: { id: newUser.id_usuario, role: newUser.tipo_usuario, token }, message: 'User registered successfully' });
}