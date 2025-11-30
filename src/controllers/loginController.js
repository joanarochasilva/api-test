import bcrypt from 'bcryptjs';
import { readData } from "../utils/databaseManager.js";
import { generateToken } from "../utils/jwtManager.js";


export default async function loginController(req, res) {

    const { email, password } = req.body;

    if(!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const users = await readData('usuarios');
    const user = users.find(user => user.email === email);
    if(!user) return res.status(404).json('usuario nao encontrado');
    
    const isPasswordValid = await bcrypt.compare(password, user.senha);
    if(!isPasswordValid) return res.status(401).json('acesso negado');

    const token = generateToken({ id: user.id_usuario, email: user.email, role: user.tipo_usuario });

    if(!token) return res.status(500).json('erro no servidor');
    const loggedInUser = {
            id_usuario: user.id_usuario,
            role: user.tipo_usuario,
            token
    };

    return res.status(200).json({ message: 'User logged in successfully', data: loggedInUser });
}