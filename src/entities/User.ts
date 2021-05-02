import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BackofficeFolder } from './BackofficeFolder';
@ObjectType()
@Entity()
export class User extends BaseEntity{
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({  unique: true })
  username!: string;

  @Field()
  @Column({  unique: true })
  email!: string;

  @Column()
  password!: string;

  @OneToMany(()=> BackofficeFolder, folder => folder.creator)
  folders!: BackofficeFolder[]


  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
