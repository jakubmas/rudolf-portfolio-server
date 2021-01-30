import { MikroORM } from '@mikro-orm/core';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import microConfig from './mikro-orm.config';
import { HelloResolver } from './resolvers/hello';
import { SessionResolver } from './resolvers/session';
import { UserResolver } from './resolvers/user';

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, SessionResolver, UserResolver],
      validate: false,
    }),
    context: () => ({
      em: orm.em,
    }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log('\x1b[34m', '🏄🏻‍♂️  server started on localhost:4000 ');
  });
};

main();
