import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BackofficePhoto } from './BackofficePhoto';
import { User } from './User';

@ObjectType()
@Entity()
export class BackofficeFolder extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({  unique: true })
  title!: string;

  @Field()
  @Column()
  creatorId: string

  @Field()
  @ManyToOne(() => User, user => user.folders)
  creator: User

  @OneToMany(()=> BackofficePhoto, photo => photo.folder)
  photos: BackofficePhoto[]

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date
}
