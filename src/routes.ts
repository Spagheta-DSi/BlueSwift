// src/routes.ts
import express from 'express';
import mainRoutes from './mainRoutes';
import auxRoutes from './auxRoutes';

export const routes = express.Router();

routes.use(mainRoutes);
routes.use(auxRoutes);