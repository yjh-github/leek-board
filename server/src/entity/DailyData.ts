import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('daily_data')
export class DailyData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  fundCode: string;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
  nav: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
  dailyChange: number;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;
}
