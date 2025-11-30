import { writeData } from "../utils/databaseManager";
import { readData } from "../utils/databaseManager";
import { v4 as uuidv4 } from 'uuid';

export default async function gameCreationController(req, res) {

    const { name, description, id_admin, id_professor } = req.body;

    if(!name || !description || !id_admin || !id_professor) {
        return res.status(400).json({ message: 'Name, description, id_admin, and id_professor are required' });
    }

    const user = await readData('usuarios');
    const adminExists = user.find(u => u.id_usuario === id_admin && u.tipo === 'ADMIN' && u.ativo !== 'DELETED');
    const professorExists = user.find(u => u.id_usuario === id_professor && u.tipo === 'PROFESSOR' && u.ativo !== 'DELETED');

    if(!adminExists) {
        return res.status(404).json({ message: 'Admin user not found' });
    }

    if(!professorExists) {
        return res.status(404).json({ message: 'Professor user not found' });
    }

    const newGame = {
        id_jogo: uuidv4(),
        id_admin: id_admin,
        id_professor: id_professor,
        nome: name, 
        descricao: description,
        status: "CREATED",
    };

    const jogos = readData('jogos');
    if(jogos.find(jogo => jogo.id_jogo === newGame.id_jogo)) {
        return res.status(409).json({ message: 'Game with this ID already exists' });
    }
    
    const result = await writeData('jogos',newGame);
    if(!result) {
        return res.status(500).json({ message: 'Error creating game' });
    }

    return res.status(201).json({ message: 'Game created successfully'});
}