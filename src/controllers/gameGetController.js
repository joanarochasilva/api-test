import { readData } from '../utils/databaseManager.js';
import getRanking from './getRanking.js';

export default async function gameGetController(req, res) {

    const id_usuario = req?.params?.id || req?.query?.id_usuario || req?.query.id || req.body.id_usuario || req.body.id;
    const role = req?.user?.role || req?.query?.role || req?.body?.role;

    console.log('Role:', role);

    if (!id_usuario) {
        return res.status(400).json({ message: 'id_usuario is required' });
    }

    if (!role) {
        return res.status(400).json({ message: 'User role is required' });
    }

    const user = await readData('usuarios');
    const userExists = user.find(u => u.id_usuario === id_usuario);

    if (!userExists) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (role === 'ADMINISTRADOR') {
        const jogosData = await readData('jogo');
        const jogos = jogosData.filter(jogo => jogo.id_usuario_adm === id_usuario);

        if (jogos.length === 0) {
            return res.status(404).json({ message: 'No games found for this admin user' });
        }

        const professoresData = await readData('professor_jogo');
        const alunos = await readData('estudante_grupo');
        const grupos = await readData('grupo');

        return res.status(200).json({ games: jogos, professores: professoresData, grupos: grupos, alunos: alunos, user: { name: userExists.nome } });


    } else if (role === 'PROFESSOR') {

        const jogosData = await readData('professor_jogo');
        const jogos = jogosData.filter(professor => professor.id_professor === id_usuario);
        if (jogos.length === 0) {
            return res.status(404).json({ message: 'No games found for this professor user' });
        }

        const jogosIds = jogos.map(j => j.id_jogo);
        console.log(jogosIds);
        const rodada = await readData('rodada');
        const jogosComRodada = rodada.filter(r => jogosIds.includes(r.id_jogo));

        console.log(jogosComRodada);

        return res.status(200).json({ games: jogos, rodada: jogosComRodada, user: { name: userExists.nome } });
    } else if (role === 'ALUNO') {
        const estudanteGrupo = await readData('estudante_grupo').then(groups => id_usuario ? groups.filter(g => g.id_usuario === id_usuario) : groups);
        const studentGroupIds = estudanteGrupo.map(g => g.id_grupo);
        const results = await readData('resultado').then(results => results.filter(r => studentGroupIds.includes(r.id_grupo)));

        if (results.length === 0) {
            return res.status(404).json({ message: 'No results found for this student user' });
        }


        // leitura de todos os resultados para montar ranking global por grupo

        const game = results.map(r => r.id_jogo);
        const rounds = await readData('rodada')
            .then(rds => rds.filter(r => game.includes(r.id_jogo)))
            .then(rds => rds.filter(r => r.status === 'EM ANDAMENTO'))
            .then(rds => rds.map(r => ({ id_scenario: r.id_cenario, round: r.numero_rodada })));


        const infoScenario = await readData('cenario').then(cenarios => cenarios.filter(c => rounds.map(r => r.id_scenario).includes(c.id_cenario)));
        const areaScenario = await readData('area_cenario').then(areas => areas.filter(a => infoScenario.map(i => i.id_cenario).includes(a.id_cenario)));
        const conditionAreaScenario = await readData('condicoes_area_cenario').then(conditions => conditions.filter(cond => areaScenario.map(a => a.id_area_cenario).includes(cond.id_area_cenario)));

        // monta array de ranking com nome do grupo e posição

        const ranking = await getRanking(id_usuario);

        if(ranking.message){
            return res.status(404).json({ message: ranking.message });
        }

        return res.status(200).json({
            user: { name: userExists.nome },
            conditions: conditionAreaScenario.filter(c => c.nome_condicao === "Noticias"),
            ranking,
            results,
            rounds
        });
    }
}