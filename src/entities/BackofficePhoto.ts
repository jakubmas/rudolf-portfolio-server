import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BackofficeFolder } from './BackofficeFolder';

@ObjectType()
@Entity()
export class BackofficePhoto extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({  unique: true })
  title!: string;
  
  @Field()
  @Column()
  photoUrl!: string;

  @Field()
  @Column()
  folderId: string

  @Field(()=> BackofficeFolder)
  @ManyToOne(() => BackofficeFolder, folder => folder.photos)
  folder: BackofficeFolder

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date
}
