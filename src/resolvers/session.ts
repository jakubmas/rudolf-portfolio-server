import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver, UseMiddleware } from 'type-graphql';
import { Session } from '../entities/Session';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { customErrorMessage } from '../utils/validation';

@InputType()
class SessionInput{
  @Field()
  title: string
}

@ObjectType()
class SessionError {
  @Field()
  field: string;
  @Field()
  message: string;
}
@ObjectType()
class SessionResponse {
  @Field(() => [SessionError], { nullable: true })
  errors?: SessionError[];

  @Field(() => Session, { nullable: true })
  session?: Session;
}

@Resolver()
export class SessionResolver {
  @Query(() => [Session])
  sessions(): Promise<Session[]> {
    return Session.find();
  }

  @Query(() => Session, { nullable: true })
  session(
    @Arg('id') id: string,
  ): Promise<Session | undefined> {
    return Session.findOne( id);
  }

  @Mutation(() => SessionResponse)
  @UseMiddleware(isAuth)
  async createSession(
    @Arg('input') input: SessionInput,
    @Ctx() {req}: MyContext
  ): Promise<SessionResponse> {

    const sessionExist = await Session.findOne({title: input.title})
    if (sessionExist) {
      return customErrorMessage('title', 'That title already exists') 
    }

    const session = await Session.create({...input, creatorId: req.session.userId}).save();
    return { session }
  }

  @Mutation(() => Session, { nullable: true })
  async updateSession(
    @Arg('id') id: string,
    @Arg('title', () => String, { nullable: true }) title: string,
  ): Promise<Session | undefined> {
    const session = await Session.findOne(id)
    
    if (!session) {
      return undefined;
    }

    if (typeof title !== undefined) {
      await Session.update({id}, {title})
    }

    return session;
  }

  @Mutation(() => Boolean)
  async deleteSession(
    @Arg('id') id: string,
  ): Promise<boolean> {
    Session.delete(id)
    return true;
  }
}
