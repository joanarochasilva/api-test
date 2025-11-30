import jsonServer from 'json-server';
import registerController from './controllers/registerController.js';
import loginController from './controllers/loginController.js';
import userController from './controllers/userController.js';
import gameGetController from './controllers/gameGetController.js';
import roundReports from './controllers/roundReports.js';
import getRounds from './controllers/getRounds.js';
import getRanking from './controllers/getRanking.js';

const dataBasePath = './db.json';

const server = jsonServer.create();
const router = jsonServer.router(dataBasePath);
const middlewares = jsonServer.defaults(
    {
        bodyParser: true
    }
);

server.use(middlewares);

server.post('/cadastro', registerController);
server.post('/login', loginController);
server.get('/user/:id', userController)
server.get('/jogos/:id', gameGetController);
server.get('/noticias/:id', roundReports);
server.get('/rodadas/:id', getRounds);


server.use(router);

server.listen(3001, () => {
    console.log('JSON Server is running on port 3001');
});
