import { Migration } from '@mikro-orm/migrations';

export class Migration20210213215122 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" rename column "test" to "email";');
  }

}
