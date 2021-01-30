import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Session } from '../entities/Session';
import { MyContext } from '../types';

@Resolver()
export class SessionResolver {
  @Query(() => [Session])
  sessions(@Ctx() { em }: MyContext): Promise<Session[]> {
    return em.find(Session, {});
  }

  @Query(() => Session, { nullable: true })
  session(
    @Arg('id') id: number,
    @Ctx() { em }: MyContext
  ): Promise<Session | null> {
    return em.findOne(Session, { id });
  }

  @Mutation(() => Session)
  async createSession(
    @Arg('title') title: string,
    @Ctx() { em }: MyContext
  ): Promise<Session> {
    const session = em.create(Session, { title });
    await em.persistAndFlush(session);
    return session;
  }

  @Mutation(() => Session, { nullable: true })
  async updateSession(
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Session | null> {
    const session = await em.findOne(Session, { id });
    if (!session) {
      return null;
    }

    if (typeof title !== undefined) {
      session.title = title;
      await em.persistAndFlush(session);
    }

    return session;
  }

  @Mutation(() => Boolean)
  async deleteSession(
    @Arg('id') id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    await em.nativeDelete(Session, { id });
    return true;
  }
}
