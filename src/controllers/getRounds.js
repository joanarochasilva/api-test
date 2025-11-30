import { readData } from "../utils/databaseManager.js";

export default async function getRounds(req, res) {
    const id = req.params.id || req.query.id || req.body.id || req.params.id_usuario || req.query.id_usuario || req.body.id_usuario || null;
    
    if(!id) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    const estudante_grupo = await readData('estudante_grupo').then(data => data.find(item => item.id_usuario === id)).then(item => item ? item.id_grupo : null);

    if(!estudante_grupo) {
        return res.status(404).json({ error: 'Grupo do usuário não encontrado.' });
    }

    const jogo = await readData('grupo').then(data => data.find(item => estudante_grupo.includes(item.id_grupo))).then(item => item ? item.id_jogo : null);

    if(!jogo) {
        return res.status(404).json({ error: 'Jogo do grupo não encontrado.' });
    }

    const rounds = await readData('rodada').then(data => data.filter(item => item.id_jogo === jogo));

    if(!rounds || rounds.length === 0) {
        return res.status(404).json({ error: 'Rodadas do jogo não encontradas.' });
    }

    return res.status(200).json({ rodadas: rounds });
}