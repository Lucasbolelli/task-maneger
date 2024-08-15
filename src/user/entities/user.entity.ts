import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar', { length: 50, nullable: false})
    name: string;

    @Column('varchar', { length: 255, nullable: false})
    email: string;

    @Column('text', { nullable: true})
    token: string;
}
