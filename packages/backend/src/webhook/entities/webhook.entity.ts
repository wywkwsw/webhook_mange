import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../user/entities/user.entity";

@Entity()
export class Webhook {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  path: string;

  @Column({ nullable: true })
  secret: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "jsonb", nullable: true })
  config: Record<string, unknown> | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
