import { Migration } from '@mikro-orm/migrations';

export class Migration20210213215039 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" add column "test" text not null;');
  }

}
