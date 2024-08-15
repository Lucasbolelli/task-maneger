
import { User } from "src/user/entities/user.entity";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne} from "typeorm";

@Entity()
export class Task {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar', { length: 50, nullable: false})
    title: string;

    @Column('varchar', { length: 255, nullable: false})
    description: string;

    @Column("timestamp", {default: () => 'CURRENT_TIMESTAMP', onUpdate: "CURRENT_TIMESTAMP"})
    inclusiveDate: Date;

    @Column('timestamp', { nullable: false})
    dueDate: Date;

    @Column('int', {nullable: false})
    points: number;

    @Column('varchar', { length: 20, nullable: false})
    status: string;

    @Column('int', { nullable: true})
    priority: number;

    @Column('int', { nullable: false})
    userId: number;
}
