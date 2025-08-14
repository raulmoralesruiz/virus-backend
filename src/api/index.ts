import { Router } from 'express';
import playersController from './player.controller.js';
import roomsController from './room.controller.js';

const apiRouter = Router();

apiRouter.use('/player', playersController);
apiRouter.use('/room', roomsController);

export default apiRouter;
