// src/routes.ts
import express from 'express';
import mainRoutes from './mainRoutes';

export const routes = express.Router();

routes.use(mainRoutes);