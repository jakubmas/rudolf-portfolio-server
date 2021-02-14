import argon2 from 'argon2';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver
} from 'type-graphql';
import { COOKIE_NAME } from '../constants';
import { User } from '../entities/User';
import { MyContext } from '../types';
import { customErrorMessage, validateEmail } from '../utils/validation';
@InputType()
class UsernameEmailPasswordInput {
  @Field()
  username: string;
  @Field()
  email: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(()=>Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    // @Ctx() {req} : MyContext
  ) {
    if(!validateEmail(email)){
      return customErrorMessage('email','Email in incorrect')      
    }

    // const user = await em.findOne(User, {email})
    return true
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    try {
      const user = await em.findOne(User, { id: req.session.userId });
      return user;
    } catch (error) {
      return customErrorMessage('username','Username not found')
    }
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernameEmailPasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return customErrorMessage('username','Length must be greater than 2')
    }

    const userExist = await em.findOne(User, { username: options.username });

    if (userExist) {
      return customErrorMessage('username', 'That username is taken') 
    }

    if(!validateEmail(options.email)) {
      return customErrorMessage('email', 'That email is incorrect') 
    }

    const emailExist = await em.findOne(User, {email: options.email})
    
    if (emailExist) {
      return customErrorMessage('email', 'That email is taken') 
    }

    if (options.password.length <= 4) {
      return customErrorMessage('password', 'Password must be greater than 4') 
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      email: options.email,
      password: hashedPassword,
    });
    await em.persistAndFlush(user);

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    console.log('🐶 jestem tu: ', usernameOrEmail)
    const isEmail = validateEmail(usernameOrEmail)
    const user = await em.findOne(User, isEmail ? { email: usernameOrEmail }:{ username: usernameOrEmail });

    if (!user) {
      return customErrorMessage('usernameOrEmail', "That user doesn't exist") 
    }

    const valid = await argon2.verify(user.password, password);

    if (!valid) {
      return customErrorMessage('password', 'incorrect password') 
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log('🔥 err 🔥', err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
