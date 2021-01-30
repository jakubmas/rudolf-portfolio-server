import { MikroORM } from '@mikro-orm/core';
import { Session } from './entities/Session';
import microConfig from './mikro-orm.config';

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();
  const session = orm.em.create(Session, { title: 'my first title' });
  await orm.em.persistAndFlush(session);
};

main();
