import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import cors from 'cors';
import 'dotenv-safe/config';
import express from 'express';
import session from 'express-session';
import Redis from 'ioredis';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
// import { sendEmail } from './utils/sendEmail';
import { createConnection } from 'typeorm';
import { COOKIE_NAME, __prod__ } from './constants';
import { BackofficeFolder } from './entities/BackofficeFolder';
import { BackofficePhoto } from './entities/BackofficePhoto';
import { User } from './entities/User';
import { BackofficeFolderResolver } from './resolvers/backofficeFolder';
import { BackofficePhotoResolver } from './resolvers/backofficePhoto';
import { HelloResolver } from './resolvers/hello';
import { UserResolver } from './resolvers/user';
import { MyContext } from './types';

const main = async () => {
  
  const connection = await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    // synchronize: false,
    entities: [BackofficeFolder, BackofficePhoto, User],
  })

  // TODO set synchronize to false and uncomment entity that you want to drop DB for
  // await BackofficeFolder.delete({})
  // await BackofficePhoto.delete({})
  // await User.delete({})

  connection.runMigrations();
  
  const app = express();

  // Redis
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);
  app.set('trust proxy', 1);

  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
  }))

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis as any,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: 'lax',
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET!,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, BackofficeFolderResolver,BackofficePhotoResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log('\x1b[34m', '🏄🏻‍♂️  server started on localhost:4000 ');
  });
};

main();
