import { readData } from "../utils/databaseManager.js";

export default async function userController(req, res) {
    const id = req?.params?.id || req?.query?.id_usuario || req?.query?.id || req?.body?.id_usuario || req?.body?.id;
    if (!id) return res.status(400).json({ message: 'User ID is required' });
    
    const user = await readData('usuarios');
    const userFound = user.find(user => user.id_usuario === id);
    if (!userFound) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ message: 'User found', data: { name: userFound.nome, email: userFound.email, role: userFound.tipo_usuario } });
}