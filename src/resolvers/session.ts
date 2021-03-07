import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { Session } from '../entities/Session';

@Resolver()
export class SessionResolver {
  @Query(() => [Session])
  sessions(): Promise<Session[]> {
    return Session.find();
  }

  @Query(() => Session, { nullable: true })
  session(
    @Arg('id') id: number,
  ): Promise<Session | undefined> {
    return Session.findOne( id);
  }

  @Mutation(() => Session)
  async createSession(
    @Arg('title') title: string,
  ): Promise<Session> {
    return Session.create({title}).save();
  }

  @Mutation(() => Session, { nullable: true })
  async updateSession(
    @Arg('id') id: number,
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
    @Arg('id') id: number,
  ): Promise<boolean> {
    Session.delete(id)
    return true;
  }
}
