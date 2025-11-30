import { readData } from '../utils/databaseManager.js';

export default async function getRanking(id_usuario) {

    if (!id_usuario) {
        return { message: 'id_usuario is required' };
    }

    const group = await readData('grupo');
    const estudanteGrupo = await readData('estudante_grupo').then(groups => id_usuario ? groups.filter(g => g.id_usuario === id_usuario) : groups);

    if (estudanteGrupo.length === 0) {
        return { message: 'No groups found for this student user' };
    }

    const studentGroupIds = estudanteGrupo.map(g => g.id_grupo);

    if (studentGroupIds.length === 0) {
        return { message: 'No groups found for this student user' };
    }

    const results = await readData('resultado').then(results => results.filter(r => studentGroupIds.includes(r.id_grupo)));

    if (results.length === 0) {
        return { message: 'No results found for this student user' };
    }

    // leitura de todos os resultados para montar ranking global por grupo e por rodada
    const resultsForRanking = await readData('resultado');

    // mapa geral por grupo (acumula market_share e conta partidas)
    const overallScores = resultsForRanking.reduce((acc, r) => {
        const id = r.id_grupo;
        const mshare = Number(r.market_share ?? 0);
        if (!acc[id]) acc[id] = { id_grupo: id, total_market_share: 0, partidas: 0 };
        acc[id].total_market_share += mshare;
        acc[id].partidas += 1;
        return acc;
    }, {});

    if (Object.keys(overallScores).length === 0) {
        return { message: 'No scores found for ranking' };
    }

    // mapa por rodada -> por grupo (usa market_share)
    const perRoundMap = resultsForRanking.reduce((acc, r) => {
        const rodadaId = r.id_rodada;
        const grupoId = r.id_grupo;
        const mshare = Number(r.market_share ?? 0);
        if (!acc[rodadaId]) acc[rodadaId] = {};
        if (!acc[rodadaId][grupoId]) acc[rodadaId][grupoId] = { id_grupo: grupoId, id_rodada: rodadaId, total_market_share: 0, partidas: 0 };
        acc[rodadaId][grupoId].total_market_share += mshare;
        acc[rodadaId][grupoId].partidas += 1;
        return acc;
    }, {});

    const roundResults = await readData('rodada').then(rodada => rodada.map(r => ({ id: r.id_rodada, numero_rodada: r.numero_rodada })));
    
    // monta ranking geral por market_share (média)
    const overallRanking = Object.values(overallScores)
        .map(item => {
            const grp = group.find(g => g.id_grupo === item.id_grupo) || {};
            const avg_marketshare = item.partidas ? (item.total_market_share / item.partidas) : 0;
            return {
                id_grupo: item.id_grupo,
                nome_grupo: grp.nome_grupo ?? grp.nome ?? null,
                partidas: item.partidas,
                total_market_share: item.total_market_share,
                avg_marketshare,
                marketshare_pct: Number((avg_marketshare * 100).toFixed(2)),
                my_group: estudanteGrupo.some(eg => eg.id_grupo === item.id_grupo)
            };
        })
        .sort((a, b) => b.avg_marketshare - a.avg_marketshare)
        .map((it, idx) => ({ ...it, position: idx + 1 }));

    // monta ranking por rodada (cada rodada ordenada por market_share dentro da rodada)
    const rankingByRound = Object.keys(perRoundMap).map(rodId => {
        const groupsObj = perRoundMap[rodId];
        const totalMarketShareRodada = Object.values(groupsObj).reduce((s, it) => s + it.total_market_share, 0) || 0;

        const rankings = Object.values(groupsObj)
            .map(item => {
                const grp = group.find(g => g.id_grupo === item.id_grupo) || {};
                // se houver múltiplos registros por grupo na mesma rodada, usa média; geralmente é único
                const avg_marketshare = item.partidas ? (item.total_market_share / item.partidas) : 0;
                return {
                    id_grupo: item.id_grupo,
                    nome_grupo: grp.nome_grupo ?? grp.nome ?? null,
                    partidas: item.partidas,
                    total_market_share: item.total_market_share,
                    avg_marketshare,
                    marketshare_pct: Number((avg_marketshare * 100).toFixed(2)),
                    my_group: estudanteGrupo.some(eg => eg.id_grupo === item.id_grupo)
                };
            })
            .sort((a, b) => b.avg_marketshare - a.avg_marketshare)
            .map((it, idx) => ({ ...it, position: idx + 1 }));

        const numero_rodada = roundResults.find(r => r.id === rodId || r.id == rodId)?.numero_rodada ?? null;

        return {
            id_rodada: rodId,
            numero_rodada,
            total_market_share_rodada: totalMarketShareRodada,
            rankings
        };
    }).sort((a, b) => {
        // ordenar por id_rodada numérico decrescente se possível
        const na = Number(a.id_rodada);
        const nb = Number(b.id_rodada);
        if (!isNaN(na) && !isNaN(nb)) return nb - na;
        return (b.id_rodada > a.id_rodada) ? 1 : -1;
    });

    return {
        ranking_overall: overallRanking,
        ranking_by_round: rankingByRound
    };
}