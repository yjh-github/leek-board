import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('funds')
export class Fund {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  fundCode: string;

  @Column({ length: 100 })
  fundName: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  cost: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  shares: number;

  @Column({ length: 200, nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
