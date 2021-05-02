import { Arg, Field, InputType, Mutation, ObjectType, Query, Resolver, UseMiddleware } from 'type-graphql';
import { getConnection } from 'typeorm';
import { BackofficePhoto } from '../entities/BackofficePhoto';
import { isAuth } from '../middleware/isAuth';
import { customErrorMessage } from '../utils/validation';

@InputType()
class BackofficePhotoInput{
  @Field()
  title: string
  
  @Field()
  photoUrl: string

  @Field()
  folderId: string
}

@ObjectType()
class BackofficePhotoError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class BackofficePhotoResponse {
  @Field(() => [BackofficePhotoError], { nullable: true })
  errors?: BackofficePhotoError[];

  @Field(() => BackofficePhoto, { nullable: true })
  backofficePhoto?: BackofficePhoto;
}

@Resolver()
export class BackofficePhotoResolver {
  @Query(() => [BackofficePhoto])
  async backofficePhotos(
    @Arg('folderId') folderId: string,
  ): Promise<BackofficePhoto[]> {
    return await getConnection().getRepository(BackofficePhoto).find({relations: ["folder"], where: {folderId}})
  }

  @Mutation(() => BackofficePhotoResponse)
  @UseMiddleware(isAuth)
  async createBackofficePhoto(
    @Arg('input') input: BackofficePhotoInput,
  ): Promise<BackofficePhotoResponse> {

    const backofficePhotoExist = await BackofficePhoto.findOne({title: input.title})
    
    if (backofficePhotoExist) {
      return customErrorMessage('title', 'That title already exists') 
    }

    const backofficePhoto = await BackofficePhoto.create({...input}).save();
    return { backofficePhoto }
  }
}