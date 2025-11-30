import { readData } from '../utils/databaseManager.js';

export default async function roundReports(req, res) {
    const id_usuario = req.params.id || req.query.id_usuario || req.query.id || req.body.id_usuario || req.body.id;

    if(!id_usuario){
        return res.status(400).json({ message: 'id_usuario is required' });
    }

    const estudanteGrupo = await readData('estudante_grupo').then(groups => id_usuario ? groups.filter(g => g.id_usuario === id_usuario) : groups).then(data => data.map(g => g.id_grupo));

    if(estudanteGrupo.length === 0){
        return res.status(404).json({ message: 'No groups found for this student' });
    }

    const resultados = await readData('resultado').then(results => results.filter(r => estudanteGrupo.includes(r.id_grupo))).then(data => data.map(j => j.id_jogo));

    if(resultados.length === 0){
        return res.status(404).json({ message: 'No results found for this student groups' });
    }

    const cenarios_rodada = await readData('rodada').then(rodadas => rodadas.filter(r => resultados.includes(r.id_jogo) && r.status === "EM ANDAMENTO")).then(data => data.map(r => r.id_cenario));

    if(cenarios_rodada.length === 0){
        return res.status(404).json({ message: 'No rounds found for this student groups results' });
    }

    const noticias_id = await readData('area_cenario').then(areas => areas.filter(a => cenarios_rodada.includes(a.id_cenario) && a.nome_area === "Noticias")).then(data => data.map(a => a.id_area_cenario));
    if(noticias_id.length === 0){
        return res.status(404).json({ message: 'No news area found for this student groups rounds' });
    }

    const noticias = await readData('condicoes_area_cenario').then(condicoes => condicoes.filter(c => noticias_id.includes(c.id_area_cenario)));

    if(noticias.length === 0){  
        return res.status(404).json({ message: 'No news found for this student groups rounds' });
    }

    return res.status(200).json({message: 'News found', noticias: noticias.map(n => n.valor)});
}