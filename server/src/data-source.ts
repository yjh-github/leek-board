import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Fund } from './entity/Fund';
import { DailyData } from './entity/DailyData';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'fund_board.sqlite',
  synchronize: true,
  logging: false,
  entities: [Fund, DailyData],
  migrations: [],
  subscribers: [],
});
