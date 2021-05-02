import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver, UseMiddleware } from 'type-graphql';
import { BackofficeFolder } from '../entities/BackofficeFolder';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { customErrorMessage } from '../utils/validation';

@InputType()
class BackofficeFolderInput{
  @Field()
  title: string
}

@ObjectType()
class BackofficeFolderError {
  @Field()
  field: string;
  @Field()
  message: string;
}
@ObjectType()
class BackofficeFolderResponse {
  @Field(() => [BackofficeFolderError], { nullable: true })
  errors?: BackofficeFolderError[];

  @Field(() => BackofficeFolder, { nullable: true })
  backofficeFolder?: BackofficeFolder;
}

@Resolver()
export class BackofficeFolderResolver {
  @Query(() => [BackofficeFolder])
  backofficeFolders(): Promise<BackofficeFolder[]> {
    return BackofficeFolder.find();
  }

  @Query(() => BackofficeFolder, { nullable: true })
  backofficeFolder(
    @Arg('id') id: string,
  ): Promise<BackofficeFolder | undefined> {
    return BackofficeFolder.findOne( id);
  }

  @Mutation(() => BackofficeFolderResponse)
  @UseMiddleware(isAuth)
  async createBackofficeFolder(
    @Arg('input') input: BackofficeFolderInput,
    @Ctx() {req}: MyContext
  ): Promise<BackofficeFolderResponse> {

    const backofficeFolderExist = await BackofficeFolder.findOne({title: input.title})
    if (backofficeFolderExist) {
      return customErrorMessage('title', 'That title already exists') 
    }

    const backofficeFolder = await BackofficeFolder.create({...input, creatorId: req.session.userId}).save();
    return { backofficeFolder }
  }

  @Mutation(() => BackofficeFolder, { nullable: true })
  async updateBackofficeFolder(
    @Arg('id') id: string,
    @Arg('title', () => String, { nullable: true }) title: string,
  ): Promise<BackofficeFolder | undefined> {
    const backofficeFolder = await BackofficeFolder.findOne(id)
    
    if (!backofficeFolder) {
      return undefined;
    }

    if (typeof title !== undefined) {
      await BackofficeFolder.update({id}, {title})
    }

    return backofficeFolder;
  }

  @Mutation(() => Boolean)
  async deleteBackofficeFolder(
    @Arg('id') id: string,
  ): Promise<boolean> {
    BackofficeFolder.delete(id)
    return true;
  }
}
